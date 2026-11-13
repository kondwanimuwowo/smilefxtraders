// Forward economic calendar from ForexFactory's public weekly feed.
//
// Why this exists: Finnhub's calendar endpoint is blocked on our plan tier,
// and tradingeconomics moved its calendar table behind an AWS WAF captcha
// around 11 Nov 2026, so neither gave us upcoming events and the rulebook's
// news check (rule 13) had nothing to check against. The feed carries title,
// currency, time, impact, forecast and previous for the current week. It has
// no actuals, so it feeds the calendar and the news check, not the macro
// surprise scoring.

const FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const TIMEOUT_MS = 15_000;

interface FFRow {
  title:    string;
  country:  string; // currency code, plus "All" for global holidays
  date:     string; // ISO with the feed's own offset, e.g. 2026-11-13T08:30:00-05:00
  impact:   string; // "High" | "Medium" | "Low" | "Holiday"
  forecast: string;
  previous: string;
}

export interface FFEvent {
  externalId: string;
  currency:   string;
  title:      string;
  eventTime:  Date;
  impact:     "high" | "medium" | "low";
  forecast:   string | null;
  previous:   string | null;
}

export async function fetchFFCalendar(): Promise<FFEvent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let rows: FFRow[];
  try {
    const res = await fetch(FEED_URL, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
    if (!res.ok) throw new Error(`forexfactory feed → HTTP ${res.status}`);
    rows = (await res.json()) as FFRow[];
  } finally {
    clearTimeout(timer);
  }
  if (!Array.isArray(rows)) throw new Error("forexfactory feed: unexpected response shape");

  const out: FFEvent[] = [];
  for (const r of rows) {
    if (!r?.title || !r.country || !r.date) continue;
    const eventTime = new Date(r.date);
    if (Number.isNaN(eventTime.getTime())) continue;
    const impact = r.impact?.toLowerCase();
    out.push({
      // The feed has no ids. Currency + title + UTC minute is unique within a week
      // and stable across fetches, so re-syncs update rather than duplicate.
      externalId: `ff:${r.country}:${r.title}:${eventTime.toISOString().slice(0, 16)}`,
      currency:   r.country,
      title:      r.title,
      eventTime,
      impact:     impact === "high" || impact === "medium" ? impact : "low",
      forecast:   r.forecast?.trim() || null,
      previous:   r.previous?.trim() || null,
    });
  }
  return out;
}
