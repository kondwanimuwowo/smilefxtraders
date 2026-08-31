// One-off seed: Retail Sales history from January 2026 through August, for
// every currency ForexFactory tracks it for (CAD, CHF, EUR, GBP, JPY, NZD, USD). This
// IndicatorType previously had FRED coverage for USD only; the rest had nothing. See seed-manual-employment.mjs's
// header for why full-year history matters, not just the latest reading.
//
// Scraped from ForexFactory (Jan-Aug 2026 month views) and cross-verified
// against the raw rendered markdown, generated programmatically from that
// source rather than transcribed by hand. Canonical title per currency
// picked to avoid EUR/GBP-style sub-national breakdowns (French/German/
// Italian releases) in favor of the currency-wide headline. A currency
// missing from the list below genuinely has no ForexFactory-tracked release
// for this indicator in the window scraped -- not an extraction gap.
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
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'medium', actual: '1.3%', forecast: '1.2%', previous: '-0.3%', eventTime: '2026-01-23T11:30:00.000Z' },
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'medium', actual: '-0.4%', forecast: '-0.5%', previous: '1.2%', eventTime: '2026-02-20T11:30:00.000Z' },
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'medium', actual: '1.1%', forecast: '1.4%', previous: '-0.4%', eventTime: '2026-03-20T11:30:00.000Z' },
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'medium', actual: '0.7%', forecast: '0.9%', previous: '1.2%', eventTime: '2026-04-24T11:30:00.000Z' },
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'medium', actual: '0.9%', forecast: '0.6%', previous: '0.7%', eventTime: '2026-05-22T11:30:00.000Z' },
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'low', actual: '0.5%', forecast: '0.6%', previous: '0.9%', eventTime: '2026-06-19T11:30:00.000Z' },
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'low', actual: '1.0%', forecast: '1.0%', previous: '0.4%', eventTime: '2026-07-23T11:30:00.000Z' },
  { currency: 'CAD', title: 'Retail Sales m/m', impact: 'low', actual: '0.6%', forecast: '0.4%', previous: '1.1%', eventTime: '2026-08-21T11:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '2.3%', forecast: '2.5%', previous: '2.2%', eventTime: '2026-01-05T05:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '2.9%', forecast: '2.5%', previous: '1.7%', eventTime: '2026-02-02T05:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '-1.1%', forecast: '2.7%', previous: '2.8%', eventTime: '2026-03-02T05:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '0.9%', forecast: '1.5%', previous: '-0.6%', eventTime: '2026-04-01T05:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '0.5%', forecast: '0.6%', previous: '0.4%', eventTime: '2026-05-01T05:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '1.6%', forecast: '0.2%', previous: '1.3%', eventTime: '2026-06-01T05:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '3.5%', forecast: '1.8%', previous: '1.7%', eventTime: '2026-07-01T05:30:00.000Z' },
  { currency: 'CHF', title: 'Retail Sales y/y', impact: 'low', actual: '1.5%', forecast: '3.1%', previous: '3.4%', eventTime: '2026-07-31T05:30:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '0.2%', forecast: '0.1%', previous: '0.0%', eventTime: '2026-01-09T08:00:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '-0.5%', forecast: '-0.2%', previous: '0.1%', eventTime: '2026-02-05T08:00:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '-0.1%', forecast: '0.3%', previous: '0.1%', eventTime: '2026-03-05T08:00:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '-0.2%', forecast: '-0.2%', previous: '0.0%', eventTime: '2026-04-08T08:00:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '-0.1%', forecast: '-0.3%', previous: '-0.3%', eventTime: '2026-05-07T08:00:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '-0.4%', forecast: '-0.3%', previous: '0.8%', eventTime: '2026-06-04T08:00:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '0.2%', forecast: '0.2%', previous: '-0.3%', eventTime: '2026-07-06T08:00:00.000Z' },
  { currency: 'EUR', title: 'Retail Sales m/m', impact: 'low', actual: '-0.3%', forecast: '0.1%', previous: '0.4%', eventTime: '2026-08-06T08:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'high', actual: '0.4%', forecast: '0.0%', previous: '-0.1%', eventTime: '2026-01-23T05:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'high', actual: '1.8%', forecast: '0.2%', previous: '0.4%', eventTime: '2026-02-20T05:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'high', actual: '-0.4%', forecast: '-0.6%', previous: '2.0%', eventTime: '2026-03-27T06:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'high', actual: '0.7%', forecast: '0.0%', previous: '-0.6%', eventTime: '2026-04-24T05:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'medium', actual: '-1.3%', forecast: '-0.6%', previous: '0.6%', eventTime: '2026-05-22T05:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'medium', actual: '1.2%', forecast: '0.5%', previous: '-1.0%', eventTime: '2026-06-19T05:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'medium', actual: '1.0%', forecast: '-0.3%', previous: '1.2%', eventTime: '2026-07-24T05:00:00.000Z' },
  { currency: 'GBP', title: 'Retail Sales m/m', impact: 'medium', actual: '-0.5%', forecast: '-0.5%', previous: '0.7%', eventTime: '2026-08-21T05:00:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '-0.9%', forecast: '0.7%', previous: '1.1%', eventTime: '2026-01-29T21:50:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '1.8%', forecast: '0.1%', previous: '-0.9%', eventTime: '2026-02-26T21:50:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '-0.2%', forecast: '0.9%', previous: '1.8%', eventTime: '2026-03-30T22:50:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '1.7%', forecast: '0.9%', previous: '-0.1%', eventTime: '2026-04-29T22:50:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '2.1%', forecast: '1.4%', previous: '1.4%', eventTime: '2026-05-28T22:50:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '5.3%', forecast: '3.1%', previous: '2.8%', eventTime: '2026-06-28T22:50:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '0.5%', forecast: '3.1%', previous: '5.0%', eventTime: '2026-07-30T22:50:00.000Z' },
  { currency: 'JPY', title: 'Retail Sales y/y', impact: 'low', actual: '4.0%', forecast: '3.2%', previous: '0.6%', eventTime: '2026-08-30T22:50:00.000Z' },
  { currency: 'NZD', title: 'Retail Sales q/q', impact: 'medium', actual: '0.9%', forecast: '0.6%', previous: '1.9%', eventTime: '2026-02-22T19:45:00.000Z' },
  { currency: 'NZD', title: 'Retail Sales q/q', impact: 'low', actual: '0.9%', forecast: '0.5%', previous: '0.9%', eventTime: '2026-05-21T21:45:00.000Z' },
  { currency: 'NZD', title: 'Retail Sales q/q', impact: 'low', actual: '-0.5%', forecast: '0.1%', previous: '1.0%', eventTime: '2026-08-23T21:45:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'high', actual: '0.6%', forecast: '0.5%', previous: '-0.1%', eventTime: '2026-01-14T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'high', actual: '0.0%', forecast: '0.4%', previous: '0.6%', eventTime: '2026-02-10T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'high', actual: '-0.2%', forecast: '-0.3%', previous: '0.0%', eventTime: '2026-03-06T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'high', actual: '0.6%', forecast: '0.5%', previous: '-0.1%', eventTime: '2026-04-01T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'high', actual: '1.7%', forecast: '1.4%', previous: '0.7%', eventTime: '2026-04-21T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'high', actual: '0.5%', forecast: '0.5%', previous: '1.6%', eventTime: '2026-05-14T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'medium', actual: '0.9%', forecast: '0.5%', previous: '0.4%', eventTime: '2026-06-17T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'medium', actual: '0.2%', forecast: '0.2%', previous: '1.0%', eventTime: '2026-07-16T11:30:00.000Z' },
  { currency: 'USD', title: 'Retail Sales m/m', impact: 'medium', actual: '-0.6%', forecast: '0.1%', previous: '0.2%', eventTime: '2026-08-14T11:30:00.000Z' },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'RETAIL_SALES'::"IndicatorType", $5, $6, $7, $8, $9, now(), now(), now())`,
    [id, externalId, row.currency, row.title, row.impact, row.actual, row.forecast || null, row.previous || null, row.eventTime],
  );
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
