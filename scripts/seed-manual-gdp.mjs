// One-off seed: GDP history from January 2026 through August, for
// every currency ForexFactory tracks it for (AUD, CAD, CHF, EUR, GBP, JPY, NZD, USD). This
// IndicatorType previously had no automated source at all for any currency (World Bank annual only, context_only tier). See seed-manual-employment.mjs's
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
  { currency: 'AUD', title: 'GDP q/q', impact: 'high', actual: '0.8%', forecast: '0.7%', previous: '0.5%', eventTime: '2026-03-03T22:30:00.000Z' },
  { currency: 'AUD', title: 'GDP q/q', impact: 'high', actual: '0.3%', forecast: '0.5%', previous: '0.9%', eventTime: '2026-06-03T00:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '0.0%', forecast: '0.1%', previous: '-0.3%', eventTime: '2026-01-30T11:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '0.2%', forecast: '0.1%', previous: '0.0%', eventTime: '2026-02-27T11:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '0.1%', forecast: '0.0%', previous: '0.2%', eventTime: '2026-03-31T11:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '0.2%', forecast: '0.2%', previous: '0.1%', eventTime: '2026-04-30T11:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '-0.1%', forecast: '0.1%', previous: '0.2%', eventTime: '2026-05-29T11:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '0.5%', forecast: '0.4%', previous: '-0.1%', eventTime: '2026-06-30T11:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '0.3%', forecast: '0.2%', previous: '0.6%', eventTime: '2026-07-31T11:30:00.000Z' },
  { currency: 'CAD', title: 'GDP m/m', impact: 'high', actual: '0.3%', forecast: '0.2%', previous: '0.3%', eventTime: '2026-08-28T11:30:00.000Z' },
  { currency: 'CHF', title: 'GDP q/q', impact: 'low', actual: '0.1%', forecast: '0.2%', previous: '-0.4%', eventTime: '2026-02-27T06:00:00.000Z' },
  { currency: 'CHF', title: 'GDP q/q', impact: 'low', actual: '0.7%', forecast: '0.6%', previous: '0.2%', eventTime: '2026-06-01T06:00:00.000Z' },
  { currency: 'EUR', title: 'Flash GDP q/q', impact: 'low', actual: '0.3%', forecast: '0.3%', previous: '0.3%', eventTime: '2026-02-13T08:00:00.000Z' },
  { currency: 'EUR', title: 'Flash GDP q/q', impact: 'low', actual: '0.1%', forecast: '0.1%', previous: '0.1%', eventTime: '2026-05-13T08:00:00.000Z' },
  { currency: 'EUR', title: 'Flash GDP q/q', impact: 'low', actual: '0.4%', forecast: '0.4%', previous: '0.4%', eventTime: '2026-08-14T08:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '0.3%', forecast: '0.1%', previous: '-0.1%', eventTime: '2026-01-15T05:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '0.1%', forecast: '0.1%', previous: '0.2%', eventTime: '2026-02-12T05:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '0.0%', forecast: '0.2%', previous: '0.1%', eventTime: '2026-03-13T06:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '0.5%', forecast: '0.1%', previous: '0.1%', eventTime: '2026-04-16T05:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '0.3%', forecast: '-0.1%', previous: '0.4%', eventTime: '2026-05-14T05:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '-0.1%', forecast: '-0.1%', previous: '0.3%', eventTime: '2026-06-12T05:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '0.1%', forecast: '0.0%', previous: '-0.1%', eventTime: '2026-07-16T05:00:00.000Z' },
  { currency: 'GBP', title: 'GDP m/m', impact: 'high', actual: '0.3%', forecast: '0.0%', previous: '0.0%', eventTime: '2026-08-13T05:00:00.000Z' },
  { currency: 'JPY', title: 'Prelim GDP q/q', impact: 'low', actual: '0.1%', forecast: '0.4%', previous: '-0.6%', eventTime: '2026-02-15T21:50:00.000Z' },
  { currency: 'JPY', title: 'Prelim GDP q/q', impact: 'low', actual: '0.5%', forecast: '0.4%', previous: '0.3%', eventTime: '2026-05-18T22:50:00.000Z' },
  { currency: 'JPY', title: 'Prelim GDP q/q', impact: 'low', actual: '0.3%', forecast: '0.5%', previous: '0.5%', eventTime: '2026-08-16T22:50:00.000Z' },
  { currency: 'NZD', title: 'GDP q/q', impact: 'high', actual: '0.2%', forecast: '0.5%', previous: '0.9%', eventTime: '2026-03-18T20:45:00.000Z' },
  { currency: 'NZD', title: 'GDP q/q', impact: 'high', actual: '0.8%', forecast: '0.8%', previous: '0.5%', eventTime: '2026-06-17T21:45:00.000Z' },
  { currency: 'USD', title: 'Advance GDP q/q', impact: 'high', actual: '1.4%', forecast: '2.8%', previous: '4.4%', eventTime: '2026-02-20T11:30:00.000Z' },
  { currency: 'USD', title: 'Advance GDP q/q', impact: 'high', actual: '2.0%', forecast: '2.2%', previous: '0.5%', eventTime: '2026-04-30T11:30:00.000Z' },
  { currency: 'USD', title: 'Advance GDP q/q', impact: 'high', actual: '1.5%', forecast: '2.1%', previous: '2.1%', eventTime: '2026-07-30T11:30:00.000Z' },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  const externalId = `manual:${randomUUID()}`;
  await client.query(
    `INSERT INTO economic_events
       (id, external_id, currency, title, category, impact, actual, forecast, previous, event_time, released_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'GDP'::"IndicatorType", $5, $6, $7, $8, $9, now(), now(), now())`,
    [id, externalId, row.currency, row.title, row.impact, row.actual, row.forecast || null, row.previous || null, row.eventTime],
  );
}
console.log(`done — ${ROWS.length} rows inserted`);

await client.end();
