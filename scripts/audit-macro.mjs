import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

function parseEnvFile(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, eq).trim()] = v;
  }
  return out;
}
const env = parseEnvFile(existsSync(".env.local") ? ".env.local" : ".env");
const c = new pg.Client({ connectionString: env.DATABASE_URL });
await c.connect();

const q = async (label, sql) => {
  try { const r = await c.query(sql); console.log(`\n--- ${label}`); console.table(r.rows); }
  catch (e) { console.log(`\n--- ${label}\n    ERROR: ${e.message}`); }
};

await q("economic_events: rows per currency/category",
  `select currency, category::text, count(*) as n, max(event_time) as latest
   from economic_events group by 1,2 order by 1,2`);

await q("economic_events: CPI titles seen (headline vs core?)",
  `select currency, title, count(*) as n from economic_events
   where category::text = 'CPI' group by 1,2 order by 1,3 desc limit 25`);

await q("economic_events: with BOTH actual+forecast (what scoring can use)",
  `select currency, category::text, count(*) as n from economic_events
   where actual is not null and forecast is not null group by 1,2 order by 1,2`);

await q("macro_indicator_snapshots: coverage",
  `select currency, indicator_type::text, count(*) as n, max(period_date) as latest
   from macro_indicator_snapshots group by 1,2 order by 1,2`);

await q("current_currency_scores",
  `select currency, total_score, computed_at from current_currency_scores order by currency`);

await c.end();
