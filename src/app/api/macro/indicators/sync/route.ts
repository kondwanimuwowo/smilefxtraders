import { NextRequest, NextResponse } from "next/server";
import { DataSource, IndicatorType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchFredSeries, recentValidObservations, FRED_SERIES } from "@/lib/fred";
import { fetchWorldBankIndicator, recentNonNull, WORLD_BANK_COUNTRY_CODE, WORLD_BANK_INDICATORS } from "@/lib/worldbank";
import { fetchEurostatUnemploymentRate, recentEurostatObservations } from "@/lib/eurostat";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";

// Cron: pulls FRED + World Bank indicator levels into MacroIndicatorSnapshot
// (Layer 1's slower-moving, non-calendar data). Follows the same
// x-cron-secret + sameOrigin auth pattern as the other sync routes.
//
// FRED_API_KEY is configured (added post-Phase-2, live-verified: all 8
// USD/EUR/GBP/NZD series in FRED_SERIES resolved successfully). If the key
// is ever removed, this half of the sync no-ops gracefully (checked once up
// front, not per-series) rather than failing the whole request, same as the
// Finnhub calendar-tier fallback in Phase 1. World Bank needs no key and
// runs unconditionally.
//
// 2026-08-31: was a fully sequential for-await loop over every (currency,
// indicator) pair. That was already close to cron-jobs.org's 45s timeout at
// 4 tracked currencies; doubling to 8 currencies this session (~60 outbound
// fetches, each with its own awaited DB upsert -- 150-200+ sequential round
// trips total) pushed it over the edge and the job started failing on
// timeouts. Every (currency, indicator) unit here is independent of every
// other, so there was never a reason for this to be sequential -- switched
// to a small bounded-concurrency runner instead of a raw Promise.all, since
// firing all ~60 requests at once risks Workers' concurrent-subrequest limit
// and FRED/World Bank's own rate limits.

const CONCURRENCY = 8;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

type UnitOutcome = { ok: true; saved: number } | { ok: false; error: string };

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const sameOrigin = origin ? origin.includes(host ?? "") : true;

  if (process.env.CRON_SECRET && !sameOrigin && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    worldBank: { saved: 0, errors: [] as string[] },
    fred: { saved: 0, skipped: false, errors: [] as string[] },
    eurostat: { saved: 0, errors: [] as string[] },
  };

  // ── World Bank (always runs, no key required) ──────────────────────────
  const worldBankTasks = TRACKED_CURRENCIES.flatMap((currency) =>
    Object.entries(WORLD_BANK_INDICATORS)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([indicatorKey, indicatorId]) => ({ currency, indicatorKey, indicatorId })),
  );

  const worldBankOutcomes = await mapWithConcurrency(worldBankTasks, CONCURRENCY, async (task): Promise<UnitOutcome> => {
    try {
      const countryCode = WORLD_BANK_COUNTRY_CODE[task.currency];
      const rows = await fetchWorldBankIndicator(countryCode, task.indicatorId);
      const recent = recentNonNull(rows, 3);
      let saved = 0;
      for (const row of recent) {
        if (row.value === null) continue;
        const periodDate = new Date(`${row.date}-01-01T00:00:00.000Z`);
        await prisma.macroIndicatorSnapshot.upsert({
          where: {
            currency_indicatorType_periodDate: {
              currency: task.currency,
              indicatorType: task.indicatorKey as IndicatorType,
              periodDate,
            },
          },
          create: {
            currency: task.currency,
            indicatorType: task.indicatorKey as IndicatorType,
            value: row.value,
            periodDate,
            source: DataSource.WORLD_BANK,
          },
          update: { value: row.value },
        });
        saved++;
      }
      return { ok: true, saved };
    } catch (err) {
      return { ok: false, error: `${task.currency}/${task.indicatorKey}: ${err instanceof Error ? err.message : String(err)}` };
    }
  });
  for (const outcome of worldBankOutcomes) {
    if (outcome.ok) results.worldBank.saved += outcome.saved;
    else results.worldBank.errors.push(outcome.error);
  }

  // ── FRED (skips gracefully if FRED_API_KEY is unset) ────────────────────
  if (!process.env.FRED_API_KEY) {
    results.fred.skipped = true;
  } else {
    const fredTasks = TRACKED_CURRENCIES.flatMap((currency) =>
      Object.entries(FRED_SERIES[currency] ?? {})
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([indicatorKey, seriesId]) => ({ currency, indicatorKey, seriesId })),
    );

    const fredOutcomes = await mapWithConcurrency(fredTasks, CONCURRENCY, async (task): Promise<UnitOutcome> => {
      try {
        const obs = await fetchFredSeries(task.seriesId, 8);
        const recent = recentValidObservations(obs, 3);
        let saved = 0;
        for (const point of recent) {
          const value = Number.parseFloat(point.value);
          if (!Number.isFinite(value)) continue;

          const periodDate = new Date(`${point.date}T00:00:00.000Z`);
          await prisma.macroIndicatorSnapshot.upsert({
            where: {
              currency_indicatorType_periodDate: {
                currency: task.currency,
                indicatorType: task.indicatorKey as IndicatorType,
                periodDate,
              },
            },
            create: {
              currency: task.currency,
              indicatorType: task.indicatorKey as IndicatorType,
              value,
              periodDate,
              source: DataSource.FRED,
            },
            update: { value },
          });
          saved++;
        }
        return { ok: true, saved };
      } catch (err) {
        return { ok: false, error: `${task.currency}/${task.indicatorKey}: ${err instanceof Error ? err.message : String(err)}` };
      }
    });
    for (const outcome of fredOutcomes) {
      if (outcome.ok) results.fred.saved += outcome.saved;
      else results.fred.errors.push(outcome.error);
    }
  }

  // ── Eurostat (EUR employment only — the one FRED-dead series; no key required) ──
  try {
    const sinceYear = new Date().getFullYear() - 1;
    const rows = await fetchEurostatUnemploymentRate(sinceYear);
    const recent = recentEurostatObservations(rows, 3);

    for (const row of recent) {
      const periodDate = new Date(`${row.period}-01T00:00:00.000Z`);
      await prisma.macroIndicatorSnapshot.upsert({
        where: {
          currency_indicatorType_periodDate: {
            currency: "EUR",
            indicatorType: IndicatorType.EMPLOYMENT,
            periodDate,
          },
        },
        create: {
          currency: "EUR",
          indicatorType: IndicatorType.EMPLOYMENT,
          value: row.value,
          periodDate,
          source: DataSource.EUROSTAT,
        },
        update: { value: row.value },
      });
      results.eurostat.saved++;
    }
  } catch (err) {
    results.eurostat.errors.push(err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({ ok: true, ...results });
}
