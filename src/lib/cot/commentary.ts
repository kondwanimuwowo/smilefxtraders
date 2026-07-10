// The ONE COT commentary engine — used by both the overview cards (/cot) and
// the detail page (/cot/[pair]) so a pair never says two different things one
// click apart. Output shape follows the card convention:
//
//   title:     "Groups Aligned: High Conviction"
//   flow:      what changed THIS WEEK (spec vs commercial weekly deltas)
//   structure: where positioning sits in its cycle — 3-yr index, earned
//              all-time context, and open-interest crowding when relevant
//
// Deterministic template text, not AI. All inputs are pair-framed (see
// types.ts): positive net = bullish on the displayed pair.

import type { CotDivergence, CotSignal } from "./types";

export interface CotCommentaryInput {
  pair:           string;
  divergenceType: CotDivergence;
  wowChange:      number;
  lsChange:       number;         // large-spec net WoW delta
  cChange:        number;         // commercial net WoW delta
  cotIndex:       number;         // 3-yr (156w) percentile
  cotIndex52w:    number | null;  // 1-yr percentile (null when <52w history)
  cotIndexAll:    number | null;  // full-history percentile
  signal:         CotSignal;
  largeSpecNet:   number;
  openInterest:   number | null;
  // Large-spec GROSS sides, newest-first, RAW contract framing as stored
  // (up to ~6 weeks). Set `inverted` for USD-base pairs — the engine swaps
  // the sides so "longs" means bullish on the displayed pair. This is a side
  // SWAP for labeling, not a sign flip; the nets stay pair-framed as always.
  grossHistory?:  { long: number | null; short: number | null }[];
  inverted?:      boolean;
}

export interface CotCommentary {
  title: string;
  icon:  string;
  tone:  "bull" | "bear" | "caution";
  flow:  string;
  structure: string;
}

function fmt(n: number, decimals = 1): string {
  const abs  = Math.abs(n);
  const sign = n >= 0 ? "+" : "−";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
  return `${sign}${abs}`;
}

/** Unsigned magnitude — for "added 4.0K longs" phrasing. */
function fmtMag(n: number, decimals = 1): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(decimals)}K`;
  return String(abs);
}

// ── Gross-side trend analysis (last ~6 reports) ───────────────────────────────
// The net masks composition: "net fell 29K" can be long liquidation, fresh
// shorting, or both — different intents. Classifying each gross side
// separately reveals which side of the trade specs are actually building.

interface SideTrend {
  dir:    "up" | "down" | "flat";
  steady: boolean;  // moved the same direction in (almost) every week
  total:  number;   // newest minus oldest
  latest: number;
}

const GROSS_WEEKS = 6;

/** Trend of one gross side over newest-first values. Null when data is too thin. */
function sideTrend(values: number[]): SideTrend | null {
  if (values.length < 4) return null;
  const latest = values[0];
  const total  = values[0] - values[values.length - 1];
  const avg    = values.reduce((s, v) => s + v, 0) / values.length;
  // Drift below ~2.5% of the book (min 500 contracts) is noise, not positioning
  const flatThreshold = Math.max(500, avg * 0.025);

  if (Math.abs(total) < flatThreshold) return { dir: "flat", steady: false, total, latest };

  const deltas = [];
  for (let i = 0; i < values.length - 1; i++) deltas.push(values[i] - values[i + 1]);
  const matching = deltas.filter((d) => Math.sign(d) === Math.sign(total)).length;

  return {
    dir:    total > 0 ? "up" : "down",
    steady: matching >= deltas.length - 1, // at most one contrarian week
    total,
    latest,
  };
}

/**
 * One sentence describing HOW large specs have been positioning over recent
 * weeks — each gross side read separately (pair-framed). Null when the gross
 * columns are missing or history is too short.
 */
function grossPattern(c: CotCommentaryInput): string | null {
  if (!c.grossHistory || c.grossHistory.length < 4) return null;

  const weeks = c.grossHistory.slice(0, GROSS_WEEKS);
  if (weeks.some((w) => w.long == null || w.short == null)) return null;

  // USD-base pairs: the contract is the foreign currency, so contract shorts
  // are the bullish side of the displayed pair — swap for pair-framed labels.
  const longs  = weeks.map((w) => (c.inverted ? w.short! : w.long!));
  const shorts = weeks.map((w) => (c.inverted ? w.long!  : w.short!));

  const L = sideTrend(longs);
  const S = sideTrend(shorts);
  if (!L || !S) return null;

  const p = c.pair;
  const steadily = (t: SideTrend) => (t.steady ? "steadily " : "");

  if (L.dir === "up" && S.dir === "down")
    return `Large specs are rotating fully long ${p}: ${steadily(L)}building longs (${fmt(L.total)}) while covering shorts (${fmt(S.total)}) — the strongest form of accumulation.`;
  if (L.dir === "up" && S.dir === "flat")
    return `Large specs have been ${steadily(L)}building fresh ${p} longs (${fmt(L.total)}) without touching their shorts (held near ${fmtMag(S.latest)}) — one-sided accumulation with hedges left on.`;
  if (L.dir === "up" && S.dir === "up") {
    // Both sides growing — but a lopsided build IS a directional statement
    if (Math.abs(S.total) >= 3 * Math.abs(L.total))
      return `Large specs are ${steadily(S)}building ${p} shorts (${fmt(S.total)}) far faster than longs (${fmt(L.total)}) — gross exposure is up on both sides, but the flow leans clearly bearish.`;
    if (Math.abs(L.total) >= 3 * Math.abs(S.total))
      return `Large specs are ${steadily(L)}building ${p} longs (${fmt(L.total)}) far faster than shorts (${fmt(S.total)}) — gross exposure is up on both sides, but the flow leans clearly bullish.`;
    return `Large specs are adding on BOTH sides of ${p} (longs ${fmt(L.total)}, shorts ${fmt(S.total)}) — gross exposure is growing but directional conviction is unclear.`;
  }
  if (L.dir === "flat" && S.dir === "down")
    return `Large specs are quietly covering ${p} shorts (${fmt(S.total)}) while their longs hold near ${fmtMag(L.latest)} — bullish by unwind rather than fresh buying.`;
  if (L.dir === "flat" && S.dir === "up")
    return `Large specs are ${steadily(S)}building fresh ${p} shorts (${fmt(S.total)}) while their longs hold near ${fmtMag(L.latest)} — deliberate bearish positioning, not profit-taking.`;
  if (L.dir === "down" && S.dir === "up")
    return `Large specs are rotating to the short side of ${p}: unwinding longs (${fmt(L.total)}) AND ${steadily(S)}building shorts (${fmt(S.total)}) — the strongest form of distribution.`;
  if (L.dir === "down" && S.dir === "flat")
    return `Large specs are trimming ${p} longs (${fmt(L.total)}) without adding shorts (held near ${fmtMag(S.latest)}) — de-risking or profit-taking rather than a fresh bearish bet.`;
  if (L.dir === "down" && S.dir === "down") {
    if (Math.abs(L.total) >= 3 * Math.abs(S.total))
      return `Large specs are unwinding ${p} longs (${fmt(L.total)}) far faster than shorts (${fmt(S.total)}) — de-risking on both sides, but the exit leans clearly off the long side.`;
    if (Math.abs(S.total) >= 3 * Math.abs(L.total))
      return `Large specs are covering ${p} shorts (${fmt(S.total)}) far faster than they trim longs (${fmt(L.total)}) — de-risking on both sides, but the exit leans clearly off the short side.`;
    return `Large specs are pulling gross ${p} exposure on both sides (longs ${fmt(L.total)}, shorts ${fmt(S.total)}) — conviction fading, book being de-risked.`;
  }
  return `Large specs have barely moved either side of their ${p} book in recent weeks (longs ~${fmtMag(L.latest)}, shorts ~${fmtMag(S.latest)}) — no fresh positioning.`;
}

export function buildCotCommentary(c: CotCommentaryInput): CotCommentary {
  const lsBull = c.lsChange > 0;
  // Whether the weekly flow direction agrees with the structural index level
  const structurallyBull    = c.cotIndex >= 50;
  const flowMatchesStructure = lsBull === structurallyBull;

  // ── Flow sentence + title ───────────────────────────────────────────────────
  // The gross-side pattern (how each side of the spec book moved over recent
  // weeks) is the primary flow read — it replaces the net-based sentence,
  // which stays only as the fallback when gross data is unavailable. For
  // mixed/counter weeks the pattern is appended instead: those titles carry
  // this week's spec-vs-commercial read, and the pattern supplies the trend
  // context a single quiet or conflicted week hides.
  const pattern = grossPattern(c);

  let title: string;
  let icon:  string;
  let tone:  CotCommentary["tone"];
  let flow:  string;

  if (c.divergenceType === "mixed") {
    title = "Mixed: Consolidation or Transition";
    icon  = "warning_amber";
    tone  = "caution";
    flow  = `Position change this week (${fmt(c.wowChange)}) is too small to carry conviction.`;
    if (pattern) flow += ` ${pattern}`;
    else flow += " Likely a quiet or wait-and-see week.";
  } else if (c.divergenceType === "counter") {
    title = "Counter-Movement: Watch for Reversal";
    icon  = "sync_alt";
    tone  = "caution";
    flow  = `Large specs and commercials are moving in opposite directions this week (LS ${fmt(c.lsChange)}, C ${fmt(c.cChange)}) — the two most informed groups disagree, which often precedes a structure shift.`;
    if (pattern) flow += ` ${pattern}`;
  } else if (flowMatchesStructure) {
    title = "Groups Aligned: High Conviction";
    icon  = "bolt";
    tone  = lsBull ? "bull" : "bear";
    flow  = pattern ?? (lsBull
      ? `Large specs added ${fmtMag(c.lsChange)} longs while commercials increased hedging, with both groups confirming ${c.pair} upside.`
      : `Large specs added ${fmtMag(c.lsChange)} shorts while commercials reduced hedges, with both groups confirming ${c.pair} downside.`);
  } else {
    title = "Weekly Flow vs Structure: Watch Carefully";
    icon  = "trending_flat";
    tone  = "caution";
    flow  = pattern ?? (lsBull
      ? `Large specs added ${fmtMag(c.lsChange)} longs this week, but positioning is still historically underweight — possible early accumulation rather than a confirmed shift.`
      : `Large specs trimmed ${fmtMag(c.lsChange)} longs this week from historically elevated positioning — early distribution unless the unwinding stalls.`);
  }

  // ── Structure sentence (the positioning cycle, deepest window first) ────────
  const idx    = c.cotIndex;
  const idxAll = c.cotIndexAll;
  const idx52  = c.cotIndex52w;

  // "Extreme" wording is earned by the window that actually shows it.
  let structure: string;
  if (idx >= 80) {
    structure =
      idxAll != null && idxAll >= 85
        ? `COT Index at ${idx} — specs are near maximum long not just on the 3-year view but across the full history (all-time ${idxAll}). Crowded longs: watch for exhaustion if price stops making new highs.`
        : `COT Index at ${idx} confirms structural bullish bias, though on the full history this is not yet an extreme${idxAll != null ? ` (all-time ${idxAll})` : ""}.`;
  } else if (idx <= 20) {
    structure =
      idxAll != null && idxAll <= 15
        ? `COT Index at ${idx} — specs are near maximum short across the full history (all-time ${idxAll}). Historically this precedes either a sustained reversal or continued liquidation; a positive WoW Δ is the first confirmation to watch.`
        : `COT Index at ${idx} confirms structural bearish bias, though on the full history this is not yet an extreme${idxAll != null ? ` (all-time ${idxAll})` : ""}.`;
  } else if (idx52 != null && Math.abs(idx - idx52) > 25) {
    structure =
      idx52 < idx
        ? `1-year index (${idx52}) sits well below the 3-year (${idx}): a recent pullback inside a longer structure, not a structural extreme.`
        : `1-year index (${idx52}) runs well above the 3-year (${idx}): momentum has recovered from a deeper trough, but the longer view is not yet ${structurallyBull ? "stretched" : "bullish"}.`;
  } else {
    structure = `COT Index at ${idx} — mid-range positioning, so COT is not the primary edge here; lean on price structure and liquidity.`;
  }

  // Open-interest crowding — only when the spec net is a large share of the market
  if (c.openInterest != null && c.openInterest > 0) {
    const share = Math.round((c.largeSpecNet / c.openInterest) * 100);
    if (Math.abs(share) >= 40) {
      structure += ` Spec net is ${share > 0 ? "+" : ""}${share}% of open interest — unusually crowded positioning.`;
    }
  }

  return { title, icon, tone, flow, structure };
}
