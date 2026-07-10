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

export function buildCotCommentary(c: CotCommentaryInput): CotCommentary {
  const lsBull = c.lsChange > 0;
  // Whether the weekly flow direction agrees with the structural index level
  const structurallyBull    = c.cotIndex >= 50;
  const flowMatchesStructure = lsBull === structurallyBull;

  // ── Flow sentence + title (this week's report vs last week's) ──────────────
  let title: string;
  let icon:  string;
  let tone:  CotCommentary["tone"];
  let flow:  string;

  if (c.divergenceType === "mixed") {
    title = "Mixed: Consolidation or Transition";
    icon  = "warning_amber";
    tone  = "caution";
    flow  = `Position change this week (${fmt(c.wowChange)}) is too small to carry conviction — likely a quiet or wait-and-see week.`;
  } else if (c.divergenceType === "counter") {
    title = "Counter-Movement: Watch for Reversal";
    icon  = "sync_alt";
    tone  = "caution";
    flow  = `Large specs and commercials are moving in opposite directions this week (LS ${fmt(c.lsChange)}, C ${fmt(c.cChange)}) — the two most informed groups disagree, which often precedes a structure shift.`;
  } else if (flowMatchesStructure) {
    title = "Groups Aligned: High Conviction";
    icon  = "bolt";
    tone  = lsBull ? "bull" : "bear";
    flow  = lsBull
      ? `Large specs added ${fmtMag(c.lsChange)} longs while commercials increased hedging, with both groups confirming ${c.pair} upside.`
      : `Large specs added ${fmtMag(c.lsChange)} shorts while commercials reduced hedges, with both groups confirming ${c.pair} downside.`;
  } else {
    title = "Weekly Flow vs Structure: Watch Carefully";
    icon  = "trending_flat";
    tone  = "caution";
    flow  = lsBull
      ? `Large specs added ${fmtMag(c.lsChange)} longs this week, but positioning is still historically underweight — possible early accumulation rather than a confirmed shift.`
      : `Large specs trimmed ${fmtMag(c.lsChange)} longs this week from historically elevated positioning — early distribution unless the unwinding stalls.`;
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
