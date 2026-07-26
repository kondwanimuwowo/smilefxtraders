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
  symbolsListReq,
  subscribeSpotsReq,
  heartbeat,
  splitFrames,
  decodeFrame,
  parseSymbolsList,
  parseSpotEvent,
  parseErrorRes,
  PAYLOAD,
  type LightSymbol,
} from "@/lib/spotware/messages";

const SPOTWARE_HOST = "live.ctraderapi.com";
const SPOTWARE_PORT = 5035;
const HEARTBEAT_MS = 25_000;
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;
const TOKEN_URL = "https://openapi.ctrader.com/apps/token";

// cTrader symbol names generally match the platform's display symbols
// directly (no slash) — unmatched names are just skipped, the price route
// falls back to Twelve Data for those.
const TARGET_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"];

export interface Env {
  SPOTWARE_CLIENT_ID: string;
  SPOTWARE_CLIENT_SECRET: string;
  SPOTWARE_REFRESH_TOKEN: string;
  SPOTWARE_CTID_ACCOUNT_ID: string;
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

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
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

  async alarm(): Promise<void> {
    if (this.conn === "authed" && this.writer) {
      try {
        await this.writer.write(heartbeat());
        await this.state.storage.setAlarm(Date.now() + HEARTBEAT_MS);
        return;
      } catch {
        // fall through to reconnect
      }
    }
    if (this.sockets.size > 0) void this.ensureConnected();
  }

  private async ensureConnected(): Promise<void> {
    if (this.conn === "connecting" || this.conn === "authed") return;
    this.conn = "connecting";

    try {
      const accountId = Number(this.env.SPOTWARE_CTID_ACCOUNT_ID);
      this.accessToken = await this.refreshAccessToken();

      const socket = connect(
        { hostname: SPOTWARE_HOST, port: SPOTWARE_PORT },
        { secureTransport: "on", allowHalfOpen: false }
      );
      this.socket = socket;
      const writer = socket.writable.getWriter();
      this.writer = writer;

      await writer.write(applicationAuthReq(this.env.SPOTWARE_CLIENT_ID, this.env.SPOTWARE_CLIENT_SECRET));
      await writer.write(accountAuthReq(accountId, this.accessToken));
      await writer.write(symbolsListReq(accountId));

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
        const wanted = new Set(TARGET_SYMBOLS);
        const matched = symbols.filter((s) => wanted.has(s.symbolName));
        this.symbolById = new Map(matched.map((s) => [s.symbolId, s.symbolName]));
        if (matched.length && this.writer) {
          await this.writer.write(subscribeSpotsReq(accountId, matched.map((s) => s.symbolId)));
        }
        break;
      }
      case PAYLOAD.OA_SUBSCRIBE_SPOTS_RES:
        this.conn = "authed";
        this.reconnectDelay = RECONNECT_BASE_MS;
        await this.state.storage.setAlarm(Date.now() + HEARTBEAT_MS);
        break;
      case PAYLOAD.OA_SPOT_EVENT: {
        const tick = parseSpotEvent(msg);
        const sym = this.symbolById.get(tick.symbolId);
        const price = tick.bid ?? tick.ask;
        if (sym && price != null) this.broadcast(sym, price);
        break;
      }
      case PAYLOAD.OA_ERROR_RES: {
        const err = parseErrorRes(msg);
        console.error(`[spotware] error: ${err.errorCode} ${err.description ?? ""}`);
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

  private handleDisconnect() {
    this.conn = "closed";
    this.socket = null;
    this.writer = null;
    if (this.sockets.size === 0) return; // nothing to serve — stay idle until a client connects
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

    const res = await fetch(url.toString(), { method: "POST" });
    if (!res.ok) throw new Error(`Spotware token refresh failed: ${res.status}`);
    const data = (await res.json()) as { access_token: string; refresh_token?: string };

    if (data.refresh_token) await this.state.storage.put("refreshToken", data.refresh_token);
    return data.access_token;
  }
}
