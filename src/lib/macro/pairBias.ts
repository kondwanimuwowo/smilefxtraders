import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { BiasLabel } from "@prisma/client";
import { PAIR_META } from "@/lib/pairs";
import { TRACKED_CURRENCIES } from "./indicatorMap";
import { fanOutMacroBiasFlip } from "@/lib/notify-events";

// Layer 4 — pair differential. NOT a new "blended score": it's base currency
// score minus quote currency score, thresholded into a BiasLabel. See the
// plan's Critical Review point 1 (score proliferation) for why this stays
// this simple — a fourth independently-invented number is the thing to
// avoid, not build.
//
// Only pairs where BOTH legs are tracked fiat currencies (USD/EUR/GBP/NZD)
// get a real differential: EURUSD, GBPUSD, NZDUSD. USDJPY/USDCHF/USDCAD/
// AUDUSD have an untracked non-USD leg (JPY/CHF/CAD/AUD) — MacroEdge collects
// no indicator data for those currencies, so fabricating a score for them
// would be worse than showing nothing. XAUUSD gets the plan's documented
// special case (an inverted, down-weighted USD-score proxy, since gold has
// no CPI/GDP/central bank of its own). NAS100 is deliberately excluded here
// — the plan says it "inherits USD's score" rather than getting its own
// differential, since NAS isn't an FX pair; the pair hub shows USD's score
// directly for NAS100 instead of computing a meaningless differential.

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

// Standard pairs: both legs are tracked currencies with a real score.
const STANDARD_PAIRS = Object.entries(PAIR_META)
  .filter(([, meta]) => meta.base !== "XAU" && meta.base !== "NAS" && meta.quote)
  .filter(([, meta]) => TRACKED_CURRENCIES.includes(meta.base as (typeof TRACKED_CURRENCIES)[number]) && TRACKED_CURRENCIES.includes(meta.quote as (typeof TRACKED_CURRENCIES)[number]))
  .map(([symbol]) => symbol);

export async function computePairBias(pair: string) {
  const meta = PAIR_META[pair];
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

  if (!STANDARD_PAIRS.includes(pair)) return null;

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

export function computablePairs(): string[] {
  return [...STANDARD_PAIRS, "XAUUSD"];
}
