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
    return `Large specs are rotating fully long ${p}, ${steadily(L)}building longs (${fmt(L.total)}) while covering shorts (${fmt(S.total)}). New buying and short covering at the same time is the clearest accumulation pattern this report can show.`;
  if (L.dir === "up" && S.dir === "flat")
    return `Large specs have been ${steadily(L)}adding fresh ${p} longs (${fmt(L.total)}) without touching their shorts, which are holding near ${fmtMag(S.latest)}. They are accumulating one side only and leaving the hedges on.`;
  if (L.dir === "up" && S.dir === "up") {
    // Both sides growing — but a lopsided build IS a directional statement
    if (Math.abs(S.total) >= 3 * Math.abs(L.total))
      return `Large specs are ${steadily(S)}building ${p} shorts (${fmt(S.total)}) much faster than longs (${fmt(L.total)}). Exposure is up on both sides, but the flow leans bearish.`;
    if (Math.abs(L.total) >= 3 * Math.abs(S.total))
      return `Large specs are ${steadily(L)}building ${p} longs (${fmt(L.total)}) much faster than shorts (${fmt(S.total)}). Exposure is up on both sides, but the flow leans bullish.`;
    return `Large specs are adding on both sides of ${p} (longs ${fmt(L.total)}, shorts ${fmt(S.total)}). The book is growing without picking a direction.`;
  }
  if (L.dir === "flat" && S.dir === "down")
    return `Large specs are quietly covering ${p} shorts (${fmt(S.total)}) while their longs hold near ${fmtMag(L.latest)}. That is bullish, but it comes from unwinding rather than fresh buying.`;
  if (L.dir === "flat" && S.dir === "up")
    return `Large specs are ${steadily(S)}putting on new ${p} shorts (${fmt(S.total)}) while leaving their longs alone near ${fmtMag(L.latest)}. That is a deliberate bearish bet, not profit-taking.`;
  if (L.dir === "down" && S.dir === "up")
    return `Large specs are rotating to the short side of ${p}, unwinding longs (${fmt(L.total)}) and ${steadily(S)}building shorts (${fmt(S.total)}). Selling and fresh shorting together is the clearest distribution pattern this report can show.`;
  if (L.dir === "down" && S.dir === "flat")
    return `Large specs are trimming ${p} longs (${fmt(L.total)}) without adding shorts, which are holding near ${fmtMag(S.latest)}. That looks like profit-taking or de-risking; a real bearish bet would show up as new shorts.`;
  if (L.dir === "down" && S.dir === "down") {
    if (Math.abs(L.total) >= 3 * Math.abs(S.total))
      return `Large specs are unwinding ${p} longs (${fmt(L.total)}) much faster than shorts (${fmt(S.total)}). Both sides are shrinking, but the exit is mostly out of the long book.`;
    if (Math.abs(S.total) >= 3 * Math.abs(L.total))
      return `Large specs are covering ${p} shorts (${fmt(S.total)}) much faster than they trim longs (${fmt(L.total)}). Both sides are shrinking, but the exit is mostly out of the short book.`;
    return `Large specs are pulling ${p} exposure on both sides (longs ${fmt(L.total)}, shorts ${fmt(S.total)}). Conviction is fading and the book is being wound down.`;
  }
  return `Large specs have barely moved either side of their ${p} book in recent weeks (longs near ${fmtMag(L.latest)}, shorts near ${fmtMag(S.latest)}), so there is no fresh positioning to read.`;
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
    flow  = `This week's position change (${fmt(c.wowChange)}) is too small to mean much on its own.`;
    if (pattern) flow += ` ${pattern}`;
    else flow += " Probably a quiet, wait-and-see week.";
  } else if (c.divergenceType === "counter") {
    title = "Counter-Movement: Watch for Reversal";
    icon  = "sync_alt";
    tone  = "caution";
    flow  = `Large specs and commercials moved in opposite directions this week (LS ${fmt(c.lsChange)}, C ${fmt(c.cChange)}). When the two most informed groups disagree, a structure shift often follows.`;
    if (pattern) flow += ` ${pattern}`;
  } else if (flowMatchesStructure) {
    title = "Groups Aligned: High Conviction";
    icon  = "bolt";
    tone  = lsBull ? "bull" : "bear";
    flow  = pattern ?? (lsBull
      ? `Large specs added ${fmtMag(c.lsChange)} longs while commercials increased hedging. Both groups point to ${c.pair} upside.`
      : `Large specs added ${fmtMag(c.lsChange)} shorts while commercials reduced hedges. Both groups point to ${c.pair} downside.`);
  } else {
    title = "Weekly Flow vs Structure: Watch Carefully";
    icon  = "trending_flat";
    tone  = "caution";
    flow  = pattern ?? (lsBull
      ? `Large specs added ${fmtMag(c.lsChange)} longs this week, but positioning is still historically underweight. That looks more like early accumulation than a confirmed shift.`
      : `Large specs trimmed ${fmtMag(c.lsChange)} longs this week from historically elevated positioning. That reads as early distribution unless the unwinding stalls.`);
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
        ? `The COT Index sits at ${idx}, and the all-time reading (${idxAll}) says specs are about as long as they have ever been on any lookback. Longs this crowded tend to exhaust once price stops making new highs.`
        : `A COT Index of ${idx} supports a structural bullish bias, though the full history says this is not an extreme yet${idxAll != null ? ` (all-time ${idxAll})` : ""}.`;
  } else if (idx <= 20) {
    structure =
      idxAll != null && idxAll <= 15
        ? `The COT Index sits at ${idx}, and the all-time reading (${idxAll}) has specs about as short as they have ever been. From here the market either keeps liquidating or builds a reversal; the first thing to watch is the WoW change turning positive.`
        : `A COT Index of ${idx} supports a structural bearish bias, though the full history says this is not an extreme yet${idxAll != null ? ` (all-time ${idxAll})` : ""}.`;
  } else if (idx52 != null && Math.abs(idx - idx52) > 25) {
    structure =
      idx52 < idx
        ? `The 1-year index (${idx52}) sits well below the 3-year (${idx}), which reads as a pullback inside a longer structure rather than a structural extreme.`
        : `The 1-year index (${idx52}) runs well above the 3-year (${idx}). Momentum has recovered from a deeper trough, but the longer view is not ${structurallyBull ? "stretched" : "bullish"} yet.`;
  } else {
    structure = `The COT Index is at ${idx}, the middle of its range. COT is not the edge this week; price structure and liquidity matter more.`;
  }

  // Open-interest crowding — only when the spec net is a large share of the market
  if (c.openInterest != null && c.openInterest > 0) {
    const share = Math.round((c.largeSpecNet / c.openInterest) * 100);
    if (Math.abs(share) >= 40) {
      structure += ` Spec net is ${share > 0 ? "+" : ""}${share}% of open interest, which is unusually crowded.`;
    }
  }

  return { title, icon, tone, flow, structure };
}
