import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { BiasLabel } from "@prisma/client";
import { deriveMetaMap } from "@/lib/pairs";
import { getInstruments } from "@/lib/server/getInstruments";
import { TRACKED_CURRENCIES } from "./indicatorMap";
import { fanOutMacroBiasFlip } from "@/lib/notify-events";

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
    return {
      pair,
      baseCurrency: "XAU",
      quoteCurrency: "USD",
      baseScore: xauScore,
      quoteScore: usd.totalScore,
      differential,
      biasLabel: labelFromDifferential(differential),
      inputHash,
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

  return {
    pair,
    baseCurrency: meta.base,
    quoteCurrency: meta.quote,
    baseScore: base.totalScore,
    quoteScore: quote.totalScore,
    differential,
    biasLabel: labelFromDifferential(differential),
    inputHash,
  };
}

export async function recomputeAndStorePairBias(pair: string) {
  const result = await computePairBias(pair);
  if (!result) return null;

  const previous = await prisma.currentPairBias.findUnique({ where: { pair }, select: { biasLabel: true } });

  const stored = await prisma.currentPairBias.upsert({
    where: { pair },
    create: { ...result, computedAt: new Date() },
    update: { ...result, computedAt: new Date() },
  });

  if (!previous || previous.biasLabel !== stored.biasLabel) {
    void fanOutMacroBiasFlip({
      pair,
      oldLabel: previous?.biasLabel ?? null,
      newLabel: stored.biasLabel,
      differential: stored.differential,
    }).catch((err) => console.error("[macro] bias-flip fan-out failed", err));
  }

  return stored;
}

export async function computablePairs(): Promise<string[]> {
  return [...(await getStandardPairSymbols()), "XAUUSD"];
}
