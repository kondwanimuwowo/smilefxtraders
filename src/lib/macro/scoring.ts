import { IndicatorType, type Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { applyRule, type RuleInput } from "./rules";

// Layer 3 — aggregates Layer 2's per-indicator signals into one currency
// score using the weight table from the MacroEdge plan. Weights are
// currency-agnostic (same table for USD/EUR/GBP/NZD) — see the plan's
// Scoring Weight System section for the reasoning behind each weight.
export const INDICATOR_WEIGHTS: Record<IndicatorType, number> = {
  [IndicatorType.INTEREST_RATE]: 3,
  [IndicatorType.BOND_YIELD_10Y]: 3,
  [IndicatorType.EMPLOYMENT]: 2,
  [IndicatorType.CPI]: 2,
  [IndicatorType.GDP]: 1,
  [IndicatorType.MANUFACTURING_PMI]: 1,
  [IndicatorType.RETAIL_SALES]: 1,
  [IndicatorType.CONSUMER_CONFIDENCE]: 0.5,
  [IndicatorType.TRADE_BALANCE]: 0.5,
};

export interface BreakdownEntry {
  indicatorType: IndicatorType;
  signal: number;
  weight: number;
  weightedContribution: number;
  reason: string;
}

// World Bank's SL.UEM.TOTL.ZS is an unemployment RATE — higher is bearish,
// the opposite of every other indicator's "higher is bullish" convention in
// rules.ts. Flip its sign here so rules.ts can stay a single generic
// convention rather than special-casing one indicator internally.
function toRuleValue(indicatorType: IndicatorType, rawValue: number): number {
  if (indicatorType === IndicatorType.EMPLOYMENT) return -rawValue;
  return rawValue;
}

const RECENT_SURPRISE_WINDOW_DAYS = 45;

async function buildIndicatorInput(
  currency: string,
  indicatorType: IndicatorType,
): Promise<RuleInput | null> {
  // Primary: a recent calendar release with both actual + forecast — see the
  // plan's Critical Review point 2 on why surprise beats level scoring.
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - RECENT_SURPRISE_WINDOW_DAYS);

  const recentRelease = await prisma.economicEvent.findFirst({
    where: {
      currency,
      category: indicatorType,
      actual: { not: null },
      forecast: { not: null },
      eventTime: { gte: since },
    },
    orderBy: { eventTime: "desc" },
  });

  if (recentRelease?.actual && recentRelease.forecast) {
    const actual = Number.parseFloat(recentRelease.actual.replace(/[^0-9.-]/g, ""));
    const forecast = Number.parseFloat(recentRelease.forecast.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(actual) && Number.isFinite(forecast)) {
      return {
        kind: "surprise",
        indicatorType,
        actual: toRuleValue(indicatorType, actual),
        forecast: toRuleValue(indicatorType, forecast),
      };
    }
  }

  // Fallback: latest two MacroIndicatorSnapshot rows (FRED/World Bank) —
  // trend vs. prior period stands in for a forecast surprise.
  const snapshots = await prisma.macroIndicatorSnapshot.findMany({
    where: { currency, indicatorType },
    orderBy: { periodDate: "desc" },
    take: 2,
  });

  if (snapshots.length === 0) return null;

  const current = toRuleValue(indicatorType, snapshots[0].value);
  const prior = snapshots[1] ? toRuleValue(indicatorType, snapshots[1].value) : null;
  return { kind: "level", indicatorType, current, prior };
}

export async function computeCurrencyScore(currency: string): Promise<{
  totalScore: number;
  breakdown: BreakdownEntry[];
  inputHash: string;
}> {
  const breakdown: BreakdownEntry[] = [];
  const hashParts: string[] = [];

  for (const indicatorType of Object.keys(INDICATOR_WEIGHTS) as IndicatorType[]) {
    const input = await buildIndicatorInput(currency, indicatorType);
    if (!input) continue;

    const { signal, reason } = applyRule(input);
    const weight = INDICATOR_WEIGHTS[indicatorType];
    breakdown.push({
      indicatorType,
      signal,
      weight,
      weightedContribution: signal * weight,
      reason,
    });
    hashParts.push(`${indicatorType}:${JSON.stringify(input)}`);
  }

  const totalScore = breakdown.reduce((sum, b) => sum + b.weightedContribution, 0);
  const inputHash = createHash("sha256").update(hashParts.sort().join("|")).digest("hex").slice(0, 16);

  return { totalScore, breakdown, inputHash };
}

export async function recomputeAndStoreCurrencyScore(currency: string) {
  const { totalScore, breakdown, inputHash } = await computeCurrencyScore(currency);

  const breakdownJson = breakdown as unknown as Prisma.InputJsonValue;

  return prisma.currentCurrencyScore.upsert({
    where: { currency },
    create: { currency, totalScore, breakdown: breakdownJson, computedAt: new Date(), inputHash },
    update: { totalScore, breakdown: breakdownJson, computedAt: new Date(), inputHash },
  });
}
