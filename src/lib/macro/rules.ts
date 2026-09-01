import { IndicatorType } from "@/generated/prisma/client";

// Layer 2 — deterministic, pure rule engine. Turns one data point into a
// signal in the range -2..2 (strong bearish .. strong bullish for the
// currency) plus a human-readable reason string used in the UI breakdown.
// No LLM involvement here at all — see the MacroEdge plan's "Solid" section
// on why Gavo (Layer 6) only narrates numbers this layer already computed.
//
// Two input shapes, per the plan's Critical Review point 2
// (surprise-vs-level): a "surprise" reading (actual vs. forecast, from a
// just-released EconomicEvent) is the PRIMARY signal wherever available —
// scoring on level alone is called out in the plan as the most likely way
// this system produces confidently-wrong signals. "level" (a FRED/World Bank
// snapshot vs. its own prior period) is the fallback when no forecast
// exists — this is the "prior-period delta as a surprise proxy" the plan's
// Hardest-Parts section calls for.

// `actual`/`forecast`/`current`/`prior` are in rule space — some indicators
// (EMPLOYMENT) come in sign-flipped by the caller so this file can use one
// generic "higher is bullish" convention (see HIGHER_IS_BULLISH below). The
// display* fields carry the same reading in its real-world sign/units, for
// the reason string only — signal math must never read them. For every
// indicator that isn't flipped, caller passes the same value in both.
export type RuleInput =
  | {
      kind: "surprise";
      indicatorType: IndicatorType;
      actual: number;
      forecast: number;
      displayActual: number;
      displayForecast: number;
    }
  | {
      kind: "level";
      indicatorType: IndicatorType;
      current: number;
      prior: number | null;
      displayCurrent: number;
      displayPrior: number | null;
    };

export interface RuleResult {
  signal: number; // -2..2
  reason: string;
}

// Whether a HIGHER reading is bullish (+) or bearish (−) for the currency.
// Simplified, deterministic convention (documented, not a judgment call):
// stronger economic data → more hawkish central-bank expectations → currency
// bullish. This intentionally ignores "good news is bad news" market-regime
// nuance (e.g. strong CPI sometimes read as recession-risk-reducing rather
// than hawkish) — that kind of regime-dependent read is exactly the sort of
// qualitative color the plan reserves for Gavo's narration (Layer 6), not
// the deterministic scorer.
const HIGHER_IS_BULLISH: Record<IndicatorType, boolean> = {
  [IndicatorType.INTEREST_RATE]: true,
  [IndicatorType.CPI]: true,
  [IndicatorType.GDP]: true,
  [IndicatorType.EMPLOYMENT]: true, // caller passes payrolls-style "more jobs" or "lower unemployment" already inverted — see scoring.ts
  [IndicatorType.RETAIL_SALES]: true,
  [IndicatorType.MANUFACTURING_PMI]: true,
  [IndicatorType.CONSUMER_CONFIDENCE]: true,
  [IndicatorType.TRADE_BALANCE]: true,
  [IndicatorType.BOND_YIELD_10Y]: true,
};

function magnitudeToSignal(relDelta: number): number {
  const abs = Math.abs(relDelta);
  const sign = Math.sign(relDelta);
  if (abs >= 0.10) return 2 * sign;
  if (abs >= 0.02) return 1 * sign;
  return 0;
}

export function applyRule(input: RuleInput): RuleResult {
  const bullishWhenHigher = HIGHER_IS_BULLISH[input.indicatorType];

  // The reason string is user-facing (shown verbatim in the score breakdown
  // UI) — never interpolate the raw enum key into it. The header above this
  // text does `indicatorType.replaceAll("_", " ")`; match that here too so
  // the two don't drift.
  const label = input.indicatorType.replaceAll("_", " ");

  if (input.kind === "surprise") {
    const { actual, forecast, displayActual, displayForecast } = input;
    const denom = Math.abs(forecast) > 1e-9 ? Math.abs(forecast) : 1;
    const relDelta = (actual - forecast) / denom;
    const signedDelta = bullishWhenHigher ? relDelta : -relDelta;
    const signal = magnitudeToSignal(signedDelta);
    const direction = actual > forecast ? "beat" : actual < forecast ? "missed" : "matched";
    return {
      signal,
      reason: `${label} ${direction} forecast (actual ${displayActual}, forecast ${displayForecast})`,
    };
  }

  const { current, prior, displayCurrent, displayPrior } = input;
  if (prior === null || Math.abs(prior) < 1e-9) {
    return { signal: 0, reason: `${label}: no prior period to compare (${displayCurrent})` };
  }
  const relDelta = (current - prior) / Math.abs(prior);
  const signedDelta = bullishWhenHigher ? relDelta : -relDelta;
  const signal = magnitudeToSignal(signedDelta);
  const direction = current > prior ? "rose" : current < prior ? "fell" : "held flat";
  return {
    signal,
    reason: `${label} ${direction} vs. prior period (${displayPrior} → ${displayCurrent})`,
  };
}
