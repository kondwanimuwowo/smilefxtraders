// One-off seed: Manufacturing PMI history from January 2026 through August, for
// every currency ForexFactory tracks it for (AUD, CAD, CHF, EUR, GBP, JPY, USD). This
// IndicatorType previously had no automated source at all for any currency. See seed-manual-employment.mjs's
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
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '52.4', forecast: '', previous: '51.6', eventTime: '2026-01-22T20:00:00.000Z' },
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.5', forecast: '', previous: '52.3', eventTime: '2026-02-19T20:00:00.000Z' },
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '50.1', forecast: '', previous: '51.0', eventTime: '2026-03-23T21:00:00.000Z' },
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.0', forecast: '', previous: '49.8', eventTime: '2026-04-22T22:00:00.000Z' },
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '50.2', forecast: '', previous: '51.3', eventTime: '2026-05-20T22:00:00.000Z' },
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.2', forecast: '', previous: '50.7', eventTime: '2026-06-22T22:00:00.000Z' },
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.7', forecast: '', previous: '51.5', eventTime: '2026-07-23T22:00:00.000Z' },
  { currency: 'AUD', title: 'Flash Manufacturing PMI', impact: 'low', actual: '52.0', forecast: '', previous: '52.0', eventTime: '2026-08-20T22:00:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'low', actual: '48.6', forecast: '', previous: '48.4', eventTime: '2026-01-02T12:30:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'low', actual: '50.4', forecast: '', previous: '48.6', eventTime: '2026-02-02T12:30:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'medium', actual: '51.0', forecast: '', previous: '50.4', eventTime: '2026-03-02T12:30:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'low', actual: '50.0', forecast: '', previous: '51.0', eventTime: '2026-04-01T12:30:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'low', actual: '53.3', forecast: '', previous: '50.0', eventTime: '2026-05-01T12:30:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'low', actual: '52.9', forecast: '', previous: '53.3', eventTime: '2026-06-01T12:30:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'low', actual: '53.0', forecast: '', previous: '52.9', eventTime: '2026-07-02T12:30:00.000Z' },
  { currency: 'CAD', title: 'Manufacturing PMI', impact: 'low', actual: '53.5', forecast: '', previous: '53.0', eventTime: '2026-08-04T12:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '45.8', forecast: '49.7', previous: '49.7', eventTime: '2026-01-05T06:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '48.8', forecast: '47.2', previous: '45.8', eventTime: '2026-02-02T06:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '47.4', forecast: '49.8', previous: '48.8', eventTime: '2026-03-02T06:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '53.3', forecast: '47.2', previous: '47.4', eventTime: '2026-04-01T06:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '54.5', forecast: '52.0', previous: '53.3', eventTime: '2026-05-04T06:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '57.3', forecast: '54.0', previous: '54.5', eventTime: '2026-06-01T06:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '54.3', forecast: '56.4', previous: '57.3', eventTime: '2026-07-01T06:30:00.000Z' },
  { currency: 'CHF', title: 'Manufacturing PMI', impact: 'low', actual: '53.2', forecast: '54.5', previous: '54.3', eventTime: '2026-08-03T06:30:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '49.4', forecast: '49.1', previous: '48.8', eventTime: '2026-01-23T07:00:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '50.8', forecast: '49.9', previous: '49.5', eventTime: '2026-02-20T07:00:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.4', forecast: '49.4', previous: '50.8', eventTime: '2026-03-24T08:00:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '52.2', forecast: '50.9', previous: '51.6', eventTime: '2026-04-23T07:00:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.4', forecast: '51.7', previous: '52.2', eventTime: '2026-05-21T07:00:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.3', forecast: '51.6', previous: '51.6', eventTime: '2026-06-23T07:00:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '52.0', forecast: '51.5', previous: '51.4', eventTime: '2026-07-24T07:00:00.000Z' },
  { currency: 'EUR', title: 'Flash Manufacturing PMI', impact: 'low', actual: '52.8', forecast: '51.8', previous: '51.9', eventTime: '2026-08-21T07:00:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'high', actual: '51.6', forecast: '50.6', previous: '50.6', eventTime: '2026-01-23T07:30:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'high', actual: '52.0', forecast: '51.5', previous: '51.8', eventTime: '2026-02-20T07:30:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'high', actual: '51.4', forecast: '50.0', previous: '51.7', eventTime: '2026-03-24T08:30:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'high', actual: '53.6', forecast: '50.3', previous: '51.0', eventTime: '2026-04-23T07:30:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'medium', actual: '53.7', forecast: '52.9', previous: '53.7', eventTime: '2026-05-21T07:30:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'medium', actual: '53.1', forecast: '53.5', previous: '53.9', eventTime: '2026-06-23T07:30:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'medium', actual: '52.8', forecast: '52.0', previous: '52.5', eventTime: '2026-07-24T07:30:00.000Z' },
  { currency: 'GBP', title: 'Flash Manufacturing PMI', impact: 'medium', actual: '51.5', forecast: '51.6', previous: '51.9', eventTime: '2026-08-21T07:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.5', forecast: '50.1', previous: '50.0', eventTime: '2026-01-22T22:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '52.8', forecast: '51.3', previous: '51.5', eventTime: '2026-02-19T22:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '51.4', forecast: '53.2', previous: '53.0', eventTime: '2026-03-23T23:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '54.9', forecast: '51.1', previous: '51.6', eventTime: '2026-04-22T23:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '54.5', forecast: '54.5', previous: '55.1', eventTime: '2026-05-20T23:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '54.9', forecast: '54.5', previous: '54.5', eventTime: '2026-06-22T23:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '54.7', forecast: '55.0', previous: '54.8', eventTime: '2026-07-23T23:30:00.000Z' },
  { currency: 'JPY', title: 'Flash Manufacturing PMI', impact: 'low', actual: '55.1', forecast: '55.1', previous: '54.5', eventTime: '2026-08-20T23:30:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', actual: '47.9', forecast: '48.3', previous: '48.2', eventTime: '2026-01-05T13:00:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', actual: '52.6', forecast: '48.5', previous: '47.9', eventTime: '2026-02-02T13:00:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', actual: '52.4', forecast: '51.7', previous: '52.6', eventTime: '2026-03-02T13:00:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', actual: '52.7', forecast: '52.3', previous: '52.4', eventTime: '2026-04-01T13:00:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'medium', actual: '52.7', forecast: '53.1', previous: '52.7', eventTime: '2026-05-01T13:00:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', actual: '54.0', forecast: '53.3', previous: '52.7', eventTime: '2026-06-01T13:00:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', actual: '53.3', forecast: '53.8', previous: '54.0', eventTime: '2026-07-01T13:00:00.000Z' },
  { currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', actual: '55.6', forecast: '54.0', previous: '53.3', eventTime: '2026-08-03T13:00:00.000Z' },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'MANUFACTURING_PMI'::"IndicatorType", $5, $6, $7, $8, $9, now(), now(), now())`,
    [id, externalId, row.currency, row.title, row.impact, row.actual, row.forecast || null, row.previous || null, row.eventTime],
  );
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
