// One-off seed: the most recent completed central-bank rate decision for
// each of MacroEdge's 8 tracked currencies. INTEREST_RATE ties for the
// highest scoring weight (see scoring.ts's INDICATOR_WEIGHTS), and FRED's
// own series for GBP/NZD/CHF/CAD/AUD are documented proxies, not the real
// policy rate (see fred.ts) — a real calendar surprise reading is a genuine
// upgrade, not just a gap-fill.
//
// Scraped and cross-verified against ForexFactory's raw page content on
// 2026-08-31 (NOT trusted from a first-pass LLM JSON extraction, which
// fabricated a plausible-looking but entirely wrong batch for this same
// query — every value here was independently located in the real rendered
// month-view markdown before use). Same manual: externalId scheme as the
// admin page. Times converted from ForexFactory's America/New_York (EDT,
// UTC-4 in Jun/Jul/Aug) to UTC.
//
// CHF (Jun 18) and NZD (Jul 7) are already outside the 45-day scoring
// window as of this seed; CAD (Jul 15) is right at the edge. They're still
// real and worth having — they'll matter again once refreshed after each
// bank's next meeting.
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
  { currency: "CHF", title: "SNB Policy Rate",       actual: "0.00%",  forecast: "0.00%",  previous: "0.00%",  eventTime: "2026-06-18T06:30:00.000Z" },
  { currency: "NZD", title: "Official Cash Rate",    actual: "2.50%",  forecast: "2.50%",  previous: "2.25%",  eventTime: "2026-07-08T01:00:00.000Z" },
  { currency: "CAD", title: "Overnight Rate",        actual: "2.25%",  forecast: "2.25%",  previous: "2.25%",  eventTime: "2026-07-15T12:45:00.000Z" },
  { currency: "EUR", title: "Main Refinancing Rate", actual: "2.40%",  forecast: "2.40%",  previous: "2.40%",  eventTime: "2026-07-23T11:15:00.000Z" },
  { currency: "USD", title: "Federal Funds Rate",    actual: "3.75%",  forecast: "3.75%",  previous: "3.75%",  eventTime: "2026-07-29T17:00:00.000Z" },
  { currency: "GBP", title: "Official Bank Rate",    actual: "3.75%",  forecast: "3.75%",  previous: "3.75%",  eventTime: "2026-07-30T10:00:00.000Z" },
  { currency: "JPY", title: "BOJ Policy Rate",       actual: "<1.00%", forecast: "<1.00%", previous: "<1.00%", eventTime: "2026-07-31T02:11:00.000Z" },
  { currency: "AUD", title: "Cash Rate",             actual: "4.35%",  forecast: "4.35%",  previous: "4.35%",  eventTime: "2026-08-11T03:30:00.000Z" },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'INTEREST_RATE'::"IndicatorType", 'high', $5, $6, $7, $8, now(), now(), now())`,
    [id, externalId, row.currency, row.title, row.actual, row.forecast, row.previous, row.eventTime],
  );
  console.log(`seeded ${row.currency} ${row.title} (${row.eventTime})`);
}

await client.end();
console.log(`done — ${ROWS.length} rows inserted`);
