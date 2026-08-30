import { readFileSync, existsSync } from "node:fs";
import pg from "pg";
function parseEnv(p){const o={};for(const l of readFileSync(p,"utf8").split("\n")){const t=l.trim();if(!t||t.startsWith("#"))continue;const e=t.indexOf("=");if(e===-1)continue;let v=t.slice(e+1).trim();if((v.startsWith('"')&&v.endsWith('"')||(v.startsWith("'")&&v.endsWith("'"))))v=v.slice(1,-1);o[t.slice(0,e).trim()]=v}return o}
const env = parseEnv(existsSync(".env.local") ? ".env.local" : ".env");
const c = new pg.Client({ connectionString: env.DATABASE_URL });
await c.connect();
const r = await c.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public."DataSource"'::regtype ORDER BY enumsortorder`);
console.log("live DataSource enum values:", r.rows.map(x => x.enumlabel));
await c.end();
