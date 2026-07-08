import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGeneralNews, FinnhubError } from "@/lib/finnhub";
import { tagNewsCurrency } from "@/lib/macro/indicatorMap";

// Cron: pulls Finnhub's general/forex news feed and tags each item with a
// best-effort currency via keyword match. Runs every 30 min, offset from
// the calendar sync's :00/:15/:30/:45 cadence (see CRON.md) so they don't
// burst Finnhub's shared per-key rate budget in the same minute.

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const sameOrigin = origin ? origin.includes(host ?? "") : true;

  if (process.env.CRON_SECRET && !sameOrigin && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await fetchGeneralNews();

    let saved = 0;
    for (const item of items) {
      const currency = tagNewsCurrency(`${item.headline} ${item.summary}`);
      const externalId = `finnhub:news:${item.id}`;
      const data = {
        externalId,
        currency,
        headline: item.headline,
        summary: item.summary || null,
        url: item.url,
        source: item.source,
        publishedAt: new Date(item.datetime * 1000),
      };

      await prisma.newsItem.upsert({ where: { externalId }, create: data, update: data });
      saved++;
    }

    return NextResponse.json({ ok: true, saved, totalFetched: items.length });
  } catch (err) {
    console.error("[macro/news/sync]", err);
    const status = err instanceof FinnhubError ? 502 : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed" }, { status });
  }
}
