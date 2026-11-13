// Behavioural checks for the structure engine. Run with `npm run check:trend`.

import { computeStructure, marketMsBetween, isAutoFresh, type StructureBar } from "./structure";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Builds bars from a close path. Each bar spans its open (previous close) and close, plus a small wick. */
function path(closes: number[]): StructureBar[] {
  return closes.map((c, i) => {
    const o = i === 0 ? c : closes[i - 1];
    return { time: i * 86_400, h: Math.max(o, c) + 0.1, l: Math.min(o, c) - 0.1, c };
  });
}

/** Zig-zag: legs of `up` bars rising then `down` bars falling, repeated, drifting by the leg sizes. */
function zigzag(start: number, legs: [number, number][], step = 1): number[] {
  const out: number[] = [start];
  for (const [up, down] of legs) {
    for (let i = 0; i < up; i++)   out.push(out.at(-1)! + step);
    for (let i = 0; i < down; i++) out.push(out.at(-1)! - step);
  }
  return out;
}

const P = { k: 3, window: 30 };

// Higher highs and higher lows: each leg rises 6 and pulls back 4.
const up = computeStructure(path(zigzag(100, Array(8).fill([6, 4]))), P);
check("staircase up reads bullish", up.bias === "bullish", up.bias);
check("staircase up ends on a BOS", up.lastBreak?.type === "BOS" && up.lastBreak.dir === "bullish", JSON.stringify(up.lastBreak));

const down = computeStructure(path(zigzag(200, Array(8).fill([4, 6]))), P);
check("staircase down reads bearish", down.bias === "bearish", down.bias);

// Uptrend, then one decisive leg down through the last higher low.
const flip = computeStructure(path([...zigzag(100, Array(6).fill([6, 4])), ...Array.from({ length: 12 }, (_, i) => 111 - i * 1.5)]), P);
check("one CHoCH starts a new trend", flip.bias === "bearish" && flip.lastBreak?.type === "CHoCH", `${flip.bias} ${JSON.stringify(flip.lastBreak)}`);

// Uptrend, a CHoCH down, then a CHoCH back up within the window: a range.
const chopCloses = [
  ...zigzag(100, Array(6).fill([6, 4])),   // trend up, ends ~112
  ...zigzag(112, [[0, 8], [5, 0]]),          // break down, then back up
  ...zigzag(109, [[0, 4], [9, 0]]),          // and through the high again
];
const chop = computeStructure(path(chopCloses), P);
check("two CHoCHs without a BOS read ranging", chop.bias === "ranging", `${chop.bias} ${JSON.stringify(chop.lastBreak)}`);

const flat = computeStructure(path(Array(60).fill(100)), P);
check("no breaks at all read ranging", flat.bias === "ranging" && flat.lastBreak === null);

check("too few bars read ranging", computeStructure(path([1, 2, 3]), P).bias === "ranging");

// Wicks through a level are sweeps, not breaks: only the close counts.
const swept = path(zigzag(100, Array(6).fill([6, 4])));
const lastHigh = Math.max(...swept.slice(-12).map((b) => b.h));
swept.push({ time: 999 * 86_400, h: lastHigh + 5, l: lastHigh - 3, c: lastHigh - 1 });
const sweptRes = computeStructure(swept, P);
check("a wick above the high is not a break", sweptRes.lastBreak?.time !== 999 * 86_400);

// ── Market-hours freshness ──────────────────────────────────────────────────
const fri20 = new Date("2026-11-13T20:00:00Z");
const sun22 = new Date("2026-11-15T22:00:00Z");
check("weekend hours are not counted", marketMsBetween(fri20, sun22) === 2 * 3_600_000, String(marketMsBetween(fri20, sun22)));
const mon = new Date("2026-11-16T09:00:00Z");
const monLater = new Date("2026-11-16T11:00:00Z");
check("weekday hours are counted in full", marketMsBetween(mon, monLater) === 2 * 3_600_000);
check("H1 read from Friday evening is fresh on Sunday", isAutoFresh("H1", new Date("2026-11-13T20:30:00Z"), new Date("2026-11-15T12:00:00Z")));
check("H1 read is stale after 4 market hours", !isAutoFresh("H1", mon, new Date("2026-11-16T13:30:00Z")));
check("D read is stale after two missed days", !isAutoFresh("D", mon, new Date("2026-11-18T09:00:00Z")));

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll structure checks passed");
