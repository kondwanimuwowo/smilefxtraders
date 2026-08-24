import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { BiasLabel } from "@/generated/prisma/client";
import { deriveMetaMap } from "@/lib/pairs";
import { getInstruments } from "@/lib/server/getInstruments";
import { TRACKED_CURRENCIES } from "./indicatorMap";
import { fanOutMacroBiasFlip } from "@/lib/notify-events";
import { summarizeConfidence } from "./confidence";
import type { BreakdownEntry } from "./scoring";

// Layer 4 — pair differential. NOT a new "blended score": it's base currency
// score minus quote currency score, thresholded into a BiasLabel. See the
// plan's Critical Review point 1 (score proliferation) for why this stays
// this simple — a fourth independently-invented number is the thing to
// avoid, not build.
//
// Only pairs where BOTH legs are tracked fiat currencies (USD/EUR/GBP/NZD)
// get a real differential. MacroEdge collects no indicator data for
// untracked currencies (JPY/CHF/CAD/AUD), so fabricating a score for them
// would be worse than showing nothing. XAUUSD gets the plan's documented
// special case (an inverted, down-weighted USD-score proxy, since gold has
// no CPI/GDP/central bank of its own). Index instruments (NAS100, US500,
// US30, UK100, GER40) are deliberately excluded here — they inherit USD's
// score rather than getting their own differential, since they aren't FX
// pairs; the pair hub shows USD's score directly for those instead of
// computing a meaningless differential.
//
// Pair metadata (base/quote/currencies) is derived from the `instruments`
// DB table via deriveMetaMap() — not a hardcoded pair list — so any new
// forex instrument whose legs are both tracked currencies picks up a real
// bias automatically. See src/lib/pairs.ts.

const THRESHOLDS = { strong: 8, mild: 4 };

// Gold trades inversely to USD real yields most of the time, but not 1:1 —
// deliberately down-weighted (not a full -1x mirror) per the plan.
const XAU_USD_INVERSION_WEIGHT = 0.5;

function labelFromDifferential(differential: number): BiasLabel {
  if (differential >= THRESHOLDS.strong) return BiasLabel.STRONG_BUY;
  if (differential >= THRESHOLDS.mild) return BiasLabel.BUY;
  if (differential <= -THRESHOLDS.strong) return BiasLabel.STRONG_SELL;
  if (differential <= -THRESHOLDS.mild) return BiasLabel.SELL;
  return BiasLabel.NEUTRAL;
}

function isTrackedCurrency(c: string): c is (typeof TRACKED_CURRENCIES)[number] {
  return (TRACKED_CURRENCIES as readonly string[]).includes(c);
}

// Standard pairs: both legs are tracked currencies with a real score.
async function getStandardPairSymbols(): Promise<string[]> {
  const metaMap = deriveMetaMap(await getInstruments());
  return Object.entries(metaMap)
    .filter(([, meta]) => meta.base !== "XAU" && meta.quote && isTrackedCurrency(meta.base) && isTrackedCurrency(meta.quote))
    .map(([symbol]) => symbol);
}

export async function computePairBias(pair: string) {
  const metaMap = deriveMetaMap(await getInstruments());
  const meta = metaMap[pair];
  if (!meta) return null;

  if (pair === "XAUUSD") {
    const usd = await prisma.currentCurrencyScore.findUnique({ where: { currency: "USD" } });
    if (!usd) return null;
    const xauScore = -XAU_USD_INVERSION_WEIGHT * usd.totalScore;
    const differential = xauScore - usd.totalScore;
    const inputHash = createHash("sha256").update(`XAU:${usd.inputHash}`).digest("hex").slice(0, 16);
    // XAU has no indicators of its own — it inherits USD's confidence, since
    // that is the only real data behind this differential.
    const confidence = summarizeConfidence(
      (usd.breakdown as unknown as BreakdownEntry[]).map((b) => ({ weight: b.weight, confidence: b.confidence })),
    );
    return {
      pair,
      baseCurrency: "XAU",
      quoteCurrency: "USD",
      baseScore: xauScore,
      quoteScore: usd.totalScore,
      differential,
      biasLabel: labelFromDifferential(differential),
      inputHash,
      confidence,
    };
  }

  if (!isTrackedCurrency(meta.base) || !isTrackedCurrency(meta.quote)) return null;

  const [base, quote] = await Promise.all([
    prisma.currentCurrencyScore.findUnique({ where: { currency: meta.base } }),
    prisma.currentCurrencyScore.findUnique({ where: { currency: meta.quote } }),
  ]);
  if (!base || !quote) return null;

  const differential = base.totalScore - quote.totalScore;
  const inputHash = createHash("sha256").update(`${base.inputHash}:${quote.inputHash}`).digest("hex").slice(0, 16);

  // The pair's confidence is the weaker of its two legs — a divergence is
  // only as trustworthy as its least-fit input, the same "weakest tier wins"
  // rule summarizeConfidence already applies within one currency.
  const baseEntries = (base.breakdown as unknown as BreakdownEntry[]).map((b) => ({ weight: b.weight, confidence: b.confidence }));
  const quoteEntries = (quote.breakdown as unknown as BreakdownEntry[]).map((b) => ({ weight: b.weight, confidence: b.confidence }));
  const confidence = summarizeConfidence([...baseEntries, ...quoteEntries]);

  return {
    pair,
    baseCurrency: meta.base,
    quoteCurrency: meta.quote,
    baseScore: base.totalScore,
    quoteScore: quote.totalScore,
    differential,
    biasLabel: labelFromDifferential(differential),
    inputHash,
    confidence,
  };
}

export async function recomputeAndStorePairBias(pair: string) {
  const result = await computePairBias(pair);
  if (!result) return null;

  // confidence is not a column on CurrentPairBias — it's derived from the two
  // legs' breakdowns, which are already persisted, so recomputing it later is
  // one summarizeConfidence call away rather than a redundant stored copy.
  const { confidence, ...toStore } = result;

  const previous = await prisma.currentPairBias.findUnique({ where: { pair }, select: { biasLabel: true } });

  const stored = await prisma.currentPairBias.upsert({
    where: { pair },
    create: { ...toStore, computedAt: new Date() },
    update: { ...toStore, computedAt: new Date() },
  });

  if (!previous || previous.biasLabel !== stored.biasLabel) {
    // A flip built mostly on annual/context-only data (or worse, on inputs
    // that turned out stale) is not news a trader should act on the way a
    // real flip is — it looks identical in the notification either way, and
    // an alert that reads as fresh information but rests on a feed that has
    // not moved in over a year is worse than no alert. Suppress rather than
    // send with a caveat, since a push notification has no room for one.
    if (confidence.tier === "high" || confidence.tier === "usable") {
      void fanOutMacroBiasFlip({
        pair,
        oldLabel: previous?.biasLabel ?? null,
        newLabel: stored.biasLabel,
        differential: stored.differential,
      }).catch((err) => console.error("[macro] bias-flip fan-out failed", err));
    } else {
      console.info(
        `[macro] bias flip ${pair} ${previous?.biasLabel ?? "—"} → ${stored.biasLabel} suppressed: confidence=${confidence.tier}`,
      );
    }
  }

  return { ...stored, confidence };
}

export async function computablePairs(): Promise<string[]> {
  return [...(await getStandardPairSymbols()), "XAUUSD"];
}
