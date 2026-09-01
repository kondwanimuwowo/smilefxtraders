import { NextRequest, NextResponse } from "next/server";
import { DataSource, IndicatorType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  fetchTEBondYields,
  fetchTEIndicatorLevels,
  fetchTECalendarEvents,
} from "@/lib/tradingeconomics";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";

// Cron: unified tradingeconomics.com sync, covering everything a manual
// ForexFactory/worldgovernmentbonds.com pass did by hand earlier this
// session — bond yields, indicator levels (the FRED/World Bank level path),
// and calendar releases (the surprise path) — from one source, on a
// schedule, going forward.
//
// Deliberately NOT using Cloudflare Browser Run: every page this route
// touches is server-rendered plain HTML (verified live 2026-09-01), so a
// plain fetch() + regex parse works, same shape as the existing FRED/World
// Bank/Eurostat sync. That also means there is no LLM extraction step
// anywhere in this route, so nothing here can hallucinate the way an
// AI "read this page and tell me what's on it" pass can (see
// scripts/seed-manual-interest-rates.mjs's header note, where exactly that
// happened against a different source's own JSON-extraction feature).
//
// Same bounded-concurrency pattern as indicators/sync/route.ts (2026-08-31
// perf fix) — every (currency, indicator/event) unit here is independent.

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

// Reuses the scoring weight table's own tiers as a display-impact proxy —
// impact is UI-only (rules.ts/confidence.ts never read it), so this is
// "which of our own weights is this" rather than a claim about TE's actual
// editorial importance rating.
const IMPACT_BY_INDICATOR: Record<IndicatorType, "high" | "medium" | "low"> = {
  [IndicatorType.INTEREST_RATE]: "high",
  [IndicatorType.BOND_YIELD_10Y]: "high",
  [IndicatorType.CPI]: "high",
  [IndicatorType.EMPLOYMENT]: "high",
  [IndicatorType.GDP]: "medium",
  [IndicatorType.MANUFACTURING_PMI]: "medium",
  [IndicatorType.RETAIL_SALES]: "medium",
  [IndicatorType.CONSUMER_CONFIDENCE]: "low",
  [IndicatorType.TRADE_BALANCE]: "low",
};

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
    bondYields: { saved: 0, errors: [] as string[] },
    indicatorLevels: { saved: 0, errors: [] as string[] },
    calendar: { saved: 0, errors: [] as string[] },
  };

  // ── Bond yields (tradingeconomics.com/bonds — one shared page) ──────────
  try {
    const periodDate = new Date();
    periodDate.setUTCHours(0, 0, 0, 0);
    const yields = await fetchTEBondYields();
    for (const currency of TRACKED_CURRENCIES) {
      const value = yields[currency];
      if (value === undefined) continue;
      await prisma.macroIndicatorSnapshot.upsert({
        where: {
          currency_indicatorType_periodDate: {
            currency,
            indicatorType: IndicatorType.BOND_YIELD_10Y,
            periodDate,
          },
        },
        create: {
          currency,
          indicatorType: IndicatorType.BOND_YIELD_10Y,
          value,
          unit: "percent",
          periodDate,
          source: DataSource.TRADING_ECONOMICS,
        },
        update: { value, source: DataSource.TRADING_ECONOMICS, fetchedAt: new Date() },
      });
      results.bondYields.saved++;
    }
  } catch (err) {
    results.bondYields.errors.push(err instanceof Error ? err.message : String(err));
  }

  // ── Indicator levels (tradingeconomics.com/{country}/indicators) ────────
  const levelOutcomes = await mapWithConcurrency(
    [...TRACKED_CURRENCIES],
    CONCURRENCY,
    async (currency): Promise<UnitOutcome> => {
      try {
        const levels = await fetchTEIndicatorLevels(currency);
        const periodDate = new Date();
        periodDate.setUTCDate(1);
        periodDate.setUTCHours(0, 0, 0, 0);
        let saved = 0;
        for (const level of levels) {
          await prisma.macroIndicatorSnapshot.upsert({
            where: {
              currency_indicatorType_periodDate: {
                currency,
                indicatorType: level.indicatorType,
                periodDate,
              },
            },
            create: {
              currency,
              indicatorType: level.indicatorType,
              value: level.current,
              periodDate,
              source: DataSource.TRADING_ECONOMICS,
            },
            update: { value: level.current, source: DataSource.TRADING_ECONOMICS, fetchedAt: new Date() },
          });
          saved++;
        }
        return { ok: true, saved };
      } catch (err) {
        return { ok: false, error: `${currency}: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  );
  for (const outcome of levelOutcomes) {
    if (outcome.ok) results.indicatorLevels.saved += outcome.saved;
    else results.indicatorLevels.errors.push(outcome.error);
  }

  // ── Calendar events (tradingeconomics.com/{country}/calendar) ───────────
  //
  // Bounded same-day window for unreleased events: TE's own calendar page
  // clusters around the current day (verified live), so this deliberately
  // does NOT try to replace the Finnhub sync's -3/+14 day forward coverage
  // (/api/calendar/sync, Job 5) -- only today's not-yet-released events are
  // let through here, closing the "no upcoming events" gap for same-day
  // releases Finnhub's job has missed, without duplicating its job.
  const endOfTodayUTC = new Date();
  endOfTodayUTC.setUTCHours(23, 59, 59, 999);
  const DEDUP_WINDOW_MS = 90 * 60 * 1000;

  const calendarOutcomes = await mapWithConcurrency(
    [...TRACKED_CURRENCIES],
    CONCURRENCY,
    async (currency): Promise<UnitOutcome> => {
      try {
        const events = await fetchTECalendarEvents(currency);
        let saved = 0;
        for (const ev of events) {
          // A released event is always worth persisting. An unreleased one
          // is only worth persisting if it's still today -- further out and
          // it belongs to Finnhub's forward-looking job instead.
          if (!ev.actual && ev.eventTime.getTime() > endOfTodayUTC.getTime()) continue;

          if (!ev.actual) {
            // Dedup guard: skip if a non-TE source (Finnhub) already has this
            // same event, so an unreleased row doesn't show up twice in the
            // UI under two different externalIds ("te:<id>" vs Finnhub's own
            // scheme) for what is the same real-world release.
            const duplicate = await prisma.economicEvent.findFirst({
              where: {
                currency,
                category: ev.indicatorType,
                eventTime: {
                  gte: new Date(ev.eventTime.getTime() - DEDUP_WINDOW_MS),
                  lte: new Date(ev.eventTime.getTime() + DEDUP_WINDOW_MS),
                },
                externalId: { not: { startsWith: "te:" } },
              },
              select: { id: true },
            });
            if (duplicate) continue;
          }

          await prisma.economicEvent.upsert({
            where: { externalId: ev.externalId },
            create: {
              externalId: ev.externalId,
              currency,
              title: ev.title,
              category: ev.indicatorType,
              impact: IMPACT_BY_INDICATOR[ev.indicatorType],
              actual: ev.actual,
              forecast: ev.forecast,
              previous: ev.previous,
              eventTime: ev.eventTime,
              releasedAt: ev.actual ? new Date() : null,
            },
            update: {
              actual: ev.actual,
              forecast: ev.forecast,
              previous: ev.previous,
              releasedAt: ev.actual ? new Date() : undefined,
            },
          });
          saved++;
        }
        return { ok: true, saved };
      } catch (err) {
        return { ok: false, error: `${currency}: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  );
  for (const outcome of calendarOutcomes) {
    if (outcome.ok) results.calendar.saved += outcome.saved;
    else results.calendar.errors.push(outcome.error);
  }

  return NextResponse.json({ ok: true, ...results });
}
