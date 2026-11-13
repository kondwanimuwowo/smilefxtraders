// Layer 5 — confluence. Deliberately NOT a new blended score or a stored
// table: it's a read-time side-by-side of signals the platform already
// computes (Trend Matrix, COT, FX option expiries), presented as
// AGREE/CONFLICT. This is the direct fix for the score-proliferation risk
// flagged in the plan's Critical Review — MacroEdge must not become a fourth
// independently-invented directional number for the same pair.
//
// FX options are not directional, so they never decide agree/conflict. They
// are passed through so Gavo can say when a large strike near spot is likely
// to hold price into the cut.

import { getCotSignal } from "@/lib/cot/query";
import type { CotSignal } from "@/lib/cot/types";
import { loadTrendMatrix } from "@/lib/trend-matrix";
import { getFxOptionsProximity, type FxOptionsProximity } from "@/lib/fx-options-proximity";

type TF = "MN" | "W" | "D" | "H4" | "H1";
type Bias = "bullish" | "bearish" | "ranging";
const TFS: TF[] = ["MN", "W", "D", "H4", "H1"];

export interface ConfluenceSummary {
  trendBias: Bias | "insufficient_data";
  trendCount: number; // how many of 5 TFs agree with trendBias
  cotSignal: CotSignal | "no_data";
  fxOptionsProximity: FxOptionsProximity | null;
  agreement: "agree" | "conflict" | "insufficient_data";
}

// Same majority-vote convention already used inline in
// app/(app)/pair/[pair]/page.tsx (bullCount vs bearCount) — not extracted
// into a shared helper since it's a few lines and this is the only other
// call site; if a third consumer appears, promote it to src/lib/pairs.ts.
function trendMajority(row: Partial<Record<TF, Bias>>): { bias: Bias | "insufficient_data"; count: number } {
  const values = TFS.map((tf) => row[tf]).filter(Boolean) as Bias[];
  if (values.length === 0) return { bias: "insufficient_data", count: 0 };
  const bullCount = values.filter((b) => b === "bullish").length;
  const bearCount = values.filter((b) => b === "bearish").length;
  if (bullCount > bearCount) return { bias: "bullish", count: bullCount };
  if (bearCount > bullCount) return { bias: "bearish", count: bearCount };
  return { bias: "ranging", count: Math.max(bullCount, bearCount) };
}

export async function fetchConfluence(pair: string): Promise<ConfluenceSummary> {
  // All three are read server-side directly. COT skips the HTTP API because
  // that is plan-gated per user, and this internal read must work regardless
  // of who triggered the explain request.
  const [trendRes, cotRes, optionsRes] = await Promise.allSettled([
    loadTrendMatrix(),
    getCotSignal(pair),
    getFxOptionsProximity(pair),
  ]);

  let trendBias: ConfluenceSummary["trendBias"] = "insufficient_data";
  let trendCount = 0;
  if (trendRes.status === "fulfilled") {
    const majority = trendMajority(trendRes.value.matrix[pair] ?? {});
    trendBias = majority.bias;
    trendCount = majority.count;
  }

  let cotSignal: ConfluenceSummary["cotSignal"] = "no_data";
  if (cotRes.status === "fulfilled" && cotRes.value) {
    cotSignal = cotRes.value;
  }

  const cotBullish = cotSignal === "bull" || cotSignal === "strong_bull";
  const cotBearish = cotSignal === "bear" || cotSignal === "strong_bear";
  // COT nets are stored pair-framed (USD-base pairs inverted at write time in
  // the sync/seed layer), so the signal already maps to pair direction 1:1 —
  // the same convention computeVerdict() in the pair hub relies on. Never
  // re-invert at read time.
  const cotDirection = cotBullish ? "bullish" : cotBearish ? "bearish" : null;

  let agreement: ConfluenceSummary["agreement"] = "insufficient_data";
  if (trendBias !== "insufficient_data" && trendBias !== "ranging" && cotDirection) {
    agreement = trendBias === cotDirection ? "agree" : "conflict";
  }

  const fxOptionsProximity = optionsRes.status === "fulfilled" ? optionsRes.value : null;

  return { trendBias, trendCount, cotSignal, fxOptionsProximity, agreement };
}

/**
 * The parts of a confluence read that change what Gavo would say. Folded into
 * the explanation cache key so a trend flip or a strike coming into play
 * regenerates the text, not just a change in the macro scores.
 */
export function confluenceKey(c: ConfluenceSummary): string {
  const strikes = c.fxOptionsProximity?.inPlay.map((s) => s.price).join(",") ?? "";
  return `${c.trendBias}:${c.trendCount}:${c.cotSignal}:${c.agreement}:${strikes}`;
}
