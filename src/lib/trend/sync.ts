import { prisma } from "@/lib/prisma";
import { getCandles } from "@/lib/spotware/candles";
import { PERIOD_SECONDS, type TrendbarPeriod } from "@/lib/spotware/messages";
import { computeStructure, STRUCTURE_PARAMS, TREND_TFS, type TrendTf } from "@/lib/trend/structure";

const TF_PERIOD: Record<TrendTf, TrendbarPeriod> = { MN: "MN1", W: "W1", D: "D1", H4: "H4", H1: "H1" };

// Enough history for several swings at each timeframe without paginating.
const BARS: Record<TrendTf, number> = { MN: 120, W: 260, D: 400, H4: 500, H1: 500 };

export interface TrendSyncResult {
  pair:   string;
  tf:     TrendTf;
  ok:     boolean;
  bias?:  string;
  error?: string;
}

async function syncOne(pair: string, tf: TrendTf, now: Date): Promise<TrendSyncResult> {
  const period = TF_PERIOD[tf];
  const from = new Date(now.getTime() - BARS[tf] * PERIOD_SECONDS[period] * 1_000);
  const { bars } = await getCandles({ symbol: pair, period, from, to: now });

  // The newest bar is still forming while the market is open. Dropping it
  // unconditionally costs one bar of lag over a weekend and never lets an
  // unfinished candle's close count as a break.
  const closed = bars.slice(0, -1);
  if (closed.length < 20) return { pair, tf, ok: false, error: `only ${closed.length} bars` };

  const r = computeStructure(closed, STRUCTURE_PARAMS[tf]);
  const data = {
    bias:           r.bias,
    lastBreakType:  r.lastBreak?.type ?? null,
    lastBreakDir:   r.lastBreak?.dir ?? null,
    lastBreakPrice: r.lastBreak?.price ?? null,
    lastBreakAt:    r.lastBreak ? new Date(r.lastBreak.time * 1_000) : null,
    swingHigh:      r.swingHigh,
    swingLow:       r.swingLow,
    barTime:        r.barTime ? new Date(r.barTime * 1_000) : null,
    computedAt:     now,
  };
  await prisma.trendStructure.upsert({
    where:  { pair_tf: { pair, tf } },
    create: { pair, tf, ...data },
    update: data,
  });
  return { pair, tf, ok: true, bias: r.bias };
}

/**
 * Recomputes structure for every pair and timeframe. Sequential on purpose:
 * the broker feed has a 5 req/s budget shared with the live charts. A failed
 * cell keeps its previous row, which then ages out via isAutoFresh rather than
 * being replaced with a guess.
 */
export async function syncTrendStructure(pairs: string[], tfs: readonly TrendTf[] = TREND_TFS): Promise<TrendSyncResult[]> {
  const now = new Date();
  const results: TrendSyncResult[] = [];
  for (const pair of pairs) {
    for (const tf of tfs) {
      try {
        results.push(await syncOne(pair, tf, now));
      } catch (err) {
        console.error("[trend/sync]", pair, tf, err);
        results.push({ pair, tf, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  return results;
}
