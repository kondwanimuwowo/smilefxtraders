// Synthetic cross-pair COT — CFTC does not publish a COT report for cross
// pairs (there is no "EURGBP futures" contract). Every minor pair combines
// two currencies that already have real COT data via their own major pair
// (or DXY, for USD itself), so a cross pair's synthetic history is built by
// subtracting the quote currency's net from the base currency's net, per
// matching report date — then fed straight into the existing computeCotStats()
// engine, unchanged. This gives minors the same index/signal/divergence math
// majors get, not a stripped-down approximation.

import { prisma } from "@/lib/prisma";
import { computeCotStats, INDEX_WEEKS, type CotStats } from "./signal";
import type { CotWeek } from "./types";

interface HomePair {
  pair: string;
  invert: boolean; // true when the home pair is stored USD-base (cotInverted) and this currency is the non-USD leg
}

// Every currency's "home" major pair, and whether its stored net needs
// re-flipping to get THIS currency's own directional net (positive = bullish
// that currency). EUR/GBP/AUD/NZD are already base currencies of their home
// pairs (no flip). JPY/CHF/CAD are the quote leg of a USD-base pair, so the
// stored pair-framed net (positive = bullish USD) is flipped to read
// positive = bullish the non-USD currency. USD itself reads from DXY.
const HOME_PAIR: Record<string, HomePair> = {
  USD: { pair: "DXY",    invert: false },
  EUR: { pair: "EURUSD", invert: false },
  GBP: { pair: "GBPUSD", invert: false },
  AUD: { pair: "AUDUSD", invert: false },
  NZD: { pair: "NZDUSD", invert: false },
  JPY: { pair: "USDJPY", invert: true },
  CHF: { pair: "USDCHF", invert: true },
  CAD: { pair: "USDCAD", invert: true },
};

export function hasHomePair(currency: string): boolean {
  return currency in HOME_PAIR;
}

interface CurrencyNetRow {
  date:          string;
  largeSpecNet:  number;
  commercialNet: number;
  smallSpecNet:  number;
}

async function getCurrencyNetHistory(currency: string, limit: number): Promise<CurrencyNetRow[]> {
  const home = HOME_PAIR[currency];
  if (!home) return [];

  const rows = await prisma.cotReport.findMany({
    where:   { pair: home.pair },
    orderBy: { reportDate: "desc" },
    take:    limit,
    select:  { reportDate: true, largeSpecNet: true, commercialNet: true, smallSpecNet: true },
  });

  const sign = home.invert ? -1 : 1;
  return rows.map((r) => ({
    date:          r.reportDate.toISOString().split("T")[0],
    largeSpecNet:  sign * r.largeSpecNet,
    commercialNet: sign * r.commercialNet,
    smallSpecNet:  sign * r.smallSpecNet,
  }));
}

/**
 * Synthetic history for a cross pair (base minus quote, per matching report
 * date), newest first. Only dates present for BOTH legs are included.
 */
export async function buildSyntheticHistory(base: string, quote: string, limit = INDEX_WEEKS): Promise<CurrencyNetRow[]> {
  const [baseRows, quoteRows] = await Promise.all([
    getCurrencyNetHistory(base, limit),
    getCurrencyNetHistory(quote, limit),
  ]);
  const quoteByDate = new Map(quoteRows.map((r) => [r.date, r]));

  const synthetic: CurrencyNetRow[] = [];
  for (const b of baseRows) {
    const q = quoteByDate.get(b.date);
    if (!q) continue;
    synthetic.push({
      date:          b.date,
      largeSpecNet:  b.largeSpecNet  - q.largeSpecNet,
      commercialNet: b.commercialNet - q.commercialNet,
      smallSpecNet:  b.smallSpecNet  - q.smallSpecNet,
    });
  }
  return synthetic;
}

export interface CrossPairResult {
  stats:      CotStats;
  history:    CotWeek[]; // newest first, up to 8 weeks — same shape as a real pair's card history
  totalWeeks: number;    // overlapping synthetic history depth
}

/** Full synthetic COT stats + card history for a cross pair, or null if either leg has no home pair or too little overlapping history. */
export async function computeCrossPairSignal(base: string, quote: string): Promise<CrossPairResult | null> {
  if (!hasHomePair(base) || !hasHomePair(quote)) return null;

  const rows = await buildSyntheticHistory(base, quote);
  if (rows.length < 2) return null;

  const stats = computeCotStats(rows);
  const history: CotWeek[] = rows.slice(0, 8).map((r) => ({
    date:           r.date,
    largeSpecNet:   r.largeSpecNet,
    commercialNet:  r.commercialNet,
    smallSpecNet:   r.smallSpecNet,
    largeSpecLong:  null, // synthetic — no real long/short breakdown, only the net differential
    largeSpecShort: null,
  }));

  return { stats, history, totalWeeks: rows.length };
}
