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
  OA_ERROR_RES: 2142,
} as const;

// Open API spot prices are integers scaled by this factor for every symbol.
const PRICE_SCALE = 100_000;

// ── Envelope + wire framing ─────────────────────────────────────────────
// ProtoMessage { payloadType: uint32 = 1; payload: bytes = 2; clientMsgId: string = 3 }
// TCP framing: 4-byte big-endian length prefix, then the serialized ProtoMessage.

function envelope(payloadType: number, payload?: Uint8Array): Uint8Array {
  const w = new ProtoWriter().uint32(1, payloadType);
  if (payload && payload.length) w.bytes_(2, payload);
  const body = w.finish();
  const framed = new Uint8Array(4 + body.length);
  new DataView(framed.buffer).setUint32(0, body.length, false);
  framed.set(body, 4);
  return framed;
}

export interface DecodedMessage {
  payloadType: number;
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
  return { payloadType, fields: payload ? readFields(payload) : [] };
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

export function parseErrorRes(msg: DecodedMessage): { errorCode?: string; description?: string } {
  return {
    errorCode: asString(field(msg.fields, 3)),
    description: asString(field(msg.fields, 4)),
  };
}
