// COT signal engine — the ONE implementation of the index / signal / divergence
// math. Used by /api/cot (overview cards) and /api/cot/[pair] (detail page).
// Rows are pair-framed nets (see types.ts) ordered newest-first.

import type { CotDivergence, CotSignal } from "./types";

// The COT Index percentile window: 3 years of weekly reports.
export const INDEX_WEEKS = 156;

interface NetRow {
  date:          string;
  largeSpecNet:  number;
  commercialNet: number;
  smallSpecNet:  number;
}

/** Fallback range used when the DB has too little history to compute a percentile. */
export interface CotRangeFallback {
  min:  number;
  max:  number;
  minC: number;
  maxC: number;
}

export interface CotStats {
  cotIndex:       number;
  cotIndexC:      number;
  signal:         CotSignal;
  wowChange:      number;
  divergenceType: CotDivergence;
  reportDate:     string;
}

function percentile(value: number, min: number, max: number): number {
  const range = max - min || 1;
  return Math.round(Math.max(0, Math.min(100, ((value - min) / range) * 100)));
}

/**
 * Compute the current COT stats from newest-first rows.
 * Pass up to INDEX_WEEKS rows — the index is a percentile within that window.
 * `fallback` (from instruments.cotMin52w etc.) is only used when fewer than
 * 10 weeks exist in the DB.
 */
export function computeCotStats(rows: NetRow[], fallback?: CotRangeFallback): CotStats {
  const window  = rows.slice(0, INDEX_WEEKS);
  const current = window[0];
  const prev    = window[1] ?? window[0];

  const allLS = window.map((w) => w.largeSpecNet);
  const allC  = window.map((w) => w.commercialNet);

  const useDb = allLS.length >= 10 || !fallback;
  const min  = useDb ? Math.min(...allLS) : fallback.min;
  const max  = useDb ? Math.max(...allLS) : fallback.max;
  const minC = useDb ? Math.min(...allC)  : fallback.minC;
  const maxC = useDb ? Math.max(...allC)  : fallback.maxC;

  const cotIndex  = percentile(current.largeSpecNet,  min,  max);
  const cotIndexC = percentile(current.commercialNet, minC, maxC);

  const wowChange    = current.largeSpecNet - prev.largeSpecNet;
  const lsIncreasing = wowChange > 0;
  // Commercials go more short (net decreases) when hedging against a rising
  // market — that is the bullish confirmation under the pair-framed convention.
  const cMoreShort   = current.commercialNet < prev.commercialNet;
  const netLong      = current.largeSpecNet > 0;

  // Scale the "mixed" threshold to an open-interest proxy (avg absolute net across 3 groups)
  const avgAbsNet      = (Math.abs(current.largeSpecNet) + Math.abs(current.commercialNet) + Math.abs(current.smallSpecNet)) / 3;
  const mixedThreshold = Math.max(500, avgAbsNet * 0.01); // 1% of avg position size, min 500

  let divergenceType: CotDivergence;
  if (Math.abs(wowChange) < mixedThreshold) divergenceType = "mixed";
  else if (lsIncreasing === cMoreShort)     divergenceType = "aligned";  // both confirming same direction
  else                                      divergenceType = "counter";

  // Signal is based on absolute net direction (long/short) + weekly momentum.
  // The COT Index tells you how EXTREME the positioning is within the window,
  // not whether to be bullish or bearish — that's determined by net direction.
  let signal: CotSignal;
  if      (netLong  && lsIncreasing  && cotIndex >= 65) signal = "strong_bull";
  else if (netLong  && lsIncreasing)                    signal = "bull";
  else if (netLong  && !lsIncreasing && cotIndex >= 30) signal = "neutral";  // trimming from moderate/high levels
  else if (netLong  && !lsIncreasing)                   signal = "bear";     // aggressive unwinding near the lows
  else if (!netLong && !lsIncreasing && cotIndex <= 35) signal = "strong_bear";
  else if (!netLong && !lsIncreasing)                   signal = "bear";
  else if (!netLong && lsIncreasing  && cotIndex <= 30) signal = "neutral";  // covering from extreme short
  else                                                  signal = "bear";     // still net short, just covering

  const reportDate = new Date(current.date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return { cotIndex, cotIndexC, signal, wowChange, divergenceType, reportDate };
}

/** Placeholder stats for instruments with no usable DB history yet. */
export const EMPTY_COT_STATS: CotStats = {
  cotIndex: 50, cotIndexC: 50, signal: "neutral",
  wowChange: 0, divergenceType: "mixed", reportDate: "—",
};
