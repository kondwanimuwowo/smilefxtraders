import { NextRequest, NextResponse } from "next/server";
import { recomputeAndStoreCurrencyScore } from "@/lib/macro/scoring";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";

// Cron (daily, after indicators+news land) + event-triggered (fired
// fire-and-forget from /api/calendar/sync on a fresh high-impact release).
// ?currency=X scopes to one currency for the event-triggered case; no query
// param recomputes every tracked currency (the daily safety-net run).

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const sameOrigin = origin ? origin.includes(host ?? "") : true;

  if (process.env.CRON_SECRET && !sameOrigin && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const currencyParam = searchParams.get("currency")?.toUpperCase();

  const targets = currencyParam
    ? [currencyParam].filter((c) => TRACKED_CURRENCIES.includes(c as (typeof TRACKED_CURRENCIES)[number]))
    : [...TRACKED_CURRENCIES];

  if (targets.length === 0) {
    return NextResponse.json({ error: `Unknown or untracked currency: ${currencyParam}` }, { status: 400 });
  }

  const results = [];
  for (const currency of targets) {
    try {
      const score = await recomputeAndStoreCurrencyScore(currency);
      results.push({ currency, totalScore: score.totalScore, ok: true });
    } catch (err) {
      console.error(`[macro/scores/recompute] ${currency}`, err);
      results.push({ currency, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
