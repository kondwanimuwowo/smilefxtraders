import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchEconomicCalendar, FinnhubError } from "@/lib/finnhub";
import { mapCountryToCurrency, mapEventTitleToIndicator, TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";
import type { Prisma } from "@prisma/client";

// Cron: pulls Finnhub's economic calendar for a rolling window and upserts
// into EconomicEvent. Follows the same x-cron-secret + sameOrigin auth
// pattern as /api/fx-orders/sync.

function impactToString(impact: string): string {
  return impact.toLowerCase();
}

function toEventId(ev: { event: string; country: string; time: string }): string {
  // Finnhub calendar events don't carry a stable id field in the documented
  // response shape — build a deterministic one from the fields that make an
  // event unique so re-syncs upsert instead of duplicating.
  return `finnhub:${ev.country}:${ev.event}:${ev.time}`;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const sameOrigin = origin ? origin.includes(host ?? "") : true;

  if (process.env.CRON_SECRET && !sameOrigin && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const daysBack = Number(searchParams.get("daysBack") ?? "3");
    const daysForward = Number(searchParams.get("daysForward") ?? "14");

    const from = new Date();
    from.setUTCDate(from.getUTCDate() - daysBack);
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + daysForward);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const events = await fetchEconomicCalendar(fmt(from), fmt(to));

    let saved = 0;
    let skippedUnmapped = 0;
    const flippedHighImpact: string[] = [];

    for (const ev of events) {
      const currency = mapCountryToCurrency(ev.country);
      if (!currency || !TRACKED_CURRENCIES.includes(currency as (typeof TRACKED_CURRENCIES)[number])) {
        skippedUnmapped++;
        continue;
      }

      const category = mapEventTitleToIndicator(ev.event);
      const externalId = toEventId(ev);
      const eventTime = new Date(ev.time.replace(" ", "T") + "Z");
      const actual = ev.actual !== null ? String(ev.actual) : null;

      const existing = await prisma.economicEvent.findUnique({
        where: { externalId },
        select: { actual: true, impact: true },
      });

      const data: Prisma.EconomicEventUpsertArgs["create"] = {
        externalId,
        currency,
        title: ev.event,
        category: category ?? undefined,
        impact: impactToString(ev.impact),
        actual,
        forecast: ev.estimate !== null ? String(ev.estimate) : null,
        previous: ev.prev !== null ? String(ev.prev) : null,
        eventTime,
        releasedAt: actual !== null ? new Date() : null,
      };

      await prisma.economicEvent.upsert({
        where: { externalId },
        create: data,
        update: data,
      });
      saved++;

      // Event-triggered scoped recompute: a high-impact event that just got its
      // `actual` value populated for the first time should move that currency's
      // score within minutes, not wait for tomorrow's daily batch. Layer 2/3
      // scoring isn't built yet (Phase 2) — this fires once /api/macro/scores/
      // recompute exists; for now this just tracks which currencies flipped so
      // the response is useful for monitoring during Phase 1.
      if (ev.impact === "high" && actual !== null && existing?.actual === null) {
        flippedHighImpact.push(currency);
      }
    }

    if (flippedHighImpact.length > 0) {
      const unique = [...new Set(flippedHighImpact)];
      for (const currency of unique) {
        void fetch(`${req.nextUrl.origin}/api/macro/scores/recompute?currency=${currency}`, {
          method: "POST",
          headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
        }).catch((err) => console.error("[calendar/sync] recompute trigger failed", err));
      }
    }

    return NextResponse.json({ ok: true, saved, skippedUnmapped, totalFetched: events.length, flippedHighImpact });
  } catch (err) {
    console.error("[calendar/sync]", err);
    // Finnhub upstream errors (e.g. the account's current plan tier lacking
    // calendar access — see CRON.md's known-limitation note) are a 502, not a
    // 500: this route did its job correctly, the failure is upstream.
    const status = err instanceof FinnhubError ? 502 : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed" }, { status });
  }
}
