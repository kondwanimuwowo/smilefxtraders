import { IndicatorType, type Prisma } from "@/generated/prisma/client";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { applyRule, type RuleInput } from "./rules";
import {
  classifySurprise,
  classifyLevel,
  summarizeConfidence,
  type FitnessTier,
  type ConfidenceSummary,
} from "./confidence";

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
  /** See src/lib/macro/confidence.ts for what each tier means and why. */
  confidence: FitnessTier;
  /** ISO date the underlying reading covers — a calendar event's time, or a snapshot's period date. */
  asOf: string | null;
  ageDays: number | null;
  /** False only for "stale" — excluded from totalScore but kept visible here for audit. */
  includedInScore: boolean;
}

// World Bank's SL.UEM.TOTL.ZS is an unemployment RATE — higher is bearish,
// the opposite of every other indicator's "higher is bullish" convention in
// rules.ts. Flip its sign here so rules.ts can stay a single generic
// convention rather than special-casing one indicator internally.
function toRuleValue(indicatorType: IndicatorType, rawValue: number): number {
  if (indicatorType === IndicatorType.EMPLOYMENT) return -rawValue;
  return rawValue;
}

interface IndicatorReading {
  input: RuleInput;
  confidence: FitnessTier;
  ageDays: number | null;
  asOf: string | null;
}

async function buildIndicatorReading(
  currency: string,
  indicatorType: IndicatorType,
): Promise<IndicatorReading | null> {
  // Primary: the most recent calendar release with both actual + forecast —
  // see the plan's Critical Review point 2 on why surprise beats level
  // scoring. No flat "last N days" cutoff here (see confidence.ts's
  // classifySurprise 2026-08-31 note): a quarterly release doesn't stop
  // being usable just because it's older than a monthly one would be
  // allowed to be. Fetches the two most recent so classifySurprise can infer
  // this currency's own observed cadence, the same way classifyLevel does
  // for snapshots below.
  const releases = await prisma.economicEvent.findMany({
    where: { currency, category: indicatorType, actual: { not: null }, forecast: { not: null } },
    orderBy: { eventTime: "desc" },
    take: 2,
  });
  const recentRelease = releases[0];

  if (recentRelease?.actual && recentRelease.forecast) {
    const actual = Number.parseFloat(recentRelease.actual.replace(/[^0-9.-]/g, ""));
    const forecast = Number.parseFloat(recentRelease.forecast.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(actual) && Number.isFinite(forecast)) {
      const fitness = classifySurprise({
        latestEventTime: recentRelease.eventTime,
        priorEventTime: releases[1]?.eventTime ?? null,
      });
      // A surprise reading that's gone stale relative to its own cadence is
      // worse than a fresh level fallback, if one exists — fall through
      // rather than returning it. If the level path below also comes up
      // empty, buildIndicatorReading returns null exactly as it always did
      // when nothing was available at all.
      if (fitness.tier !== "stale") {
        return {
          input: {
            kind: "surprise",
            indicatorType,
            actual: toRuleValue(indicatorType, actual),
            forecast: toRuleValue(indicatorType, forecast),
          },
          confidence: fitness.tier,
          ageDays: fitness.ageDays,
          asOf: recentRelease.eventTime.toISOString().slice(0, 10),
        };
      }
    }
  }

  // Fallback: latest two MacroIndicatorSnapshot rows (FRED/World Bank) —
  // trend vs. prior period stands in for a forecast surprise. See
  // confidence.ts for how the reading's fitness is judged from here.
  const snapshots = await prisma.macroIndicatorSnapshot.findMany({
    where: { currency, indicatorType },
    orderBy: { periodDate: "desc" },
    take: 2,
  });

  if (snapshots.length === 0) return null;

  const current = toRuleValue(indicatorType, snapshots[0].value);
  const prior = snapshots[1] ? toRuleValue(indicatorType, snapshots[1].value) : null;
  const fitness = classifyLevel({
    source: snapshots[0].source,
    latestPeriodDate: snapshots[0].periodDate,
    priorPeriodDate: snapshots[1]?.periodDate ?? null,
  });

  return {
    input: { kind: "level", indicatorType, current, prior },
    confidence: fitness.tier,
    ageDays: fitness.ageDays,
    asOf: snapshots[0].periodDate.toISOString().slice(0, 10),
  };
}

export async function computeCurrencyScore(currency: string): Promise<{
  totalScore: number;
  breakdown: BreakdownEntry[];
  inputHash: string;
  confidence: ConfidenceSummary;
}> {
  const breakdown: BreakdownEntry[] = [];
  const hashParts: string[] = [];

  for (const indicatorType of Object.keys(INDICATOR_WEIGHTS) as IndicatorType[]) {
    const reading = await buildIndicatorReading(currency, indicatorType);
    if (!reading) continue;

    const { signal, reason } = applyRule(reading.input);
    const weight = INDICATOR_WEIGHTS[indicatorType];
    // Stale readings stay visible in the breakdown for audit, but do not
    // count toward the score — a signal computed from a feed that has
    // stopped updating is worse than no signal, not merely an old one.
    const includedInScore = reading.confidence !== "stale";
    breakdown.push({
      indicatorType,
      signal,
      weight,
      weightedContribution: includedInScore ? signal * weight : 0,
      reason,
      confidence: reading.confidence,
      asOf: reading.asOf,
      ageDays: reading.ageDays,
      includedInScore,
    });
    hashParts.push(`${indicatorType}:${JSON.stringify(reading.input)}`);
  }

  const totalScore = breakdown
    .filter((b) => b.includedInScore)
    .reduce((sum, b) => sum + b.weightedContribution, 0);
  const inputHash = createHash("sha256").update(hashParts.sort().join("|")).digest("hex").slice(0, 16);
  const confidence = summarizeConfidence(breakdown.map((b) => ({ weight: b.weight, confidence: b.confidence })));

  return { totalScore, breakdown, inputHash, confidence };
}

export async function recomputeAndStoreCurrencyScore(currency: string) {
  const { totalScore, breakdown, inputHash, confidence } = await computeCurrencyScore(currency);

  const breakdownJson = breakdown as unknown as Prisma.InputJsonValue;

  const stored = await prisma.currentCurrencyScore.upsert({
    where: { currency },
    create: { currency, totalScore, breakdown: breakdownJson, computedAt: new Date(), inputHash },
    update: { totalScore, breakdown: breakdownJson, computedAt: new Date(), inputHash },
  });

  // confidence is not persisted as its own column — it is fully derivable
  // from the breakdown JSON already stored, via summarizeConfidence — but is
  // returned here so a caller that just recomputed doesn't need a second
  // round trip to get it.
  return { ...stored, confidence };
}
