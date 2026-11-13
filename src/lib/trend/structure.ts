// Market-structure engine behind the Trend Matrix. Pure and deterministic:
// the same closed bars always give the same bias, so the auto read can be
// checked against a chart by hand (see structure.check.ts).
//
// Relative imports only — the check script runs this file under plain node.

export type TrendBias = "bullish" | "bearish" | "ranging";
export type TrendTf = "MN" | "W" | "D" | "H4" | "H1";
export const TREND_TFS: readonly TrendTf[] = ["MN", "W", "D", "H4", "H1"];

export interface StructureBar {
  /** Bar open time, epoch seconds. */
  time: number;
  h: number;
  l: number;
  c: number;
}

export interface StructureBreak {
  type:  "BOS" | "CHoCH";
  dir:   "bullish" | "bearish";
  /** The swing level that was closed through. */
  price: number;
  /** Open time of the bar whose close broke the level. */
  time:  number;
}

export interface StructureResult {
  bias:      TrendBias;
  lastBreak: StructureBreak | null;
  /** Most recent confirmed swing high / low still in play. */
  swingHigh: number | null;
  swingLow:  number | null;
  /** Open time of the newest bar used. */
  barTime:   number | null;
}

interface Params {
  /** Bars each side that must be lower (high) / higher (low) to confirm a swing. */
  k:      number;
  /** Two CHoCHs inside this many bars, with no BOS since, reads as ranging. */
  window: number;
}

// Fewer bars exist on the higher timeframes, so their swings need less
// confirmation. Tuned against USDJPY daily 2026, where k=3 reproduced a
// hand-marked chart: every major BOS and CHoCH from January to November.
export const STRUCTURE_PARAMS: Record<TrendTf, Params> = {
  MN: { k: 2, window: 12 },
  W:  { k: 2, window: 20 },
  D:  { k: 3, window: 30 },
  H4: { k: 3, window: 30 },
  H1: { k: 3, window: 30 },
};

interface Swing { price: number; broken: boolean }

/**
 * Reads structure from closed bars, oldest first. A swing is only usable
 * once its k right-hand bars have printed, so nothing here looks ahead.
 * Breaks are close-based: a wick through a level is a sweep, not a break.
 */
export function computeStructure(bars: StructureBar[], { k, window }: Params): StructureResult {
  let high: Swing | null = null;
  let low:  Swing | null = null;
  let trend: "bullish" | "bearish" | null = null;
  const breaks: (StructureBreak & { index: number })[] = [];

  for (let i = 0; i < bars.length; i++) {
    const j = i - k;
    if (j >= k) {
      let isHigh = true;
      let isLow  = true;
      for (let d = 1; d <= k; d++) {
        if (bars[j - d].h >= bars[j].h || bars[j + d].h > bars[j].h) isHigh = false;
        if (bars[j - d].l <= bars[j].l || bars[j + d].l < bars[j].l) isLow  = false;
      }
      if (isHigh) high = { price: bars[j].h, broken: false };
      if (isLow)  low  = { price: bars[j].l, broken: false };
    }

    const close = bars[i].c;
    if (high && !high.broken && close > high.price) {
      breaks.push({ type: trend === "bullish" ? "BOS" : "CHoCH", dir: "bullish", price: high.price, time: bars[i].time, index: i });
      trend = "bullish";
      high.broken = true;
    } else if (low && !low.broken && close < low.price) {
      breaks.push({ type: trend === "bearish" ? "BOS" : "CHoCH", dir: "bearish", price: low.price, time: bars[i].time, index: i });
      trend = "bearish";
      low.broken = true;
    }
  }

  const last = breaks.at(-1) ?? null;
  const newest = bars.length - 1;
  const recentChochs = breaks.filter((b) => b.type === "CHoCH" && newest - b.index <= window).length;

  // A single CHoCH starts a new trend. A second one inside the window with no
  // BOS to confirm either side is a market trading back and forth: a range.
  let bias: TrendBias = trend ?? "ranging";
  if (!last || (last.type === "CHoCH" && recentChochs >= 2)) bias = "ranging";

  return {
    bias,
    lastBreak: last && { type: last.type, dir: last.dir, price: last.price, time: last.time },
    swingHigh: high && !high.broken ? high.price : null,
    swingLow:  low  && !low.broken  ? low.price  : null,
    barTime:   bars.at(-1)?.time ?? null,
  };
}

// ── Freshness ─────────────────────────────────────────────────────────────

const HOUR = 3_600_000;

/** How long an auto read stays usable, in market hours. Roughly two bars plus slack for a missed cron run. */
export const AUTO_MAX_AGE_MS: Record<TrendTf, number> = {
  H1: 3 * HOUR,
  H4: 9 * HOUR,
  D:  30 * HOUR,
  W:  8 * 24 * HOUR,
  MN: 33 * 24 * HOUR,
};

/** Instructor overrides lapse back to the auto read after this long. */
export const OVERRIDE_TTL_MS = 7 * 24 * HOUR;

/**
 * Milliseconds between two instants that fall inside FX market hours, i.e.
 * excluding Friday 21:00 UTC to Sunday 21:00 UTC. A read computed on Friday
 * evening is still current on Sunday afternoon because no bar has closed since.
 */
export function marketMsBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let total = to.getTime() - from.getTime();
  // Walk back from `to` to each weekend start before it and subtract the overlap.
  const cursor = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 21));
  cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 2) % 7)); // most recent Friday 21:00
  if (cursor > to) cursor.setUTCDate(cursor.getUTCDate() - 7);
  while (cursor.getTime() + 48 * HOUR > from.getTime()) {
    const start = Math.max(cursor.getTime(), from.getTime());
    const end   = Math.min(cursor.getTime() + 48 * HOUR, to.getTime());
    if (end > start) total -= end - start;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return total;
}

export function isAutoFresh(tf: TrendTf, computedAt: Date, now = new Date()): boolean {
  return marketMsBetween(computedAt, now) <= AUTO_MAX_AGE_MS[tf];
}
