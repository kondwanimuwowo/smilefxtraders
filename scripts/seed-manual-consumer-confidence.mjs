// One-off seed: Consumer Confidence history from January 2026 through August, for
// every currency ForexFactory tracks it for (AUD, EUR, GBP, JPY, NZD, USD). This
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
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '-1.7%', forecast: '', previous: '-9.0%', eventTime: '2026-01-12T20:50:00.000Z' },
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '-2.6%', forecast: '', previous: '-1.7%', eventTime: '2026-02-09T21:30:00.000Z' },
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '1.2%', forecast: '', previous: '-2.6%', eventTime: '2026-03-09T22:30:00.000Z' },
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '-12.5%', forecast: '', previous: '1.2%', eventTime: '2026-04-13T23:30:00.000Z' },
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '3.5%', forecast: '', previous: '-12.5%', eventTime: '2026-05-18T23:30:00.000Z' },
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '-2.9%', forecast: '', previous: '3.5%', eventTime: '2026-06-08T23:30:00.000Z' },
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '4.1%', forecast: '', previous: '-2.9%', eventTime: '2026-07-13T23:30:00.000Z' },
  { currency: 'AUD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '6.0%', forecast: '', previous: '4.1%', eventTime: '2026-08-17T23:30:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-12', forecast: '-13', previous: '-15', eventTime: '2026-01-22T13:00:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-12', forecast: '-12', previous: '-12', eventTime: '2026-02-19T13:10:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-16', forecast: '-15', previous: '-12', eventTime: '2026-03-23T14:00:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-21', forecast: '-18', previous: '-16', eventTime: '2026-04-22T13:00:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-19', forecast: '-21', previous: '-21', eventTime: '2026-05-21T13:02:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-18', forecast: '-18', previous: '-19', eventTime: '2026-06-22T13:04:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-16', forecast: '-17', previous: '-18', eventTime: '2026-07-23T13:00:00.000Z' },
  { currency: 'EUR', title: 'Consumer Confidence', impact: 'low', actual: '-16', forecast: '-16', previous: '-16', eventTime: '2026-08-21T13:00:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-16', forecast: '-17', previous: '-17', eventTime: '2026-01-22T22:01:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-19', forecast: '-15', previous: '-16', eventTime: '2026-02-26T22:01:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-21', forecast: '-24', previous: '-19', eventTime: '2026-03-26T23:01:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-25', forecast: '-24', previous: '-21', eventTime: '2026-04-23T12:21:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-23', forecast: '-28', previous: '-25', eventTime: '2026-05-21T22:01:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-23', forecast: '-23', previous: '-23', eventTime: '2026-06-18T22:01:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-17', forecast: '-22', previous: '-23', eventTime: '2026-07-23T22:01:00.000Z' },
  { currency: 'GBP', title: 'GfK Consumer Confidence', impact: 'low', actual: '-14', forecast: '-18', previous: '-17', eventTime: '2026-08-20T22:01:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '37.2', forecast: '37.8', previous: '37.5', eventTime: '2026-01-08T03:00:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '37.9', forecast: '37.1', previous: '37.2', eventTime: '2026-01-29T03:00:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '40.0', forecast: '38.2', previous: '37.9', eventTime: '2026-03-04T03:00:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '33.3', forecast: '38.3', previous: '40.0', eventTime: '2026-04-09T04:00:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '32.2', forecast: '32.8', previous: '33.3', eventTime: '2026-04-30T04:00:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '33.6', forecast: '32.3', previous: '32.2', eventTime: '2026-05-29T04:00:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '33.8', forecast: '34.1', previous: '33.6', eventTime: '2026-07-01T04:00:00.000Z' },
  { currency: 'JPY', title: 'Consumer Confidence', impact: 'low', actual: '34.9', forecast: '34.2', previous: '33.8', eventTime: '2026-07-30T04:00:00.000Z' },
  { currency: 'NZD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '94.7', forecast: '', previous: '96.5', eventTime: '2026-03-17T18:05:00.000Z' },
  { currency: 'NZD', title: 'Westpac Consumer Sentiment', impact: 'low', actual: '80.4', forecast: '', previous: '94.7', eventTime: '2026-06-16T20:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '84.5', forecast: '90.6', previous: '94.2', eventTime: '2026-01-27T13:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '91.2', forecast: '87.4', previous: '89.0', eventTime: '2026-02-24T13:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '91.8', forecast: '87.8', previous: '91.0', eventTime: '2026-03-31T13:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '92.8', forecast: '89.0', previous: '92.2', eventTime: '2026-04-28T13:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '93.1', forecast: '91.9', previous: '93.8', eventTime: '2026-05-26T13:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '91.2', forecast: '94.4', previous: '90.6', eventTime: '2026-06-30T13:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '90.8', forecast: '92.4', previous: '92.2', eventTime: '2026-07-28T13:00:00.000Z' },
  { currency: 'USD', title: 'CB Consumer Confidence', impact: 'medium', actual: '89.4', forecast: '90.3', previous: '90.2', eventTime: '2026-08-25T13:00:00.000Z' },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'CONSUMER_CONFIDENCE'::"IndicatorType", $5, $6, $7, $8, $9, now(), now(), now())`,
    [id, externalId, row.currency, row.title, row.impact, row.actual, row.forecast || null, row.previous || null, row.eventTime],
  );
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
