// Layer 5 — confluence. Deliberately NOT a new blended score or a stored
// table: it's a read-time side-by-side of signals the platform already
// computes (TrendMatrix, COT), presented as AGREE/CONFLICT. This is the
// direct fix for the score-proliferation risk flagged in the plan's Critical
// Review — MacroEdge must not become a fourth independently-invented
// directional number for the same pair.
//
// FX Options proximity (the third signal named in the original brief) is
// deliberately deferred out of this Phase 3 cut — there's no existing
// "distance from nearest expiry level" computation anywhere in the codebase
// to reuse (the pair hub's own Key Levels panel says "coming soon" for the
// same reason), and inventing one here would be new, unreviewed logic rather
// than reuse of an existing signal. `fxOptionsProximity` stays null until
// that lands.

import { getCotSignal } from "@/lib/cot/query";
import type { CotSignal } from "@/lib/cot/types";

type TF = "MN" | "W" | "D" | "H4" | "H1";
type Bias = "bullish" | "bearish" | "ranging";
const TFS: TF[] = ["MN", "W", "D", "H4", "H1"];

export interface ConfluenceSummary {
  trendBias: Bias | "insufficient_data";
  trendCount: number; // how many of 5 TFs agree with trendBias
  cotSignal: CotSignal | "no_data";
  fxOptionsProximity: null;
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

export async function fetchConfluence(origin: string, pair: string): Promise<ConfluenceSummary> {
  // COT is read straight from the DB (getCotSignal) rather than via the HTTP
  // API — the API is plan-gated per user, and this internal signal read must
  // work regardless of who triggered the explain request.
  const [trendRes, cotRes] = await Promise.allSettled([
    fetch(`${origin}/api/trend-matrix`).then((r) => r.json() as Promise<{ matrix: Record<string, Record<TF, Bias>> } | null>),
    getCotSignal(pair),
  ]);

  let trendBias: ConfluenceSummary["trendBias"] = "insufficient_data";
  let trendCount = 0;
  if (trendRes.status === "fulfilled" && trendRes.value) {
    const row = trendRes.value.matrix[pair] ?? {};
    const majority = trendMajority(row);
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

  return { trendBias, trendCount, cotSignal, fxOptionsProximity: null, agreement };
}
