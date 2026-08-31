// One-off seed: Unemployment Rate for all 8 tracked currencies, from the
// start of 2026 through the most recent August release (59 rows). Not just
// the latest reading per currency — with only a single reading, classifySurprise
// (confidence.ts) has no prior release to infer cadence from and defaults to
// unconditionally "high", which meant the cadence-aware staleness fix built
// alongside this seed wasn't actually being exercised. A real history gives
// it something to measure against.
//
// Standardized on "Unemployment Rate" specifically for every currency, not
// "Employment Change"/"Claimant Count Change" — those are jobs-added counts
// (higher = better), the opposite sign convention from a rate (higher =
// worse), and scoring.ts's toRuleValue() inverts EMPLOYMENT unconditionally
// assuming a rate. Mixing the two under one IndicatorType would score some
// readings backwards.
//
// Scraped from ForexFactory (Jan-Aug 2026 month views) and cross-verified
// against the raw rendered markdown before use, not trusted from a single
// JSON-extraction pass — see seed-manual-interest-rates.mjs's header for why
// that matters. Same manual: externalId scheme as the admin page. Times
// converted from ForexFactory's America/New_York (EDT, UTC-4) to UTC.
//
// NZD is genuinely quarterly at the source (Feb/May/Aug only here) - not a
// gap in the scrape.
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
  { currency: 'EUR', actual: '6.3%', forecast: '6.4%', previous: '6.4%', eventTime: '2026-01-08T08:00:00.000Z' },
  { currency: 'CHF', actual: '3.0%', forecast: '3.0%', previous: '3.0%', eventTime: '2026-01-09T06:00:00.000Z' },
  { currency: 'CAD', actual: '6.8%', forecast: '6.7%', previous: '6.5%', eventTime: '2026-01-09T11:30:00.000Z' },
  { currency: 'USD', actual: '4.4%', forecast: '4.5%', previous: '4.6%', eventTime: '2026-01-09T11:30:00.000Z' },
  { currency: 'GBP', actual: '5.1%', forecast: '5.1%', previous: '5.1%', eventTime: '2026-01-20T05:00:00.000Z' },
  { currency: 'AUD', actual: '4.1%', forecast: '4.4%', previous: '4.3%', eventTime: '2026-01-21T22:30:00.000Z' },
  { currency: 'JPY', actual: '2.6%', forecast: '2.6%', previous: '2.6%', eventTime: '2026-01-29T21:30:00.000Z' },
  { currency: 'EUR', actual: '6.2%', forecast: '6.3%', previous: '6.3%', eventTime: '2026-01-30T08:00:00.000Z' },
  { currency: 'NZD', actual: '5.4%', forecast: '5.3%', previous: '5.3%', eventTime: '2026-02-03T19:45:00.000Z' },
  { currency: 'CHF', actual: '2.9%', forecast: '3.0%', previous: '3.0%', eventTime: '2026-02-06T06:00:00.000Z' },
  { currency: 'CAD', actual: '6.5%', forecast: '6.8%', previous: '6.8%', eventTime: '2026-02-06T11:30:00.000Z' },
  { currency: 'USD', actual: '4.3%', forecast: '4.4%', previous: '4.4%', eventTime: '2026-02-11T11:30:00.000Z' },
  { currency: 'GBP', actual: '5.2%', forecast: '5.2%', previous: '5.1%', eventTime: '2026-02-17T05:00:00.000Z' },
  { currency: 'AUD', actual: '4.1%', forecast: '4.2%', previous: '4.1%', eventTime: '2026-02-18T22:30:00.000Z' },
  { currency: 'JPY', actual: '2.7%', forecast: '2.6%', previous: '2.6%', eventTime: '2026-03-02T21:30:00.000Z' },
  { currency: 'EUR', actual: '6.1%', forecast: '6.2%', previous: '6.3%', eventTime: '2026-03-04T08:00:00.000Z' },
  { currency: 'CHF', actual: '3.0%', forecast: '2.9%', previous: '2.9%', eventTime: '2026-03-05T06:00:00.000Z' },
  { currency: 'USD', actual: '4.4%', forecast: '4.3%', previous: '4.3%', eventTime: '2026-03-06T11:30:00.000Z' },
  { currency: 'CAD', actual: '6.7%', forecast: '6.6%', previous: '6.5%', eventTime: '2026-03-13T11:30:00.000Z' },
  { currency: 'AUD', actual: '4.3%', forecast: '4.1%', previous: '4.1%', eventTime: '2026-03-18T23:30:00.000Z' },
  { currency: 'GBP', actual: '5.2%', forecast: '5.3%', previous: '5.2%', eventTime: '2026-03-19T06:00:00.000Z' },
  { currency: 'JPY', actual: '2.6%', forecast: '2.7%', previous: '2.7%', eventTime: '2026-03-30T22:30:00.000Z' },
  { currency: 'EUR', actual: '6.2%', forecast: '6.1%', previous: '6.1%', eventTime: '2026-04-01T08:00:00.000Z' },
  { currency: 'USD', actual: '4.3%', forecast: '4.4%', previous: '4.4%', eventTime: '2026-04-03T11:30:00.000Z' },
  { currency: 'CHF', actual: '3.0%', forecast: '3.0%', previous: '3.0%', eventTime: '2026-04-08T06:00:00.000Z' },
  { currency: 'CAD', actual: '6.7%', forecast: '6.8%', previous: '6.7%', eventTime: '2026-04-10T11:30:00.000Z' },
  { currency: 'AUD', actual: '4.3%', forecast: '4.3%', previous: '4.3%', eventTime: '2026-04-16T00:30:00.000Z' },
  { currency: 'GBP', actual: '4.9%', forecast: '5.2%', previous: '5.2%', eventTime: '2026-04-21T05:00:00.000Z' },
  { currency: 'JPY', actual: '2.7%', forecast: '2.6%', previous: '2.6%', eventTime: '2026-04-27T22:30:00.000Z' },
  { currency: 'EUR', actual: '6.2%', forecast: '6.2%', previous: '6.3%', eventTime: '2026-04-30T08:00:00.000Z' },
  { currency: 'NZD', actual: '5.3%', forecast: '5.4%', previous: '5.4%', eventTime: '2026-05-05T21:45:00.000Z' },
  { currency: 'CHF', actual: '3.0%', forecast: '3.0%', previous: '3.0%', eventTime: '2026-05-07T06:00:00.000Z' },
  { currency: 'CAD', actual: '6.9%', forecast: '6.7%', previous: '6.7%', eventTime: '2026-05-08T11:30:00.000Z' },
  { currency: 'USD', actual: '4.3%', forecast: '4.3%', previous: '4.3%', eventTime: '2026-05-08T11:30:00.000Z' },
  { currency: 'GBP', actual: '5.0%', forecast: '4.9%', previous: '4.9%', eventTime: '2026-05-19T05:00:00.000Z' },
  { currency: 'AUD', actual: '4.5%', forecast: '4.3%', previous: '4.3%', eventTime: '2026-05-21T00:30:00.000Z' },
  { currency: 'JPY', actual: '2.5%', forecast: '2.7%', previous: '2.7%', eventTime: '2026-05-28T22:30:00.000Z' },
  { currency: 'EUR', actual: '6.3%', forecast: '6.2%', previous: '6.3%', eventTime: '2026-06-01T08:00:00.000Z' },
  { currency: 'CHF', actual: '3.1%', forecast: '3.0%', previous: '3.0%', eventTime: '2026-06-04T06:00:00.000Z' },
  { currency: 'CAD', actual: '6.6%', forecast: '6.9%', previous: '6.9%', eventTime: '2026-06-05T11:30:00.000Z' },
  { currency: 'USD', actual: '4.3%', forecast: '4.3%', previous: '4.3%', eventTime: '2026-06-05T11:30:00.000Z' },
  { currency: 'GBP', actual: '4.9%', forecast: '5.0%', previous: '5.0%', eventTime: '2026-06-18T05:00:00.000Z' },
  { currency: 'AUD', actual: '4.4%', forecast: '4.4%', previous: '4.5%', eventTime: '2026-06-25T00:30:00.000Z' },
  { currency: 'JPY', actual: '2.5%', forecast: '2.5%', previous: '2.5%', eventTime: '2026-06-29T22:30:00.000Z' },
  { currency: 'EUR', actual: '6.2%', forecast: '6.3%', previous: '6.2%', eventTime: '2026-07-02T08:00:00.000Z' },
  { currency: 'USD', actual: '4.2%', forecast: '4.3%', previous: '4.3%', eventTime: '2026-07-02T11:30:00.000Z' },
  { currency: 'CHF', actual: '3.1%', forecast: '3.1%', previous: '3.1%', eventTime: '2026-07-06T06:00:00.000Z' },
  { currency: 'CAD', actual: '6.5%', forecast: '6.6%', previous: '6.6%', eventTime: '2026-07-10T11:30:00.000Z' },
  { currency: 'GBP', actual: '4.9%', forecast: '4.9%', previous: '4.9%', eventTime: '2026-07-21T05:00:00.000Z' },
  { currency: 'AUD', actual: '4.4%', forecast: '4.4%', previous: '4.4%', eventTime: '2026-07-23T00:30:00.000Z' },
  { currency: 'EUR', actual: '6.3%', forecast: '6.2%', previous: '6.3%', eventTime: '2026-07-30T08:00:00.000Z' },
  { currency: 'JPY', actual: '2.5%', forecast: '2.5%', previous: '2.5%', eventTime: '2026-07-30T22:30:00.000Z' },
  { currency: 'NZD', actual: '5.6%', forecast: '5.4%', previous: '5.4%', eventTime: '2026-08-04T21:45:00.000Z' },
  { currency: 'CHF', actual: '3.1%', forecast: '3.1%', previous: '3.1%', eventTime: '2026-08-06T06:00:00.000Z' },
  { currency: 'CAD', actual: '6.4%', forecast: '6.5%', previous: '6.5%', eventTime: '2026-08-07T11:30:00.000Z' },
  { currency: 'USD', actual: '4.1%', forecast: '4.2%', previous: '4.2%', eventTime: '2026-08-07T11:30:00.000Z' },
  { currency: 'GBP', actual: '4.9%', forecast: '4.8%', previous: '4.9%', eventTime: '2026-08-18T05:00:00.000Z' },
  { currency: 'AUD', actual: '4.5%', forecast: '4.4%', previous: '4.4%', eventTime: '2026-08-20T00:30:00.000Z' },
  { currency: 'JPY', actual: '2.4%', forecast: '2.5%', previous: '2.5%', eventTime: '2026-08-27T22:30:00.000Z' },
];

// Real ForexFactory impact colors for this release, verified against the raw
// page (not assumed): NZD/CAD/USD/AUD run red (high); EUR/CHF/GBP/JPY run
// yellow (low) — Unemployment Rate is a secondary same-day figure for those
// four, not the headline release.
const HIGH_IMPACT = new Set(["NZD", "CAD", "USD", "AUD"]);

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  const impact = HIGH_IMPACT.has(row.currency) ? "high" : "low";
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'Unemployment Rate', 'EMPLOYMENT'::"IndicatorType", $4, $5, $6, $7, $8, now(), now(), now())`,
    [id, externalId, row.currency, impact, row.actual, row.forecast, row.previous, row.eventTime],
  );
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
