/**
 * seed-cot.ts
 *
 * Seeds the cot_reports table with the full available CFTC history for all
 * instruments (up to ~40 years depending on the contract). Runs once at deploy
 * time, then the weekly sync route keeps it current.
 *
 * Usage:
 *   npx tsx prisma/seed-cot.ts
 *
 * IMPORTANT: Uses DIRECT_URL (session-mode / port 5432) instead of DATABASE_URL
 * (transaction-mode pooler / port 6543). The transaction-mode pooler drops idle
 * connections after ~60s, which kills long-running bulk insert scripts. The
 * direct/session-mode URL keeps the connection alive for the full run.
 *
 * The script pages through the entire CFTC Legacy Futures-Only dataset
 * (publicreporting.cftc.gov/resource/6dca-aqww.json) in batches of 1000 rows
 * per instrument and bulk-inserts everything into Supabase via Prisma.
 */

import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Use DIRECT_URL (session-mode, port 5432) for long-running bulk scripts.
// The transaction pooler (port 6543) drops idle connections after ~60s.
const connString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: connString });
const prisma  = new PrismaClient({ adapter });

// ── Instruments ───────────────────────────────────────────────────────────────
// usdBase: true = foreign currency futures (JPY, CHF, CAD). Positioning is for
// the foreign currency, so large specs LONG = bearish on the USD pair (e.g.
// long JPY = bearish USDJPY). Nets are stored PAIR-FRAMED: inverted at write
// time for USD-base pairs so positive net = bullish on the displayed pair.
// Long/short columns stay raw (contract framing). Consumers never re-invert.
// Must match instruments.cotInverted in prisma/seed.ts and the sync routes.

const INSTRUMENTS = [
  { pair: "EURUSD", label: "Euro FX",          code: "099741", usdBase: false },
  { pair: "GBPUSD", label: "British Pound",     code: "096742", usdBase: false },
  { pair: "AUDUSD", label: "Australian Dollar", code: "232741", usdBase: false },
  { pair: "NZDUSD", label: "NZ Dollar",         code: "112741", usdBase: false },
  { pair: "USDJPY", label: "Japanese Yen",      code: "097741", usdBase: true  },
  { pair: "USDCHF", label: "Swiss Franc",       code: "092741", usdBase: true  },
  { pair: "USDCAD", label: "Canadian Dollar",   code: "090741", usdBase: true  },
  { pair: "XAUUSD", label: "Gold",              code: "088691", usdBase: false },
  { pair: "NAS100", label: "NASDAQ E-mini",     code: "209742", usdBase: false },
  { pair: "DXY",    label: "USD Index",         code: "098662", usdBase: false },
  { pair: "XAGUSD", label: "Silver",            code: "084691", usdBase: false },
  { pair: "WTIUSD", label: "WTI Crude Oil",     code: "067651", usdBase: false },
  { pair: "US500",  label: "S&P 500 E-mini",    code: "13874A", usdBase: false },
  { pair: "US30",   label: "Dow Jones E-mini",  code: "124603", usdBase: false },
] as const;

const CFTC_BASE  = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";
const BATCH_SIZE = 1000; // Socrata max per page

interface SocrataRow {
  report_date_as_yyyy_mm_dd:   string;
  noncomm_positions_long_all:  string;
  noncomm_positions_short_all: string;
  comm_positions_long_all:     string;
  comm_positions_short_all:    string;
  nonrept_positions_long_all:  string;
  nonrept_positions_short_all: string;
  open_interest_all:           string;
}

// ── Fetch all rows for one instrument (paginated) ─────────────────────────────

async function fetchAllRows(code: string): Promise<SocrataRow[]> {
  const rows: SocrataRow[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(CFTC_BASE);
    url.searchParams.set("$where",  `cftc_contract_market_code='${code}'`);
    url.searchParams.set("$order",  "report_date_as_yyyy_mm_dd ASC");
    url.searchParams.set("$limit",  String(BATCH_SIZE));
    url.searchParams.set("$offset", String(offset));
    url.searchParams.set(
      "$select",
      "report_date_as_yyyy_mm_dd,noncomm_positions_long_all,noncomm_positions_short_all,comm_positions_long_all,comm_positions_short_all,nonrept_positions_long_all,nonrept_positions_short_all,open_interest_all"
    );

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`CFTC API error ${res.status} for code ${code}`);

    const page = (await res.json()) as SocrataRow[];
    rows.push(...page);

    if (page.length < BATCH_SIZE) break; // last page
    offset += BATCH_SIZE;
    await new Promise((r) => setTimeout(r, 300)); // be polite to the API
  }

  return rows;
}

// ── Parse a Socrata row into DB fields ─────────────────────────────────────────

function parseRow(r: SocrataRow, usdBase: boolean) {
  const n = (s: string) => parseInt(s ?? "0") || 0;

  const lsLong  = n(r.noncomm_positions_long_all);
  const lsShort = n(r.noncomm_positions_short_all);
  const cLong   = n(r.comm_positions_long_all);
  const cShort  = n(r.comm_positions_short_all);
  const ssLong  = n(r.nonrept_positions_long_all);
  const ssShort = n(r.nonrept_positions_short_all);

  // For USD-base pairs (USDJPY, USDCHF, USDCAD), invert the net so that
  // "large specs net positive" = bullish on the USD pair, consistent with the
  // directional framing used for all other pairs. Long/short stay raw.
  const sign = usdBase ? -1 : 1;

  // Append Z to force UTC — without it, Node.js parses as local time and dates
  // shift backwards in UTC+2 (Zambia), storing June 2 as June 1.
  const reportDate = new Date(r.report_date_as_yyyy_mm_dd.slice(0, 10) + "T00:00:00.000Z");

  return {
    largeSpecNet:  sign * (lsLong - lsShort),  largeSpecLong: lsLong,  largeSpecShort: lsShort,
    commercialNet: sign * (cLong  - cShort),   commercialLong: cLong,  commercialShort: cShort,
    smallSpecNet:  sign * (ssLong - ssShort),  smallSpecLong: ssLong,  smallSpecShort: ssShort,
    openInterest:  n(r.open_interest_all),
    reportDate,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌐 Fetching full CFTC history for all instruments...\n");

  // Wipe the table first so stale / timezone-corrupt records don't linger
  const deleted = await prisma.cotReport.deleteMany({});
  console.log(`  Cleared ${deleted.count} existing rows\n`);

  let totalUpserted = 0;

  for (const inst of INSTRUMENTS) {
    process.stdout.write(`  ${inst.pair} (${inst.label}) … `);
    const rows = await fetchAllRows(inst.code);
    process.stdout.write(`${rows.length} weeks fetched → upserting … `);

    const data = rows
      .map((r) => {
        try {
          return { pair: inst.pair, ...parseRow(r, inst.usdBase) };
        } catch {
          return null;
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    // Insert in chunks of 500 using createMany + skipDuplicates.
    // This is 10-50x faster than individual upserts and avoids saturating
    // the connection under large datasets. Any row that already exists
    // (same pair + reportDate) is silently skipped.
    const CHUNK = 500;
    let retries = 0;
    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK);
      let attempt = 0;
      while (attempt < 3) {
        try {
          await prisma.cotReport.createMany({
            data: chunk,
            skipDuplicates: true,
          });
          break; // success
        } catch (err: unknown) {
          attempt++;
          const msg = err instanceof Error ? err.message : String(err);
          if (attempt >= 3) throw new Error(`Chunk ${i}–${i + CHUNK} failed after 3 attempts: ${msg}`);
          console.warn(`  ⚠ chunk ${i}–${i + CHUNK} attempt ${attempt} failed (${msg}), retrying in 2s…`);
          retries++;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    totalUpserted += data.length;
    if (retries > 0) console.log(`done (${data.length} rows, ${retries} retried chunks)`);
    else console.log(`done (${data.length} rows)`);

    // Brief pause between instruments to avoid overwhelming the pooler
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n✅ Seeding complete — ${totalUpserted} rows upserted across ${INSTRUMENTS.length} instruments.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
