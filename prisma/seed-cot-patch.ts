/**
 * seed-cot-patch.ts
 *
 * Targeted COT seed for specific instruments. Use this to backfill instruments
 * that failed in seed-cot.ts without wiping the entire table.
 *
 * Usage:
 *   npx tsx prisma/seed-cot-patch.ts
 */

import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: connString });
const prisma  = new PrismaClient({ adapter });

// ── Only the instruments that need to be patched ──────────────────────────────
const PATCH_INSTRUMENTS = [
  { pair: "NAS100", label: "NASDAQ E-mini", code: "209742", usdBase: false },
  { pair: "DXY",    label: "USD Index",     code: "098662", usdBase: false },
] as const;

const CFTC_BASE  = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";
const BATCH_SIZE = 1000;

interface SocrataRow {
  report_date_as_yyyy_mm_dd:   string;
  noncomm_positions_long_all:  string;
  noncomm_positions_short_all: string;
  comm_positions_long_all:     string;
  comm_positions_short_all:    string;
  nonrept_positions_long_all:  string;
  nonrept_positions_short_all: string;
}

async function fetchAllRows(code: string, pair: string): Promise<SocrataRow[]> {
  const rows: SocrataRow[] = [];
  let offset = 0;
  let page = 0;

  while (true) {
    const url = new URL(CFTC_BASE);
    url.searchParams.set("$where",  `cftc_contract_market_code='${code}'`);
    url.searchParams.set("$order",  "report_date_as_yyyy_mm_dd ASC");
    url.searchParams.set("$limit",  String(BATCH_SIZE));
    url.searchParams.set("$offset", String(offset));
    url.searchParams.set(
      "$select",
      "report_date_as_yyyy_mm_dd,noncomm_positions_long_all,noncomm_positions_short_all,comm_positions_long_all,comm_positions_short_all,nonrept_positions_long_all,nonrept_positions_short_all"
    );

    // Retry each page up to 3 times with 5s delay
    let pageData: SocrataRow[] | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        pageData = (await res.json()) as SocrataRow[];
        break;
      } catch (err) {
        if (attempt >= 3) throw err;
        console.warn(`  ⚠  ${pair} page ${page + 1} attempt ${attempt} failed, retrying in 5s…`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    if (!pageData) break;
    rows.push(...pageData);
    page++;

    if (pageData.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
    await new Promise((r) => setTimeout(r, 500));
  }

  return rows;
}

function parseRow(r: SocrataRow, usdBase: boolean) {
  const n = (s: string) => parseInt(s ?? "0") || 0;
  const sign = usdBase ? -1 : 1;
  const reportDate = new Date(r.report_date_as_yyyy_mm_dd.slice(0, 10) + "T00:00:00.000Z");
  return {
    largeSpecNet:  sign * (n(r.noncomm_positions_long_all)  - n(r.noncomm_positions_short_all)),
    commercialNet: sign * (n(r.comm_positions_long_all)     - n(r.comm_positions_short_all)),
    smallSpecNet:  sign * (n(r.nonrept_positions_long_all)  - n(r.nonrept_positions_short_all)),
    reportDate,
  };
}

async function main() {
  console.log("🔧 COT Patch Seed — backfilling missing instruments\n");

  let totalInserted = 0;

  for (const inst of PATCH_INSTRUMENTS) {
    // Delete only this instrument's rows first
    const del = await prisma.cotReport.deleteMany({ where: { pair: inst.pair } });
    console.log(`  Cleared ${del.count} existing rows for ${inst.pair}`);

    process.stdout.write(`  ${inst.pair} (${inst.label}) … fetching … `);
    const rows = await fetchAllRows(inst.code, inst.pair);
    process.stdout.write(`${rows.length} weeks → inserting … `);

    const data = rows
      .map((r) => {
        try {
          const { reportDate, largeSpecNet, commercialNet, smallSpecNet } = parseRow(r, inst.usdBase);
          return { pair: inst.pair, reportDate, largeSpecNet, commercialNet, smallSpecNet };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as { pair: string; reportDate: Date; largeSpecNet: number; commercialNet: number; smallSpecNet: number }[];

    const CHUNK = 500;
    for (let i = 0; i < data.length; i += CHUNK) {
      await prisma.cotReport.createMany({
        data:           data.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
    }

    totalInserted += data.length;
    console.log(`done (${data.length} rows)`);
  }

  console.log(`\n✅ Patch complete — ${totalInserted} rows inserted.`);
}

main()
  .catch((e) => { console.error("Patch failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
