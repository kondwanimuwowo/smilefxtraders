// One-off seed: backfills CPI history from January 2026 through August for
// the six currencies with no automated CPI source (GBP/NZD/JPY/CHF/CAD/AUD -
// see fred.ts). Companion to seed-manual-cpi.mjs, which only seeded the
// latest reading per currency; this fills in the months before it so
// classifySurprise has real cadence to measure against, same motivation as
// seed-manual-employment.mjs.
//
// Deduplicated against the 6 rows seed-manual-cpi.mjs already inserted
// (verified by currency+title+date before writing this list) - do not run
// both scripts' data through twice.
//
// Scraped from ForexFactory (Jan-Aug 2026 month views, the same raw pages
// already fetched for seed-manual-employment.mjs) and cross-verified against
// the raw rendered markdown, generated programmatically from that source
// rather than transcribed by hand - a hand-copied date in the original CPI
// seed (AUD CPI y/y) turned out to be off by 2 days, caught and fixed
// separately when re-deriving this list from the same source data.
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
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '3.4%', forecast: '3.6%', previous: '3.8%', eventTime: '2026-01-06T22:30:00.000Z' },
  { currency: 'CHF', title: 'CPI m/m', impact: 'high', actual: '0.0%', forecast: '0.0%', previous: '-0.2%', eventTime: '2026-01-08T05:30:00.000Z' },
  { currency: 'CAD', title: 'CPI m/m', impact: 'high', actual: '-0.2%', forecast: '-0.4%', previous: '0.1%', eventTime: '2026-01-19T11:30:00.000Z' },
  { currency: 'GBP', title: 'CPI y/y', impact: 'high', actual: '3.4%', forecast: '3.3%', previous: '3.2%', eventTime: '2026-01-21T05:00:00.000Z' },
  { currency: 'NZD', title: 'CPI q/q', impact: 'high', actual: '0.6%', forecast: '0.5%', previous: '1.0%', eventTime: '2026-01-22T19:45:00.000Z' },
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '3.8%', forecast: '3.5%', previous: '3.4%', eventTime: '2026-01-27T22:30:00.000Z' },
  { currency: 'JPY', title: 'Tokyo Core CPI y/y', impact: 'medium', actual: '2.0%', forecast: '2.2%', previous: '2.3%', eventTime: '2026-01-29T21:30:00.000Z' },
  { currency: 'CHF', title: 'CPI m/m', impact: 'high', actual: '-0.1%', forecast: '0.0%', previous: '0.0%', eventTime: '2026-02-13T05:30:00.000Z' },
  { currency: 'CAD', title: 'CPI m/m', impact: 'high', actual: '0.0%', forecast: '0.1%', previous: '-0.2%', eventTime: '2026-02-17T11:30:00.000Z' },
  { currency: 'GBP', title: 'CPI y/y', impact: 'high', actual: '3.0%', forecast: '3.0%', previous: '3.4%', eventTime: '2026-02-18T05:00:00.000Z' },
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '3.8%', forecast: '3.7%', previous: '3.8%', eventTime: '2026-02-24T22:30:00.000Z' },
  { currency: 'JPY', title: 'Tokyo Core CPI y/y', impact: 'medium', actual: '1.8%', forecast: '1.7%', previous: '2.0%', eventTime: '2026-02-26T21:30:00.000Z' },
  { currency: 'CHF', title: 'CPI m/m', impact: 'medium', actual: '0.6%', forecast: '0.5%', previous: '-0.1%', eventTime: '2026-03-04T05:30:00.000Z' },
  { currency: 'CAD', title: 'CPI m/m', impact: 'high', actual: '0.5%', forecast: '0.7%', previous: '0.0%', eventTime: '2026-03-16T11:30:00.000Z' },
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '3.7%', forecast: '3.8%', previous: '3.8%', eventTime: '2026-03-24T23:30:00.000Z' },
  { currency: 'GBP', title: 'CPI y/y', impact: 'high', actual: '3.0%', forecast: '3.0%', previous: '3.0%', eventTime: '2026-03-25T06:00:00.000Z' },
  { currency: 'JPY', title: 'Tokyo Core CPI y/y', impact: 'medium', actual: '1.7%', forecast: '1.8%', previous: '1.8%', eventTime: '2026-03-30T22:30:00.000Z' },
  { currency: 'CHF', title: 'CPI m/m', impact: 'medium', actual: '0.2%', forecast: '0.5%', previous: '0.6%', eventTime: '2026-04-02T05:30:00.000Z' },
  { currency: 'CAD', title: 'CPI m/m', impact: 'high', actual: '0.9%', forecast: '1.1%', previous: '0.5%', eventTime: '2026-04-20T11:30:00.000Z' },
  { currency: 'NZD', title: 'CPI q/q', impact: 'high', actual: '0.9%', forecast: '0.8%', previous: '0.6%', eventTime: '2026-04-20T21:45:00.000Z' },
  { currency: 'GBP', title: 'CPI y/y', impact: 'high', actual: '3.3%', forecast: '3.3%', previous: '3.0%', eventTime: '2026-04-22T05:00:00.000Z' },
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '4.6%', forecast: '4.8%', previous: '3.7%', eventTime: '2026-04-29T00:30:00.000Z' },
  { currency: 'JPY', title: 'Tokyo Core CPI y/y', impact: 'medium', actual: '1.5%', forecast: '1.8%', previous: '1.7%', eventTime: '2026-04-30T22:30:00.000Z' },
  { currency: 'CHF', title: 'CPI m/m', impact: 'medium', actual: '0.3%', forecast: '0.3%', previous: '0.2%', eventTime: '2026-05-05T05:30:00.000Z' },
  { currency: 'CAD', title: 'CPI m/m', impact: 'high', actual: '0.4%', forecast: '0.7%', previous: '0.9%', eventTime: '2026-05-19T11:30:00.000Z' },
  { currency: 'GBP', title: 'CPI y/y', impact: 'high', actual: '2.8%', forecast: '3.0%', previous: '3.3%', eventTime: '2026-05-20T05:00:00.000Z' },
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '4.2%', forecast: '4.4%', previous: '4.6%', eventTime: '2026-05-27T00:30:00.000Z' },
  { currency: 'JPY', title: 'Tokyo Core CPI y/y', impact: 'medium', actual: '1.3%', forecast: '1.5%', previous: '1.5%', eventTime: '2026-05-28T22:30:00.000Z' },
  { currency: 'CHF', title: 'CPI m/m', impact: 'medium', actual: '0.2%', forecast: '0.3%', previous: '0.3%', eventTime: '2026-06-04T05:30:00.000Z' },
  { currency: 'GBP', title: 'CPI y/y', impact: 'high', actual: '2.8%', forecast: '3.0%', previous: '2.8%', eventTime: '2026-06-17T05:00:00.000Z' },
  { currency: 'CAD', title: 'CPI m/m', impact: 'high', actual: '1.0%', forecast: '0.7%', previous: '0.4%', eventTime: '2026-06-22T11:30:00.000Z' },
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '4.0%', forecast: '4.3%', previous: '4.2%', eventTime: '2026-06-24T00:30:00.000Z' },
  { currency: 'JPY', title: 'Tokyo Core CPI y/y', impact: 'medium', actual: '1.6%', forecast: '1.6%', previous: '1.3%', eventTime: '2026-06-25T22:30:00.000Z' },
  { currency: 'CHF', title: 'CPI m/m', impact: 'medium', actual: '0.0%', forecast: '0.1%', previous: '0.2%', eventTime: '2026-07-02T05:30:00.000Z' },
  { currency: 'GBP', title: 'CPI y/y', impact: 'high', actual: '2.6%', forecast: '2.7%', previous: '2.8%', eventTime: '2026-07-22T05:00:00.000Z' },
  { currency: 'AUD', title: 'CPI y/y', impact: 'high', actual: '3.8%', forecast: '4.0%', previous: '4.0%', eventTime: '2026-07-29T00:30:00.000Z' },
  { currency: 'CAD', title: 'CPI m/m', impact: 'high', actual: '0.5%', forecast: '0.4%', previous: '-0.4%', eventTime: '2026-08-17T11:30:00.000Z' },
  { currency: 'JPY', title: 'Tokyo Core CPI y/y', impact: 'medium', actual: '1.8%', forecast: '1.8%', previous: '1.7%', eventTime: '2026-08-27T22:30:00.000Z' },
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
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
