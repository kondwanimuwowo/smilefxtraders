// Holds the one persistent connection to the cTrader Open API (TCP+TLS,
// live.ctraderapi.com:5035) and re-broadcasts spot price ticks to every
// connected browser via WebSocket. See spotware_api_plan.md for the
// integration's scope/design and cloudflare_migration_plan.md Phase 4 for
// where the protobuf message details came from.
//
// One object instance for the whole platform (id "default") — the plan is
// single-account live prices shared by all visitors, not per-user broker
// connections.

import { connect } from "cloudflare:sockets";
import {
  applicationAuthReq,
  accountAuthReq,
  accountListReq,
  symbolsListReq,
  subscribeSpotsReq,
  getTrendbarsReq,
  heartbeat,
  splitFrames,
  decodeFrame,
  parseSymbolsList,
  parseAccountList,
  parseSpotEvent,
  parseTrendbars,
  parseErrorRes,
  PAYLOAD,
  TRENDBAR_PERIOD,
  PERIOD_SECONDS,
  type LightSymbol,
  type TrendbarPeriod,
  type TrendbarsResult,
} from "@/lib/spotware/messages";

// Protobuf is port 5035 and only 5035 (5036 is the JSON variant). Demo and
// live are fully separated environments: a demo account authorised against
// live.ctraderapi.com fails account auth, so SPOTWARE_HOST exists to switch
// without a deploy.
const DEFAULT_SPOTWARE_HOST = "live.ctraderapi.com";
const SPOTWARE_PORT = 5035;

// Nothing in the handshake throws when the far side simply goes quiet — no
// socket close, no error frame. Without this the object sits in "connecting"
// for ever, every later attempt early-returns, and it never says why.
const CONNECT_TIMEOUT_MS = 20_000;
const TOKEN_TIMEOUT_MS = 8_000;
const HEARTBEAT_MS = 25_000;
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;
const TOKEN_URL = "https://openapi.ctrader.com/apps/token";

// How long a /snapshot request keeps the broker connection worth holding open
// after the last WebSocket client leaves. Without this the feed would drop the
// moment nobody has the ticker on screen, and every snapshot poll would pay a
// cold TCP+TLS+auth handshake it can't wait for.
const SNAPSHOT_DEMAND_MS = 5 * 60_000;
const PRICES_KEY = "lastPrices";

// Spotware allows 5 historical requests/second per connection. Serialising to
// one every 200ms keeps us under it without tracking a sliding window, and
// charts are not latency-critical enough to want the extra complexity.
const HISTORY_SLOT_MS = 200;
// A trendbar reply that never arrives must not leak the promise waiting on it.
const REQUEST_TIMEOUT_MS = 10_000;
// Time allowed for a cold object to finish TCP + TLS + app auth + account auth
// + symbols list before a caller gives up.
const READY_TIMEOUT_MS = 12_000;
// Server-side cap; asking for more is rejected rather than silently truncated.
const MAX_BARS = 14_000;

// A closed candle never changes, so a window that ended in the past can be
// held for a long time. A window running up to now still contains the forming
// bar, which changes every tick — hold that only until the bar closes.
const CACHE_KEY_PREFIX = "tb:";
const CLOSED_WINDOW_TTL_MS = 7 * 24 * 60 * 60_000;
// A Durable Object storage value is capped at 128 KiB; ~1500 bars of JSON sits
// comfortably under it, and nothing the charts ask for comes close.
const MAX_CACHED_BARS = 1_500;
const MAX_CACHE_ENTRIES = 300;

interface CachedBars {
  bars:     TrendbarsResult["bars"];
  hasMore:  boolean;
  storedAt: number;
  expires:  number;
}

// cTrader symbol names generally match the platform's display symbols
// directly (no slash) — unmatched names are just skipped, the price route
// falls back to Twelve Data for those.
//
// EURGBP is here for the FX option expiry cards rather than the ticker: it is
// one of the eight pairs in PAIRS_ORDER (src/types/fx-orders.ts) but is not a
// ticker instrument.
const TARGET_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "EURGBP", "XAUUSD", "NAS100"];

/** Last seen price per symbol. `at` is epoch ms, so consumers can reject stale quotes. */
export interface PriceSnapshot {
  prices:    Record<string, number>;
  at:        Record<string, number>;
  connected: boolean;
}

export interface Env {
  SPOTWARE_CLIENT_ID: string;
  SPOTWARE_CLIENT_SECRET: string;
  SPOTWARE_REFRESH_TOKEN: string;
  SPOTWARE_CTID_ACCOUNT_ID: string;
  /** Optional. Set to demo.ctraderapi.com when the authorised account is a demo account. */
  SPOTWARE_HOST?: string;
}

type ConnState = "idle" | "connecting" | "authed" | "closed";

export class SpotwareFeed {
  private state: DurableObjectState;
  private env: Env;
  private sockets = new Set<WebSocket>();
  private conn: ConnState = "idle";
  private socket: Socket | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private symbolById = new Map<number, string>();
  private reconnectDelay = RECONNECT_BASE_MS;
  private accessToken: string | null = null;
  private connectWatchdog: ReturnType<typeof setTimeout> | null = null;
  private lastPrices = new Map<string, { price: number; at: number }>();
  private lastDemandAt = 0;
  private pricesDirty = false;

  // Every symbol the broker offers, not just the subscribed ones: charts need
  // to look up ids for pairs the ticker never streams.
  private symbolIdByName = new Map<string, number>();

  // The object was a broadcaster — write a request, re-emit whatever arrives.
  // Trendbars need the opposite: a caller awaiting *its own* reply on a socket
  // shared with everyone else's. clientMsgId is what tells them apart.
  private pending = new Map<string, { resolve: (r: TrendbarsResult) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private readyWaiters: Array<{ resolve: () => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }> = [];
  private historyGate: Promise<void> = Promise.resolve();
  private nextHistorySlot = 0;
  private requestSeq = 0;
  // Two people opening the same trade at once should cost one broker request,
  // not two — this matters more than usual against a 5/sec budget.
  private inflight = new Map<string, Promise<TrendbarsResult>>();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Survive eviction: a Durable Object is torn down whenever it goes idle,
    // and rebuilding the price map from scratch means the first snapshot after
    // every quiet spell falls back to Twelve Data. Restoring the last
    // persisted map makes that gap a stale-price decision (which the consumer
    // makes on `at`) instead of a no-data one.
    state.blockConcurrencyWhile(async () => {
      const stored = await state.storage.get<Record<string, { price: number; at: number }>>(PRICES_KEY);
      if (stored) this.lastPrices = new Map(Object.entries(stored));
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/snapshot")) {
      return this.handleSnapshot();
    }
    if (url.pathname.endsWith("/trendbars")) {
      return this.handleTrendbars(url);
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();
    this.sockets.add(server);
    server.addEventListener("close", () => this.sockets.delete(server));
    server.addEventListener("error", () => this.sockets.delete(server));

    void this.ensureConnected();

    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * Point-in-time prices for callers that want a value now rather than a
   * stream — the FX option expiry cards, via /api/fx-orders/spot.
   *
   * Answers from cache and never waits on the broker: a cold object returns an
   * empty map immediately and the caller falls back to Twelve Data, while the
   * connection it kicks off here warms the cache for the next poll. Blocking
   * on a TCP+TLS+auth handshake would just move the delay onto the request.
   */
  /**
   * Historical candles: /trendbars?symbol=EURUSD&period=H1&from=<ms>&to=<ms>[&count=]
   *
   * Unlike /snapshot this genuinely waits — there is no cached answer to fall
   * back to, and a chart with no data is the only alternative. Every failure
   * is an explicit status rather than an empty bar array, because "no candles"
   * rendered as an empty chart is indistinguishable from a quiet market.
   */
  private async handleTrendbars(url: URL): Promise<Response> {
    this.lastDemandAt = Date.now();

    const symbol = url.searchParams.get("symbol") ?? "";
    const period = url.searchParams.get("period") as TrendbarPeriod | null;
    // Read as strings first: Number(null) is 0, which is finite and would sail
    // through the range check below as "1 Jan 1970".
    const fromP  = url.searchParams.get("from");
    const toP    = url.searchParams.get("to");
    const countP = url.searchParams.get("count");
    const from   = Number(fromP);
    const to     = Number(toP);
    const count  = countP == null ? undefined : Number(countP);

    if (!symbol || !period || !(period in TRENDBAR_PERIOD)) {
      return Response.json({ error: "symbol and a valid period are required" }, { status: 400 });
    }
    if (fromP == null || toP == null || !Number.isFinite(from) || !Number.isFinite(to) || to <= from || from <= 0) {
      return Response.json({ error: "from/to must be epoch ms with to > from" }, { status: 400 });
    }
    if (count != null && (!Number.isInteger(count) || count < 1 || count > MAX_BARS)) {
      return Response.json({ error: `count must be 1..${MAX_BARS}` }, { status: 400 });
    }

    try {
      await this.waitUntilAuthed();
    } catch {
      return Response.json({ error: "Broker feed unavailable" }, { status: 503 });
    }

    const symbolId = this.symbolIdByName.get(symbol);
    if (symbolId == null) {
      // A symbol the broker does not offer under that name. 404, never an
      // empty chart — see charts_plan.md: a missing chart is fine, an invented
      // or silently-empty one is not.
      return Response.json({ error: `Unknown symbol "${symbol}"` }, { status: 404 });
    }

    // Snap the window to bar boundaries before it becomes a cache key.
    // Un-aligned windows differ by milliseconds between callers and would miss
    // every time, turning the cache into pure overhead.
    const periodMs   = PERIOD_SECONDS[period] * 1_000;
    const alignedTo  = Math.ceil(to / periodMs) * periodMs;
    const alignedFrom = Math.floor(from / periodMs) * periodMs;
    const key = `${CACHE_KEY_PREFIX}${symbol}:${period}:${alignedFrom}:${alignedTo}${count != null ? `:${count}` : ""}`;

    const cached = await this.state.storage.get<CachedBars>(key).catch(() => undefined);
    if (cached && cached.expires > Date.now()) {
      return Response.json({ symbol, period, bars: cached.bars, hasMore: cached.hasMore, cached: true });
    }

    try {
      let run = this.inflight.get(key);
      if (!run) {
        run = this.requestTrendbars({ symbolId, period, from: alignedFrom, to: alignedTo, count });
        this.inflight.set(key, run);
        run.finally(() => this.inflight.delete(key)).catch(() => {});
      }
      const result = await run;

      void this.cacheBars(key, result, alignedTo, periodMs);
      return Response.json({ symbol, period, bars: result.bars, hasMore: result.hasMore, cached: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[spotware] trendbars failed:", message);
      return Response.json({ error: message }, { status: 502 });
    }
  }

  private async cacheBars(key: string, result: TrendbarsResult, alignedTo: number, periodMs: number) {
    if (result.bars.length === 0 || result.bars.length > MAX_CACHED_BARS) return;

    // A window ending in the past holds only closed bars and is immutable.
    // One running up to now still contains the forming bar, so it is only good
    // until that bar closes.
    const now = Date.now();
    const expires = alignedTo <= now ? now + CLOSED_WINDOW_TTL_MS : now + periodMs;

    try {
      await this.state.storage.put(key, {
        bars: result.bars, hasMore: result.hasMore, storedAt: now, expires,
      } satisfies CachedBars);
      await this.pruneCache();
    } catch (e) {
      // A cache write failing costs a broker request next time, nothing more.
      console.error("[spotware] cache write failed:", e instanceof Error ? e.message : e);
    }
  }

  /** Keeps cached windows bounded — storage is durable, so nothing expires on its own. */
  private async pruneCache() {
    const entries = await this.state.storage.list<CachedBars>({ prefix: CACHE_KEY_PREFIX });
    if (entries.size <= MAX_CACHE_ENTRIES) return;

    const now = Date.now();
    const ranked = [...entries.entries()].sort((a, b) => {
      const aDead = a[1].expires <= now ? 0 : 1;
      const bDead = b[1].expires <= now ? 0 : 1;
      return aDead - bDead || a[1].storedAt - b[1].storedAt; // expired first, then oldest
    });
    const doomed = ranked.slice(0, entries.size - MAX_CACHE_ENTRIES).map(([k]) => k);
    if (doomed.length) await this.state.storage.delete(doomed);
  }

  private async requestTrendbars(opts: {
    symbolId: number;
    period:   TrendbarPeriod;
    from:     number;
    to:       number;
    count?:   number;
  }): Promise<TrendbarsResult> {
    await this.takeHistorySlot();

    const writer = this.writer;
    if (!writer || this.conn !== "authed") throw new Error("Broker connection dropped");

    const clientMsgId = `tb-${++this.requestSeq}-${Date.now().toString(36)}`;

    const settled = new Promise<TrendbarsResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(clientMsgId);
        reject(new Error("Timed out waiting for trendbars"));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(clientMsgId, { resolve, reject, timer });
    });

    try {
      await writer.write(getTrendbarsReq({
        ctidTraderAccountId: Number(this.env.SPOTWARE_CTID_ACCOUNT_ID),
        symbolId:            opts.symbolId,
        period:              opts.period,
        fromTimestamp:       opts.from,
        toTimestamp:         opts.to,
        count:               opts.count,
        clientMsgId,
      }));
    } catch (e) {
      const entry = this.pending.get(clientMsgId);
      if (entry) {
        clearTimeout(entry.timer);
        this.pending.delete(clientMsgId);
      }
      throw e;
    }

    return settled;
  }

  /** Serialises historical requests to one per HISTORY_SLOT_MS, staying inside Spotware's 5/sec. */
  private takeHistorySlot(): Promise<void> {
    const run = this.historyGate.then(async () => {
      const now  = Date.now();
      const wait = Math.max(0, this.nextHistorySlot - now);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.nextHistorySlot = Math.max(now, this.nextHistorySlot) + HISTORY_SLOT_MS;
    });
    this.historyGate = run.catch(() => {});
    return run;
  }

  /** Resolves once the socket is authed and the symbols list has landed. */
  private waitUntilAuthed(): Promise<void> {
    if (this.conn === "authed") return Promise.resolve();
    void this.ensureConnected();
    return new Promise<void>((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        timer: setTimeout(() => {
          this.readyWaiters = this.readyWaiters.filter((w) => w !== waiter);
          reject(new Error("Timed out connecting to broker"));
        }, READY_TIMEOUT_MS),
      };
      this.readyWaiters.push(waiter);
    });
  }

  private releaseReadyWaiters(err?: Error) {
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const w of waiters) {
      clearTimeout(w.timer);
      if (err) w.reject(err);
      else w.resolve();
    }
  }

  private failPending(err: Error) {
    const entries = [...this.pending.values()];
    this.pending.clear();
    for (const p of entries) {
      clearTimeout(p.timer);
      p.reject(err);
    }
  }

  private handleSnapshot(): Response {
    this.lastDemandAt = Date.now();
    void this.ensureConnected();

    const snapshot: PriceSnapshot = { prices: {}, at: {}, connected: this.conn === "authed" };
    for (const [sym, { price, at }] of this.lastPrices) {
      snapshot.prices[sym] = price;
      snapshot.at[sym] = at;
    }
    return Response.json(snapshot);
  }

  /** Whether anything is still reading this feed — a live socket, or a recent snapshot poll. */
  private hasDemand(): boolean {
    return (
      this.sockets.size > 0 ||
      this.pending.size > 0 ||
      Date.now() - this.lastDemandAt < SNAPSHOT_DEMAND_MS
    );
  }

  async alarm(): Promise<void> {
    await this.persistPrices();

    if (this.conn === "authed" && this.writer) {
      try {
        await this.writer.write(heartbeat());
        await this.state.storage.setAlarm(Date.now() + HEARTBEAT_MS);
        return;
      } catch {
        // fall through to reconnect
      }
    }
    if (this.hasDemand()) void this.ensureConnected();
  }

  /**
   * Flushed on the heartbeat alarm rather than per tick — ticks arrive several
   * times a second per symbol, and a storage write on each one would be orders
   * of magnitude more expensive than the data is worth.
   */
  private async persistPrices(): Promise<void> {
    if (!this.pricesDirty) return;
    this.pricesDirty = false;
    try {
      await this.state.storage.put(PRICES_KEY, Object.fromEntries(this.lastPrices));
    } catch (e) {
      console.error("[spotware] price persist failed:", e instanceof Error ? e.message : e);
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.conn === "connecting" || this.conn === "authed") return;
    this.conn = "connecting";

    // The handshake has four steps and used to log none of them, so a failure
    // anywhere between "idle" and "authed" was indistinguishable from silence.
    // That is precisely the state this object was found in.
    const host = this.env.SPOTWARE_HOST || DEFAULT_SPOTWARE_HOST;
    this.connectWatchdog = setTimeout(() => {
      if (this.conn === "authed") return;
      console.error(
        `[spotware] handshake stalled against ${host}:${SPOTWARE_PORT} — no SUBSCRIBE_SPOTS_RES within ${CONNECT_TIMEOUT_MS}ms. ` +
          "Demo and live are separate environments; a demo account authorised against live fails here silently.",
      );
      this.handleDisconnect();
    }, CONNECT_TIMEOUT_MS);

    try {
      const accountId = Number(this.env.SPOTWARE_CTID_ACCOUNT_ID);
      if (!Number.isFinite(accountId) || accountId <= 0) {
        throw new Error(`SPOTWARE_CTID_ACCOUNT_ID is not a positive number ("${this.env.SPOTWARE_CTID_ACCOUNT_ID}")`);
      }

      this.accessToken = await this.refreshAccessToken();
      console.info(`[spotware] access token obtained; dialling ${host}:${SPOTWARE_PORT} for account ${accountId}`);

      const socket = connect(
        { hostname: host, port: SPOTWARE_PORT },
        { secureTransport: "on", allowHalfOpen: false }
      );
      this.socket = socket;
      const writer = socket.writable.getWriter();
      this.writer = writer;

      await writer.write(applicationAuthReq(this.env.SPOTWARE_CLIENT_ID, this.env.SPOTWARE_CLIENT_SECRET));
      // App-level, so it needs no account authorisation — which is exactly why
      // it is sent before account auth. When account auth is rejected, this is
      // what says which accounts the token *does* cover, and whether they are
      // live or demo.
      await writer.write(accountListReq(this.accessToken));
      await writer.write(accountAuthReq(accountId, this.accessToken));
      await writer.write(symbolsListReq(accountId));
      console.info("[spotware] auth + symbols requests written, awaiting responses");

      void this.readLoop(socket, accountId);

      socket.closed
        .catch(() => {})
        .then(() => this.handleDisconnect());
    } catch (e) {
      console.error("[spotware] connect failed:", e instanceof Error ? e.message : e);
      this.handleDisconnect();
    }
  }

  private async readLoop(socket: Socket, accountId: number) {
    const reader = socket.readable.getReader();
    let buffer = new Uint8Array(0);

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const merged = new Uint8Array(buffer.length + value.length);
        merged.set(buffer);
        merged.set(value, buffer.length);
        const { frames, rest } = splitFrames(merged);
        buffer = rest;

        for (const frame of frames) {
          await this.handleFrame(decodeFrame(frame), accountId);
        }
      }
    } catch (e) {
      console.error("[spotware] read loop error:", e instanceof Error ? e.message : e);
    }
  }

  private async handleFrame(msg: ReturnType<typeof decodeFrame>, accountId: number) {
    switch (msg.payloadType) {
      case PAYLOAD.OA_SYMBOLS_LIST_RES: {
        const symbols: LightSymbol[] = parseSymbolsList(msg);
        // Keep the full name→id map, not just the subscribed subset: charts
        // request bars for pairs the ticker never streams.
        this.symbolIdByName = new Map(symbols.map((s) => [s.symbolName, s.symbolId]));

        const wanted = new Set(TARGET_SYMBOLS);
        const matched = symbols.filter((s) => wanted.has(s.symbolName));
        this.symbolById = new Map(matched.map((s) => [s.symbolId, s.symbolName]));

        const missing = TARGET_SYMBOLS.filter((t) => !this.symbolIdByName.has(t));
        if (missing.length) {
          // Named explicitly: an unmatched symbol silently falls back to Twelve
          // Data and is otherwise invisible. EURGBP is the one to watch.
          console.info(`[spotware] symbols not offered by broker: ${missing.join(", ")}`);
        }

        if (matched.length && this.writer) {
          await this.writer.write(subscribeSpotsReq(accountId, matched.map((s) => s.symbolId)));
        }
        break;
      }
      case PAYLOAD.OA_APPLICATION_AUTH_RES:
        console.info("[spotware] application auth accepted");
        break;
      case PAYLOAD.OA_GET_ACCOUNTS_BY_TOKEN_RES: {
        const accounts = parseAccountList(msg);
        const configured = Number(this.env.SPOTWARE_CTID_ACCOUNT_ID);
        const listed = accounts
          .map((a) => `${a.ctidTraderAccountId} (${a.isLive ? "LIVE" : "DEMO"}${a.broker ? `, ${a.broker}` : ""}${a.traderLogin ? `, login ${a.traderLogin}` : ""})`)
          .join(" | ");
        console.info(`[spotware] token authorises ${accounts.length} account(s): ${listed || "none"}`);

        const match = accounts.find((a) => a.ctidTraderAccountId === configured);
        if (!match) {
          console.error(
            `[spotware] SPOTWARE_CTID_ACCOUNT_ID=${configured} is NOT among them — set it to one of the ids above.`,
          );
        } else {
          const host = this.env.SPOTWARE_HOST || DEFAULT_SPOTWARE_HOST;
          const wantHost = match.isLive ? "live.ctraderapi.com" : "demo.ctraderapi.com";
          if (host !== wantHost) {
            console.error(
              `[spotware] account ${configured} is ${match.isLive ? "LIVE" : "DEMO"} but connecting to ${host}. ` +
                `Set SPOTWARE_HOST=${wantHost} — the environments are fully separated.`,
            );
          }
        }
        break;
      }
      case PAYLOAD.OA_ACCOUNT_AUTH_RES:
        console.info("[spotware] account auth accepted");
        break;
      case PAYLOAD.OA_SUBSCRIBE_SPOTS_RES:
        this.conn = "authed";
        this.reconnectDelay = RECONNECT_BASE_MS;
        this.clearConnectWatchdog();
        this.releaseReadyWaiters();
        console.info("[spotware] connected — spot subscription live");
        await this.state.storage.setAlarm(Date.now() + HEARTBEAT_MS);
        break;
      case PAYLOAD.OA_GET_TRENDBARS_RES: {
        const id = msg.clientMsgId;
        const waiting = id ? this.pending.get(id) : undefined;
        if (!waiting || !id) break; // late reply to a request we already gave up on
        clearTimeout(waiting.timer);
        this.pending.delete(id);
        waiting.resolve(parseTrendbars(msg));
        break;
      }
      case PAYLOAD.OA_SPOT_EVENT: {
        const tick = parseSpotEvent(msg);
        const sym = this.symbolById.get(tick.symbolId);
        const price = tick.bid ?? tick.ask;
        if (sym && price != null) {
          this.lastPrices.set(sym, { price, at: Date.now() });
          this.pricesDirty = true;
          this.broadcast(sym, price);
        }
        break;
      }
      case PAYLOAD.OA_ERROR_RES: {
        const err = parseErrorRes(msg);
        console.error(`[spotware] error: ${err.errorCode} ${err.description ?? ""}`);
        // An error carrying a clientMsgId is *that* request's answer. Before,
        // it was only logged — the caller would have sat there until its
        // timeout for a reply that was never coming.
        const id = msg.clientMsgId;
        const waiting = id ? this.pending.get(id) : undefined;
        if (waiting && id) {
          clearTimeout(waiting.timer);
          this.pending.delete(id);
          waiting.reject(new Error(err.description ?? err.errorCode ?? "Broker rejected the request"));
        }
        break;
      }
      default:
        break; // heartbeats and auth-response acks need no action
    }
  }

  private broadcast(sym: string, price: number) {
    const fmt = sym === "NAS100" || price > 1000 ? price.toFixed(1) : price > 10 ? price.toFixed(2) : price.toFixed(5);
    const payload = JSON.stringify({ sym, price: fmt });
    for (const ws of this.sockets) {
      try {
        ws.send(payload);
      } catch {
        this.sockets.delete(ws);
      }
    }
  }

  private clearConnectWatchdog() {
    if (this.connectWatchdog) clearTimeout(this.connectWatchdog);
    this.connectWatchdog = null;
  }

  private handleDisconnect() {
    this.conn = "closed";
    this.socket = null;
    this.writer = null;
    this.clearConnectWatchdog();

    // Anything mid-flight is now unanswerable. Rejecting immediately turns a
    // 10s hang into a fast 502 the client can retry.
    const dropped = new Error("Broker connection dropped");
    this.failPending(dropped);
    this.releaseReadyWaiters(dropped);

    if (!this.hasDemand()) return; // nothing to serve — stay idle until a client connects or polls
    const delay = Math.min(this.reconnectDelay, RECONNECT_MAX_MS);
    this.reconnectDelay = delay * 2;
    void this.state.storage.setAlarm(Date.now() + delay);
  }

  /** Exchanges the stored refresh token for a fresh access token, persisting the rotated refresh token cTrader returns. */
  private async refreshAccessToken(): Promise<string> {
    const stored = await this.state.storage.get<string>("refreshToken");
    const refreshToken = stored ?? this.env.SPOTWARE_REFRESH_TOKEN;

    const url = new URL(TOKEN_URL);
    url.searchParams.set("grant_type", "refresh_token");
    url.searchParams.set("refresh_token", refreshToken);
    url.searchParams.set("client_id", this.env.SPOTWARE_CLIENT_ID);
    url.searchParams.set("client_secret", this.env.SPOTWARE_CLIENT_SECRET);

    // Timed: an un-aborted fetch here hangs the whole handshake with the
    // object stuck in "connecting" and nothing logged.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url.toString(), { method: "POST", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      // The body carries cTrader's own reason (invalid_grant when the refresh
      // token has been spent or revoked) — worth far more than the status.
      const detail = await res.text().catch(() => "");
      throw new Error(`Spotware token refresh failed: ${res.status} ${detail.slice(0, 200)}`);
    }
    const data = (await res.json()) as { access_token: string; refresh_token?: string; errorCode?: string };
    if (!data.access_token) {
      throw new Error(`Spotware token refresh returned no access_token${data.errorCode ? ` (${data.errorCode})` : ""}`);
    }

    if (data.refresh_token) await this.state.storage.put("refreshToken", data.refresh_token);
    return data.access_token;
  }
}
