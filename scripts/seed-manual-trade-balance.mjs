// One-off seed: Trade Balance history from January 2026 through August, for
// every currency ForexFactory tracks it for (AUD, CAD, EUR, GBP, JPY, NZD, USD). This
// IndicatorType previously had only World Bank annual (context_only tier) for any currency. See seed-manual-employment.mjs's
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
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '2.94B', forecast: '5.14B', previous: '4.35B', eventTime: '2026-01-07T22:30:00.000Z' },
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '3.37B', forecast: '3.42B', previous: '2.60B', eventTime: '2026-02-04T22:30:00.000Z' },
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '2.63B', forecast: '3.78B', previous: '3.37B', eventTime: '2026-03-04T22:30:00.000Z' },
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '5.69B', forecast: '2.81B', previous: '2.26B', eventTime: '2026-04-01T23:30:00.000Z' },
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '-1.84B', forecast: '4.38B', previous: '5.03B', eventTime: '2026-05-07T00:30:00.000Z' },
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '1.79B', forecast: '1.23B', previous: '-1.02B', eventTime: '2026-06-04T00:30:00.000Z' },
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '-3.02B', forecast: '2.19B', previous: '1.38B', eventTime: '2026-07-02T00:30:00.000Z' },
  { currency: 'AUD', title: 'Goods Trade Balance', impact: 'low', actual: '1.93B', forecast: '-1.06B', previous: '-2.37B', eventTime: '2026-08-06T00:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '-0.6B', forecast: '-1.4B', previous: '0.2B', eventTime: '2026-01-08T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '-2.2B', forecast: '-0.7B', previous: '-0.4B', eventTime: '2026-01-29T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '-1.3B', forecast: '-2.1B', previous: '-2.6B', eventTime: '2026-02-19T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '-3.6B', forecast: '-1.1B', previous: '-1.3B', eventTime: '2026-03-12T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '-5.7B', forecast: '-2.5B', previous: '-4.2B', eventTime: '2026-04-02T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '1.8B', forecast: '-2.4B', previous: '-5.1B', eventTime: '2026-05-05T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '2.7B', forecast: '2.5B', previous: '1.8B', eventTime: '2026-06-09T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '4.2B', forecast: '2.8B', previous: '3.4B', eventTime: '2026-07-07T11:30:00.000Z' },
  { currency: 'CAD', title: 'Trade Balance', impact: 'low', actual: '3.9B', forecast: '3.0B', previous: '3.7B', eventTime: '2026-08-04T11:30:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '10.7B', forecast: '14.8B', previous: '13.7B', eventTime: '2026-01-15T08:00:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '11.6B', forecast: '11.8B', previous: '10.2B', eventTime: '2026-02-13T08:00:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '12.1B', forecast: '12.8B', previous: '10.3B', eventTime: '2026-03-20T09:00:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '7.0B', forecast: '11.7B', previous: '12.8B', eventTime: '2026-04-17T08:00:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '3.5B', forecast: '5.4B', previous: '6.5B', eventTime: '2026-05-19T08:00:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '1.3B', forecast: '7.8B', previous: '0.6B', eventTime: '2026-06-15T08:00:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '-5.0B', forecast: '2.8B', previous: '0.8B', eventTime: '2026-07-16T08:00:00.000Z' },
  { currency: 'EUR', title: 'Trade Balance', impact: 'low', actual: '1.8B', forecast: '-2.2B', previous: '-6.1B', eventTime: '2026-08-14T08:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-23.7B', forecast: '-20.3B', previous: '-24.2B', eventTime: '2026-01-15T05:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-22.7B', forecast: '-22.3B', previous: '-23.6B', eventTime: '2026-02-12T05:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-14.4B', forecast: '-22.2B', previous: '-22.7B', eventTime: '2026-03-13T06:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-18.8B', forecast: '-19.4B', previous: '-15.1B', eventTime: '2026-04-16T05:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-27.2B', forecast: '-19.8B', previous: '-22.8B', eventTime: '2026-05-14T05:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-26.0B', forecast: '-22.5B', previous: '-27.2B', eventTime: '2026-06-12T05:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-18.7B', forecast: '-23.1B', previous: '-24.6B', eventTime: '2026-07-16T05:00:00.000Z' },
  { currency: 'GBP', title: 'Goods Trade Balance', impact: 'low', actual: '-23.0B', forecast: '-20.6B', previous: '-21.1B', eventTime: '2026-08-13T05:00:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '-0.21T', forecast: '-0.06T', previous: '0.01T', eventTime: '2026-01-21T21:50:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '0.46T', forecast: '-0.18T', previous: '-0.06T', eventTime: '2026-02-17T21:50:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '-0.37T', forecast: '-0.62T', previous: '0.50T', eventTime: '2026-03-17T22:50:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '0.09T', forecast: '0.23T', previous: '-0.37T', eventTime: '2026-04-21T22:50:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '0.24T', forecast: '-0.23T', previous: '0.09T', eventTime: '2026-05-20T22:50:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '-0.09T', forecast: '-0.21T', previous: '0.20T', eventTime: '2026-06-16T22:50:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '-0.88T', forecast: '-0.56T', previous: '-0.22T', eventTime: '2026-07-21T22:50:00.000Z' },
  { currency: 'JPY', title: 'Trade Balance', impact: 'low', actual: '-0.69T', forecast: '-0.44T', previous: '-0.93T', eventTime: '2026-08-19T22:50:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '52M', forecast: '30M', previous: '-335M', eventTime: '2026-01-28T19:45:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '-519M', forecast: '-745M', previous: '-88M', eventTime: '2026-02-19T19:45:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '-257M', forecast: '-740M', previous: '-627M', eventTime: '2026-03-19T20:45:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '698M', forecast: '175M', previous: '-365M', eventTime: '2026-04-19T21:45:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '1920M', forecast: '980M', previous: '430M', eventTime: '2026-05-20T21:45:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '800M', forecast: '875M', previous: '1598M', eventTime: '2026-06-18T21:45:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '23M', forecast: '250M', previous: '577M', eventTime: '2026-07-19T21:45:00.000Z' },
  { currency: 'NZD', title: 'Trade Balance', impact: 'low', actual: '-1949M', forecast: '-175M', previous: '-237M', eventTime: '2026-08-20T21:45:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-29.4B', forecast: '-58.1B', previous: '-48.1B', eventTime: '2026-01-08T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-56.8B', forecast: '-43.4B', previous: '-29.2B', eventTime: '2026-01-29T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-70.3B', forecast: '-55.5B', previous: '-53.0B', eventTime: '2026-02-19T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-54.5B', forecast: '-66.6B', previous: '-72.9B', eventTime: '2026-03-12T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-57.3B', forecast: '-60.5B', previous: '-54.7B', eventTime: '2026-04-02T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-60.3B', forecast: '-61.0B', previous: '-57.8B', eventTime: '2026-05-05T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-55.9B', forecast: '-56.2B', previous: '-56.6B', eventTime: '2026-06-09T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-77.6B', forecast: '-78.3B', previous: '-54.6B', eventTime: '2026-07-07T11:30:00.000Z' },
  { currency: 'USD', title: 'Trade Balance', impact: 'low', actual: '-73.3B', forecast: '-73.0B', previous: '-77.6B', eventTime: '2026-08-04T11:30:00.000Z' },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'TRADE_BALANCE'::"IndicatorType", $5, $6, $7, $8, $9, now(), now(), now())`,
    [id, externalId, row.currency, row.title, row.impact, row.actual, row.forecast || null, row.previous || null, row.eventTime],
  );
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
