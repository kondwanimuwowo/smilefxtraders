// Encode/decode checks for the cTrader message layer. Run with:
//
//     npm run check:spotware
//
// Not a test-framework suite — the repo has no test runner — but it exercises
// the real modules (imported, not copied) and exits non-zero on failure, which
// is enough to stop a wire-format regression reaching production. The trendbar
// path is worth this: its bugs are silent, producing plausible-looking candles
// at wrong prices rather than an error.

import { ProtoWriter, field, asNumber } from "./protobuf";
import {
  getTrendbarsReq, parseTrendbars, decodeFrame, splitFrames, PAYLOAD, TRENDBAR_PERIOD,
} from "./messages";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}` +
      (ok ? "" : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`),
  );
}

// ── A trendbar as the server sends it: absolute low + unsigned deltas ────────

function bar(lowRaw: number, dOpen: number, dHigh: number, dClose: number, minutes: number, volume: number) {
  return new ProtoWriter()
    .int64(3, volume)
    .uint32(4, TRENDBAR_PERIOD.H1)
    .int64(5, lowRaw)
    .int64(6, dOpen)
    .int64(7, dClose)
    .int64(8, dHigh)
    .uint32(9, minutes)
    .finish();
}

// EURUSD-ish: low 1.15400, open 1.15520, high 1.15610, close 1.15455
const BAR_A = bar(115400, 120, 210, 55, 29_255_000, 1234);
// One hour later, emitted FIRST to prove ordering is corrected.
const BAR_B = bar(115455, 40, 300, 260, 29_255_060, 987);
// No `low` field — must be dropped. Reconstructing from zero would put a
// candle at price 0 and collapse the whole chart's scale onto it.
const BAR_BAD = new ProtoWriter().int64(3, 5).uint32(9, 29_255_120).finish();

const resPayload = new ProtoWriter()
  .int64(2, 41_234_567)
  .uint32(3, TRENDBAR_PERIOD.H1)
  .bytes_(5, BAR_B)
  .bytes_(5, BAR_A)
  .bytes_(5, BAR_BAD)
  .int64(6, 1)
  .uint32(7, 1)
  .finish();

// Envelope + 4-byte big-endian length prefix, as the socket delivers it.
const body = new ProtoWriter()
  .uint32(1, PAYLOAD.OA_GET_TRENDBARS_RES)
  .bytes_(2, resPayload)
  .string(3, "req-42")
  .finish();
const framed = new Uint8Array(4 + body.length);
new DataView(framed.buffer).setUint32(0, body.length, false);
framed.set(body, 4);

// ── Decode ───────────────────────────────────────────────────────────────────

const { frames, rest } = splitFrames(framed);
check("splitFrames finds exactly one frame", frames.length, 1);
check("splitFrames leaves no remainder", rest.length, 0);

const msg = decodeFrame(frames[0]);
check("payloadType is GET_TRENDBARS_RES", msg.payloadType, 2138);
check("clientMsgId round-trips", msg.clientMsgId, "req-42");

const parsed = parseTrendbars(msg);
check("symbolId", parsed.symbolId, 1);
check("hasMore", parsed.hasMore, true);
check("malformed bar dropped", parsed.bars.length, 2);
check("bars sorted ascending", parsed.bars.map((b) => b.time), [1_755_300_000, 1_755_303_600]);

const a = parsed.bars[0];
check("OHLC from low + deltas", [a.o, a.h, a.l, a.c], [1.1552, 1.1561, 1.154, 1.15455]);
check("volume", a.volume, 1234);
check("high/low bracket the close", a.h >= a.l && a.c >= a.l && a.c <= a.h, true);

// ── Encode ───────────────────────────────────────────────────────────────────
// Millisecond timestamps exceed 2^32; the varint codec must not truncate them.

const FROM = 1_755_300_000_000;
const TO = 1_755_386_400_000;

const reqMsg = decodeFrame(
  getTrendbarsReq({
    ctidTraderAccountId: 41_234_567,
    symbolId: 1,
    period: "H1",
    fromTimestamp: FROM,
    toTimestamp: TO,
    count: 200,
    clientMsgId: "req-42",
  }).slice(4),
);

check("request payloadType", reqMsg.payloadType, 2137);
check("request carries clientMsgId", reqMsg.clientMsgId, "req-42");
check("fromTimestamp survives 64-bit varint", asNumber(field(reqMsg.fields, 3)), FROM);
check("toTimestamp survives 64-bit varint", asNumber(field(reqMsg.fields, 4)), TO);
check("period encodes as H1 = 9", asNumber(field(reqMsg.fields, 5)), 9);
check("symbolId", asNumber(field(reqMsg.fields, 6)), 1);
check("count", asNumber(field(reqMsg.fields, 7)), 200);

// The envelope change must not have disturbed the existing spot messages.
const noId = decodeFrame(new ProtoWriter().uint32(1, PAYLOAD.OA_SPOT_EVENT).finish());
check("clientMsgId absent when unset", noId.clientMsgId, undefined);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
