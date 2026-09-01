// One-off seed: 10-year government bond yield for the 7 currencies whose
// FRED OECD-mirror series has genuinely stopped publishing (EUR since
// January 2026, the rest since June — confirmed by checking FRED directly,
// not assumed). USD is untouched: its FRED series (DGS10, native, not an
// OECD mirror) is still live and current.
//
// Bond yields don't fit the EconomicEvent/manual-entry surprise path used
// everywhere else this session — a 10-year yield is a continuously-traded
// market rate with no scheduled release or forecast, so there's nothing to
// scrape from a calendar. This goes into MacroIndicatorSnapshot instead (the
// same level-path table FRED writes to), tagged DataSource.MANUAL — the
// first real use of that enum value, which existed in the schema but had
// never actually been written anywhere.
//
// cTrader was checked first (this project's live broker feed) and doesn't
// list bond instruments for this account, so that route is closed.
//
// Source: worldgovernmentbonds.com's live table, "Last Update: 1 Sep 2026
// 8:15 GMT+0" at scrape time. EUR uses Germany's Bund yield, the standard
// reference for euro-area sovereign yield (same convention FRED's own
// IRLTLT01EZM156N series uses).
//
// This is a single current reading per currency, not a backfill — a
// continuously-traded rate has no historical "release" to scrape the way
// CPI/employment/etc. did. Re-run this periodically (manually, or once the
// weekend cron mentioned earlier exists) to keep it from going stale itself;
// classifyLevel's cadence math needs at least two readings over time to
// judge staleness properly, same as every other indicator seeded this
// session.
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

const PERIOD_DATE = "2026-09-01T00:00:00.000Z";

const ROWS = [
  { currency: "CHF", value: 0.454 },
  { currency: "JPY", value: 3.000 },
  { currency: "EUR", value: 3.350 },
  { currency: "CAD", value: 3.739 },
  { currency: "NZD", value: 4.825 },
  { currency: "AUD", value: 5.166 },
  { currency: "GBP", value: 5.229 },
];

const client = new pg.Client({ connectionString: env.DATABASE_URL });
await client.connect();

for (const row of ROWS) {
  const id = randomUUID();
  await client.query(
    `INSERT INTO macro_indicator_snapshots
       (id, currency, indicator_type, value, unit, period_date, source, fetched_at)
     VALUES ($1, $2, 'BOND_YIELD_10Y'::"IndicatorType", $3, 'percent', $4, 'MANUAL'::"DataSource", now())
     ON CONFLICT (currency, indicator_type, period_date)
     DO UPDATE SET value = $3, fetched_at = now()`,
    [id, row.currency, row.value, PERIOD_DATE],
  );
  console.log(`seeded ${row.currency} BOND_YIELD_10Y = ${row.value}`);
}

await client.end();
console.log(`done — ${ROWS.length} rows inserted`);
