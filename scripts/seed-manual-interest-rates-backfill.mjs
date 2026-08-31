// One-off seed: backfills central-bank rate decision history from January
// 2026 through mid-June for all 8 tracked currencies. Companion to
// seed-manual-interest-rates.mjs, which only seeded the latest decision per
// currency; this fills in the meetings before it. Same motivation as
// seed-manual-employment.mjs and seed-manual-cpi-backfill.mjs: a single
// reading gives classifySurprise nothing to infer real cadence from.
//
// All rate decisions here carry impact "high" — verified against the raw
// page for every row, unlike the employment/CPI backfills where impact
// varies by currency.
//
// Deduplicated against the 8 rows seed-manual-interest-rates.mjs already
// inserted (verified by currency+title+date before writing this list).
//
// Scraped from ForexFactory (Jan-Jun 2026 month views, the same raw pages
// already fetched for seed-manual-employment.mjs) and cross-verified against
// the raw rendered markdown — generated programmatically from that source,
// not hand-transcribed. Internally consistent with the already-seeded later
// values (EUR 2.15%->2.40% in June, AUD's 3.60%->4.35% hiking path, JPY's
// <0.75%->less-than-1.00% move all line up with what was seeded earlier).
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
  { currency: 'JPY', title: 'BOJ Policy Rate', actual: '<0.75%', forecast: '<0.75%', previous: '<0.75%', eventTime: '2026-01-23T01:07:00.000Z' },
  { currency: 'CAD', title: 'Overnight Rate', actual: '2.25%', forecast: '2.25%', previous: '2.25%', eventTime: '2026-01-28T12:45:00.000Z' },
  { currency: 'USD', title: 'Federal Funds Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-01-28T17:00:00.000Z' },
  { currency: 'AUD', title: 'Cash Rate', actual: '3.85%', forecast: '3.85%', previous: '3.60%', eventTime: '2026-02-03T01:30:00.000Z' },
  { currency: 'GBP', title: 'Official Bank Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-02-05T10:00:00.000Z' },
  { currency: 'EUR', title: 'Main Refinancing Rate', actual: '2.15%', forecast: '2.15%', previous: '2.15%', eventTime: '2026-02-05T11:15:00.000Z' },
  { currency: 'NZD', title: 'Official Cash Rate', actual: '2.25%', forecast: '2.25%', previous: '2.25%', eventTime: '2026-02-17T23:00:00.000Z' },
  { currency: 'AUD', title: 'Cash Rate', actual: '4.10%', forecast: '4.10%', previous: '3.85%', eventTime: '2026-03-17T02:30:00.000Z' },
  { currency: 'CAD', title: 'Overnight Rate', actual: '2.25%', forecast: '2.25%', previous: '2.25%', eventTime: '2026-03-18T12:45:00.000Z' },
  { currency: 'USD', title: 'Federal Funds Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-03-18T17:00:00.000Z' },
  { currency: 'JPY', title: 'BOJ Policy Rate', actual: '<0.75%', forecast: '<0.75%', previous: '<0.75%', eventTime: '2026-03-19T01:46:00.000Z' },
  { currency: 'CHF', title: 'SNB Policy Rate', actual: '0.00%', forecast: '0.00%', previous: '0.00%', eventTime: '2026-03-19T07:30:00.000Z' },
  { currency: 'GBP', title: 'Official Bank Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-03-19T11:00:00.000Z' },
  { currency: 'EUR', title: 'Main Refinancing Rate', actual: '2.15%', forecast: '2.15%', previous: '2.15%', eventTime: '2026-03-19T12:15:00.000Z' },
  { currency: 'NZD', title: 'Official Cash Rate', actual: '2.25%', forecast: '2.25%', previous: '2.25%', eventTime: '2026-04-08T01:00:00.000Z' },
  { currency: 'JPY', title: 'BOJ Policy Rate', actual: '<0.75%', forecast: '<0.75%', previous: '<0.75%', eventTime: '2026-04-28T02:04:00.000Z' },
  { currency: 'CAD', title: 'Overnight Rate', actual: '2.25%', forecast: '2.25%', previous: '2.25%', eventTime: '2026-04-29T12:45:00.000Z' },
  { currency: 'USD', title: 'Federal Funds Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-04-29T17:00:00.000Z' },
  { currency: 'GBP', title: 'Official Bank Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-04-30T10:00:00.000Z' },
  { currency: 'EUR', title: 'Main Refinancing Rate', actual: '2.15%', forecast: '2.15%', previous: '2.15%', eventTime: '2026-04-30T11:15:00.000Z' },
  { currency: 'AUD', title: 'Cash Rate', actual: '4.35%', forecast: '4.35%', previous: '4.10%', eventTime: '2026-05-05T03:30:00.000Z' },
  { currency: 'NZD', title: 'Official Cash Rate', actual: '2.25%', forecast: '2.25%', previous: '2.25%', eventTime: '2026-05-27T01:00:00.000Z' },
  { currency: 'CAD', title: 'Overnight Rate', actual: '2.25%', forecast: '2.25%', previous: '2.25%', eventTime: '2026-06-10T12:45:00.000Z' },
  { currency: 'EUR', title: 'Main Refinancing Rate', actual: '2.40%', forecast: '2.40%', previous: '2.15%', eventTime: '2026-06-11T11:15:00.000Z' },
  { currency: 'JPY', title: 'BOJ Policy Rate', actual: '<1.00%', forecast: '<1.00%', previous: '<0.75%', eventTime: '2026-06-16T02:19:00.000Z' },
  { currency: 'AUD', title: 'Cash Rate', actual: '4.35%', forecast: '4.35%', previous: '4.35%', eventTime: '2026-06-16T03:30:00.000Z' },
  { currency: 'USD', title: 'Federal Funds Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-06-17T17:00:00.000Z' },
  { currency: 'GBP', title: 'Official Bank Rate', actual: '3.75%', forecast: '3.75%', previous: '3.75%', eventTime: '2026-06-18T10:00:00.000Z' },
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
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
