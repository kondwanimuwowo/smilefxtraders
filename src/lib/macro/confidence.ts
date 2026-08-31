import { DataSource } from "@/generated/prisma/client";

// Layer 3b — fitness classification for MacroEdge inputs.
//
// The question this answers is not "how old is this reading" but "is this
// reading capable of informing the decision it's feeding". Those are
// different questions. World Bank's annual CPI published yesterday is still
// only annual -- it cannot tell you whether a central bank hikes next month,
// no matter how fresh it is. Conversely, New Zealand's quarterly CPI is not
// "stale" just because it is quarterly: that is the real cadence the RBNZ
// itself works from, and treating it as worse than a monthly reading would
// penalize a currency for its own country's data calendar rather than for
// anything actually wrong with the input.
//
// So fitness is judged on two separate axes:
//   1. Is the SOURCE structurally too coarse for this job, regardless of
//      freshness? (World Bank / any annual-cadence series -> yes, always)
//   2. Is the latest reading current relative to that source's OWN observed
//      cadence? (a series that has gone quiet well past its usual rhythm has
//      likely stopped updating at the source, which is a different problem
//      from "the fact hasn't changed yet")
export type FitnessTier = "high" | "usable" | "context_only" | "stale";

export interface FitnessResult {
  tier: FitnessTier;
  ageDays: number | null;
  observedCadenceDays: number | null;
}

const MS_PER_DAY = 86_400_000;

// Publication-lag buffer: how late a release can run past its own natural
// cadence and still be "on schedule", rather than having gone quiet because
// the feed stopped updating. Shared by both classifyLevel and
// classifySurprise below -- staleness is a property of "how far past this
// series' own rhythm", not of which path (calendar release vs. FRED/World
// Bank snapshot) the reading came through.
//
// Bucketed rather than a smooth formula, because the first version of this
// (cadence/2, clamped 14-60) was calibrated on paper and turned out too
// tight the moment it ran against real data: it marked FEDFUNDS, RSAFS and
// UMCSENT "stale" for having a July reading in late August, which is
// completely normal for a monthly US series, and marked GBP/NZD's 10-year
// yield "stale" at 84 days when FRED's OECD-mirrored series are well known
// to run 2-3 months behind the domestic release for that exact reason.
// Widened using those five confirmed false positives as the calibration,
// not a guess: a genuinely dead feed (EUR's 10-year OECD proxy, 235 days and
// rising) still clears this threshold by a wide margin, so the widening
// does not appear to be hiding real staleness, only false alarms on healthy
// lag.
function bufferDaysFor(observedCadenceDays: number): number {
  return (
    observedCadenceDays <= 3   ? 10 :  // daily
    observedCadenceDays <= 10  ? 21 :  // weekly
    observedCadenceDays <= 45  ? 60 :  // monthly
    observedCadenceDays <= 120 ? 75 :  // quarterly
                                  90    // longer, ambiguous cadence
  );
}

// A first-ever reading for a (currency, indicator) pair has no cadence to
// measure against, so classifySurprise can't apply the bucket above -- but
// "can't judge yet" isn't the same as "never goes stale". Without some
// ceiling, a single manual entry that never gets a follow-up stays "high"
// confidence indefinitely, however old it gets. 200 days is deliberately
// generous -- wider than even the quarterly bucket's ~165-day allowance --
// so this only catches a genuinely abandoned entry, never a currency
// that's just slower than most.
const MAX_AGE_WITHOUT_CADENCE_DAYS = 200;

// A calendar release with both actual and forecast is the best input this
// system can have, regardless of which upstream feed it came from -- see
// rules.ts's header note on why surprise beats level. "high" as long as it
// isn't stale relative to its own release rhythm; there is no intermediate
// "usable" tier for surprise the way there is for level, since a matched
// actual-vs-forecast is inherently top-quality input on its own merits, not
// merely "on schedule".
//
// 2026-08-31: previously always "high" with no staleness check at all, which
// meant a currency's own real calendar data (e.g. a quarterly rate decision
// or CPI print) got excluded from the surprise path by scoring.ts's flat
// 45-day window well before that currency's own next release existed --
// exactly the "penalized for a slow release calendar, not for anything wrong
// with the input" failure classifyLevel was already written to avoid on the
// level path. Reusing the same cadence+buffer math here closes that gap.
export function classifySurprise(params: {
  latestEventTime: Date;
  priorEventTime: Date | null;
}): FitnessResult {
  const { latestEventTime, priorEventTime } = params;
  const ageDays = Math.round((Date.now() - latestEventTime.getTime()) / MS_PER_DAY);

  if (!priorEventTime) {
    // Only one release has ever been seen for this (currency, indicator)
    // pair, so its cadence cannot be inferred yet -- high rather than
    // penalized on a first read, but not high forever: see
    // MAX_AGE_WITHOUT_CADENCE_DAYS above.
    if (ageDays > MAX_AGE_WITHOUT_CADENCE_DAYS) {
      return { tier: "stale", ageDays, observedCadenceDays: null };
    }
    return { tier: "high", ageDays, observedCadenceDays: null };
  }

  const observedCadenceDays = Math.round((latestEventTime.getTime() - priorEventTime.getTime()) / MS_PER_DAY);
  const thresholdDays = observedCadenceDays + bufferDaysFor(observedCadenceDays);

  if (ageDays > thresholdDays) {
    return { tier: "stale", ageDays, observedCadenceDays };
  }
  return { tier: "high", ageDays, observedCadenceDays };
}

export function classifyLevel(params: {
  source: DataSource;
  latestPeriodDate: Date;
  priorPeriodDate: Date | null;
}): FitnessResult {
  const { source, latestPeriodDate, priorPeriodDate } = params;
  const ageDays = Math.round((Date.now() - latestPeriodDate.getTime()) / MS_PER_DAY);

  if (source === DataSource.WORLD_BANK) {
    // Annual by construction (see worldbank.ts's file-level note) -- always
    // context_only, never "stale". A fresh annual print is still only annual.
    return { tier: "context_only", ageDays, observedCadenceDays: 365 };
  }

  if (!priorPeriodDate) {
    // Only one reading has ever been seen for this series, so its cadence
    // cannot be inferred yet. Usable rather than penalized on a first read.
    return { tier: "usable", ageDays, observedCadenceDays: null };
  }

  const observedCadenceDays = Math.round(
    (latestPeriodDate.getTime() - priorPeriodDate.getTime()) / MS_PER_DAY,
  );
  const thresholdDays = observedCadenceDays + bufferDaysFor(observedCadenceDays);

  if (ageDays > thresholdDays) {
    // Gone quiet well past its own normal rhythm: the feed has most likely
    // stopped updating at the source, not merely "nothing new to report".
    return { tier: "stale", ageDays, observedCadenceDays };
  }

  if (observedCadenceDays >= 300) {
    // An annual-cadence FRED series (rare, but possible) gets the same
    // ceiling as World Bank, for the same reason.
    return { tier: "context_only", ageDays, observedCadenceDays };
  }

  return { tier: "usable", ageDays, observedCadenceDays };
}

const TIER_RANK: Record<FitnessTier, number> = {
  high: 3,
  usable: 2,
  context_only: 1,
  stale: 0,
};

export interface ConfidenceSummary {
  tier: FitnessTier;
  highWeight: number;
  usableWeight: number;
  contextWeight: number;
  staleWeight: number;
  totalWeight: number;
}

// A currency's overall confidence is the WEAKEST tier carrying meaningful
// weight, not an average -- one solid indicator does not excuse another
// being annual-only when both are supposed to inform the same call.
// "Meaningful" is set at 15% of total weight, so a single lightly-weighted
// stale indicator (trade balance at 0.5, say) doesn't drag an otherwise
// well-supported score down to "stale" on its own.
export function summarizeConfidence(
  entries: ReadonlyArray<{ weight: number; confidence: FitnessTier }>,
): ConfidenceSummary {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const byTier: Record<FitnessTier, number> = { high: 0, usable: 0, context_only: 0, stale: 0 };
  for (const e of entries) byTier[e.confidence] += e.weight;

  if (totalWeight === 0) {
    return { tier: "stale", highWeight: 0, usableWeight: 0, contextWeight: 0, staleWeight: 0, totalWeight: 0 };
  }

  const significant = (Object.keys(byTier) as FitnessTier[]).filter(
    (t) => byTier[t] / totalWeight >= 0.15,
  );
  const tier = significant.length
    ? significant.reduce((worst, t) => (TIER_RANK[t] < TIER_RANK[worst] ? t : worst))
    : "stale";

  return {
    tier,
    highWeight: byTier.high,
    usableWeight: byTier.usable,
    contextWeight: byTier.context_only,
    staleWeight: byTier.stale,
    totalWeight,
  };
}
