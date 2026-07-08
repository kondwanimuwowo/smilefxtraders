import { NextRequest, NextResponse } from "next/server";
import { DataSource, IndicatorType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchFredSeries, latestValidObservation, FredNotConfiguredError, FRED_SERIES } from "@/lib/fred";
import { fetchWorldBankIndicator, recentNonNull, WORLD_BANK_COUNTRY_CODE, WORLD_BANK_INDICATORS } from "@/lib/worldbank";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";

// Cron: pulls FRED + World Bank indicator levels into MacroIndicatorSnapshot
// (Layer 1's slower-moving, non-calendar data). Follows the same
// x-cron-secret + sameOrigin auth pattern as the other sync routes.
//
// FRED_API_KEY is NOT currently set in this project's env (only Finnhub was
// confirmed available as of Phase 2) — the FRED half of this sync no-ops
// gracefully (catches FredNotConfiguredError, logs once, skips) rather than
// failing the whole request, exactly like the Finnhub calendar-tier
// fallback in Phase 1. World Bank needs no key and runs unconditionally.

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const sameOrigin = origin ? origin.includes(host ?? "") : true;

  if (process.env.CRON_SECRET && !sameOrigin && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { worldBank: { saved: 0, errors: [] as string[] }, fred: { saved: 0, skipped: false, errors: [] as string[] } };

  // ── World Bank (always runs, no key required) ──────────────────────────
  for (const currency of TRACKED_CURRENCIES) {
    const countryCode = WORLD_BANK_COUNTRY_CODE[currency];
    for (const [indicatorKey, indicatorId] of Object.entries(WORLD_BANK_INDICATORS)) {
      if (!indicatorId) continue;
      try {
        const rows = await fetchWorldBankIndicator(countryCode, indicatorId);
        const recent = recentNonNull(rows, 3);
        if (recent.length === 0) continue;

        for (const row of recent) {
          if (row.value === null) continue;
          const periodDate = new Date(`${row.date}-01-01T00:00:00.000Z`);
          await prisma.macroIndicatorSnapshot.upsert({
            where: {
              currency_indicatorType_periodDate: {
                currency,
                indicatorType: indicatorKey as IndicatorType,
                periodDate,
              },
            },
            create: {
              currency,
              indicatorType: indicatorKey as IndicatorType,
              value: row.value,
              periodDate,
              source: DataSource.WORLD_BANK,
            },
            update: { value: row.value },
          });
          results.worldBank.saved++;
        }
      } catch (err) {
        results.worldBank.errors.push(`${currency}/${indicatorKey}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // ── FRED (skips gracefully if FRED_API_KEY is unset) ────────────────────
  for (const currency of TRACKED_CURRENCIES) {
    const seriesForCurrency = FRED_SERIES[currency] ?? {};
    for (const [indicatorKey, seriesId] of Object.entries(seriesForCurrency)) {
      if (!seriesId) continue;
      try {
        const obs = await fetchFredSeries(seriesId);
        const latest = latestValidObservation(obs);
        if (!latest) continue;

        const value = Number.parseFloat(latest.value);
        if (!Number.isFinite(value)) continue;

        const periodDate = new Date(`${latest.date}T00:00:00.000Z`);
        await prisma.macroIndicatorSnapshot.upsert({
          where: {
            currency_indicatorType_periodDate: {
              currency,
              indicatorType: indicatorKey as IndicatorType,
              periodDate,
            },
          },
          create: {
            currency,
            indicatorType: indicatorKey as IndicatorType,
            value,
            periodDate,
            source: DataSource.FRED,
          },
          update: { value },
        });
        results.fred.saved++;
      } catch (err) {
        if (err instanceof FredNotConfiguredError) {
          results.fred.skipped = true;
          break;
        }
        results.fred.errors.push(`${currency}/${indicatorKey}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (results.fred.skipped) break;
  }

  return NextResponse.json({ ok: true, ...results });
}
