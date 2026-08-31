// One-off seed: backfills the six currencies with no automated CPI source
// (GBP/NZD/JPY/CHF/CAD/AUD — see src/lib/fred.ts's file-level note) with
// their most recent real CPI release, scraped from ForexFactory on
// 2026-08-31. Inserted the same way the admin manual-entry route
// (src/app/api/admin/macro-events/route.ts) does: externalId prefixed
// "manual:" so it shows up correctly in that admin page and is excluded
// from ever being treated as a Finnhub-sourced row.
//
// ForexFactory times are America/New_York (EDT, UTC-4 in Jul/Aug) —
// converted to UTC below. Impact is corrected to ForexFactory's real
// convention where the scrape's label conflicted with itself across two
// separate page loads (headline CPI is red/high; Tokyo Core CPI, a
// regional proxy for Japan's nationwide print, is genuinely medium).
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

function parseEnv(p) {
  const o = {};
  for (const l of readFileSync(p, "utf8").split("\n")) {
    const t = l.trim();
    if (!t || t.startsWith("#")) continue;
    const e = t.indexOf("=");
    if (e === -1) continue;
    let v = t.slice(e + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    o[t.slice(0, e).trim()] = v;
  }
  return o;
}
const env = { ...parseEnv(".env"), ...(existsSync(".env.local") ? parseEnv(".env.local") : {}) };

const ROWS = [
  { currency: "CAD", title: "CPI m/m",            impact: "high",   actual: "-0.4%", forecast: "-0.2%", previous: "1.0%",  eventTime: "2026-07-20T11:30:00.000Z" },
  { currency: "NZD", title: "CPI q/q",             impact: "high",   actual: "1.5%",  forecast: "1.4%",  previous: "0.9%",  eventTime: "2026-07-20T21:45:00.000Z" },
  { currency: "CHF", title: "CPI m/m",             impact: "high",   actual: "-0.1%", forecast: "-0.1%", previous: "0.0%",  eventTime: "2026-08-03T05:30:00.000Z" },
  { currency: "GBP", title: "CPI y/y",             impact: "high",   actual: "2.9%",  forecast: "2.9%",  previous: "2.6%",  eventTime: "2026-08-19T05:00:00.000Z" },
  { currency: "JPY", title: "Tokyo Core CPI y/y",  impact: "medium", actual: "1.8%",  forecast: "1.8%",  previous: "1.7%",  eventTime: "2026-08-27T22:30:00.000Z" },
  { currency: "AUD", title: "CPI y/y",             impact: "high",   actual: "3.5%",  forecast: "3.3%",  previous: "3.8%",  eventTime: "2026-08-28T00:30:00.000Z" },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'CPI'::"IndicatorType", $5, $6, $7, $8, $9, now(), now(), now())`,
    [id, externalId, row.currency, row.title, row.impact, row.actual, row.forecast, row.previous, row.eventTime],
  );
  console.log(`seeded ${row.currency} ${row.title} (${row.eventTime})`);
}

await client.end();
console.log(`done — ${ROWS.length} rows inserted`);
