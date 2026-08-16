// cTrader Open API message envelope, framing, and the specific
// ProtoOA*/Proto* messages this integration sends and receives. Field
// numbers and payload-type IDs come from Spotware's public schema
// (github.com/spotware/openapi-proto-messages) — see cloudflare_migration_plan.md
// Phase 4 for the trace of exactly which files those were pulled from.

import { ProtoWriter, readFields, field, fieldAll, asString, asNumber, asBytes, type ProtoField } from "./protobuf";

// ── Payload types ────────────────────────────────────────────────────────
export const PAYLOAD = {
  HEARTBEAT_EVENT: 51,
  ERROR_RES: 50,
  OA_APPLICATION_AUTH_REQ: 2100,
  OA_APPLICATION_AUTH_RES: 2101,
  OA_ACCOUNT_AUTH_REQ: 2102,
  OA_ACCOUNT_AUTH_RES: 2103,
  OA_SYMBOLS_LIST_REQ: 2114,
  OA_SYMBOLS_LIST_RES: 2115,
  OA_SUBSCRIBE_SPOTS_REQ: 2127,
  OA_SUBSCRIBE_SPOTS_RES: 2128,
  OA_SPOT_EVENT: 2131,
  OA_GET_TRENDBARS_REQ: 2137,
  OA_GET_TRENDBARS_RES: 2138,
  OA_ERROR_RES: 2142,
} as const;

// Open API spot prices are integers scaled by this factor for every symbol.
const PRICE_SCALE = 100_000;

/** ProtoOATrendbarPeriod. Values are the enum's own, not indexes — do not renumber. */
export const TRENDBAR_PERIOD = {
  M1: 1, M2: 2, M3: 3, M4: 4, M5: 5, M10: 6, M15: 7, M30: 8,
  H1: 9, H4: 10, H12: 11, D1: 12, W1: 13, MN1: 14,
} as const;

export type TrendbarPeriod = keyof typeof TRENDBAR_PERIOD;

/** Bar length in seconds, for windowing requests and spotting gaps. */
export const PERIOD_SECONDS: Record<TrendbarPeriod, number> = {
  M1: 60, M2: 120, M3: 180, M4: 240, M5: 300, M10: 600, M15: 900, M30: 1_800,
  H1: 3_600, H4: 14_400, H12: 43_200, D1: 86_400, W1: 604_800, MN1: 2_592_000,
};

// ── Envelope + wire framing ─────────────────────────────────────────────
// ProtoMessage { payloadType: uint32 = 1; payload: bytes = 2; clientMsgId: string = 3 }
// TCP framing: 4-byte big-endian length prefix, then the serialized ProtoMessage.

function envelope(payloadType: number, payload?: Uint8Array, clientMsgId?: string): Uint8Array {
  const w = new ProtoWriter().uint32(1, payloadType);
  if (payload && payload.length) w.bytes_(2, payload);
  // Echoed back on the matching response, which is the only way to tell one
  // in-flight request's reply from another's on a single shared socket.
  if (clientMsgId) w.string(3, clientMsgId);
  const body = w.finish();
  const framed = new Uint8Array(4 + body.length);
  new DataView(framed.buffer).setUint32(0, body.length, false);
  framed.set(body, 4);
  return framed;
}

export interface DecodedMessage {
  payloadType: number;
  /** Present only when we set one on the request this is answering. */
  clientMsgId?: string;
  fields: ProtoField[];
}

/** Splits a byte stream that may contain multiple/partial length-prefixed frames. */
export function splitFrames(buffer: Uint8Array): { frames: Uint8Array[]; rest: Uint8Array } {
  const frames: Uint8Array[] = [];
  let offset = 0;
  while (buffer.length - offset >= 4) {
    const len = new DataView(buffer.buffer, buffer.byteOffset + offset).getUint32(0, false);
    if (buffer.length - offset < 4 + len) break;
    frames.push(buffer.slice(offset + 4, offset + 4 + len));
    offset += 4 + len;
  }
  return { frames, rest: buffer.slice(offset) };
}

export function decodeFrame(frame: Uint8Array): DecodedMessage {
  const fields = readFields(frame);
  const payloadType = asNumber(field(fields, 1)) ?? 0;
  const payload = asBytes(field(fields, 2));
  const clientMsgId = asString(field(fields, 3));
  return { payloadType, clientMsgId, fields: payload ? readFields(payload) : [] };
}

// ── Outgoing messages ────────────────────────────────────────────────────

export function applicationAuthReq(clientId: string, clientSecret: string): Uint8Array {
  const payload = new ProtoWriter().string(2, clientId).string(3, clientSecret).finish();
  return envelope(PAYLOAD.OA_APPLICATION_AUTH_REQ, payload);
}

export function accountAuthReq(ctidTraderAccountId: number, accessToken: string): Uint8Array {
  const payload = new ProtoWriter().int64(2, ctidTraderAccountId).string(3, accessToken).finish();
  return envelope(PAYLOAD.OA_ACCOUNT_AUTH_REQ, payload);
}

export function symbolsListReq(ctidTraderAccountId: number): Uint8Array {
  const payload = new ProtoWriter().int64(2, ctidTraderAccountId).finish();
  return envelope(PAYLOAD.OA_SYMBOLS_LIST_REQ, payload);
}

export function subscribeSpotsReq(ctidTraderAccountId: number, symbolIds: number[]): Uint8Array {
  const w = new ProtoWriter().int64(2, ctidTraderAccountId);
  for (const id of symbolIds) w.int64(3, id);
  return envelope(PAYLOAD.OA_SUBSCRIBE_SPOTS_REQ, w.finish());
}

export function heartbeat(): Uint8Array {
  return envelope(PAYLOAD.HEARTBEAT_EVENT);
}

export interface TrendbarsRequest {
  ctidTraderAccountId: number;
  symbolId:            number;
  period:              TrendbarPeriod;
  /** Epoch **milliseconds** — the Open API takes ms here, unlike the bar timestamps it returns. */
  fromTimestamp:       number;
  toTimestamp:         number;
  count?:              number;
  clientMsgId:         string;
}

/**
 * ProtoOAGetTrendbarsReq. `clientMsgId` is required rather than optional
 * because a trendbar reply is useless without knowing which request it
 * answers — unlike the fire-and-forget messages above.
 *
 * Server-side caps worth respecting at the call site: 14,000 bars per
 * response, and 5 historical requests/second per connection.
 */
export function getTrendbarsReq(req: TrendbarsRequest): Uint8Array {
  const w = new ProtoWriter()
    .int64(2, req.ctidTraderAccountId)
    .int64(3, req.fromTimestamp)
    .int64(4, req.toTimestamp)
    .uint32(5, TRENDBAR_PERIOD[req.period])
    .int64(6, req.symbolId);
  if (req.count != null) w.uint32(7, req.count);
  return envelope(PAYLOAD.OA_GET_TRENDBARS_REQ, w.finish(), req.clientMsgId);
}

// ── Incoming message parsers ─────────────────────────────────────────────

export interface LightSymbol {
  symbolId: number;
  symbolName: string;
}

export function parseSymbolsList(msg: DecodedMessage): LightSymbol[] {
  return fieldAll(msg.fields, 3).flatMap((f) => {
    if (!(f.value instanceof Uint8Array)) return [];
    const symFields = readFields(f.value);
    const symbolId = asNumber(field(symFields, 1));
    const symbolName = asString(field(symFields, 2));
    if (symbolId == null || !symbolName) return [];
    return [{ symbolId, symbolName }];
  });
}

export interface SpotTick {
  symbolId: number;
  bid?: number;
  ask?: number;
}

export function parseSpotEvent(msg: DecodedMessage): SpotTick {
  const symbolId = asNumber(field(msg.fields, 3)) ?? 0;
  const bidRaw = asNumber(field(msg.fields, 4));
  const askRaw = asNumber(field(msg.fields, 5));
  return {
    symbolId,
    bid: bidRaw != null ? bidRaw / PRICE_SCALE : undefined,
    ask: askRaw != null ? askRaw / PRICE_SCALE : undefined,
  };
}

export interface Trendbar {
  /** Bar open time, epoch **seconds** — what lightweight-charts wants for `Time`. */
  time:   number;
  o:      number;
  h:      number;
  l:      number;
  c:      number;
  volume: number;
}

export interface TrendbarsResult {
  symbolId?: number;
  bars:      Trendbar[];
  /** More bars exist beyond this response's range — paginate rather than assume completeness. */
  hasMore:   boolean;
}

/**
 * ProtoOAGetTrendbarsRes.
 *
 * Bars arrive as an absolute `low` plus three unsigned deltas, which is how
 * the wire format keeps them small. Per the proto's own comments:
 *
 *     open = low + deltaOpen, close = low + deltaClose, high = low + deltaHigh
 *
 * A bar missing `low` is dropped rather than reconstructed from zero — that
 * would render as a candle at price 0 and drag the whole chart's scale down
 * to it, which is far more visible than one absent bar.
 */
export function parseTrendbars(msg: DecodedMessage): TrendbarsResult {
  const bars = fieldAll(msg.fields, 5).flatMap((f): Trendbar[] => {
    if (!(f.value instanceof Uint8Array)) return [];
    const bar = readFields(f.value);

    const low     = asNumber(field(bar, 5));
    const minutes = asNumber(field(bar, 9));
    if (low == null || minutes == null) return [];

    const open  = low + (asNumber(field(bar, 6)) ?? 0);
    const close = low + (asNumber(field(bar, 7)) ?? 0);
    const high  = low + (asNumber(field(bar, 8)) ?? 0);

    return [{
      time:   minutes * 60,
      o:      open  / PRICE_SCALE,
      h:      high  / PRICE_SCALE,
      l:      low   / PRICE_SCALE,
      c:      close / PRICE_SCALE,
      volume: asNumber(field(bar, 3)) ?? 0,
    }];
  });

  // lightweight-charts throws on out-of-order data rather than sorting for
  // us, and nothing in the protocol promises ordering.
  bars.sort((a, b) => a.time - b.time);

  return {
    symbolId: asNumber(field(msg.fields, 6)),
    bars,
    hasMore:  asNumber(field(msg.fields, 7)) === 1,
  };
}

export function parseErrorRes(msg: DecodedMessage): { errorCode?: string; description?: string } {
  return {
    errorCode: asString(field(msg.fields, 3)),
    description: asString(field(msg.fields, 4)),
  };
}
