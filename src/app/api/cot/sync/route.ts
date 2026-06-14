/**
 * /api/cot/sync
 *
 * Fetches the latest 8 weeks from the CFTC API and upserts into Supabase.
 * Called by a weekly cron job (cron-jobs.org or Vercel Cron) every Tuesday
 * at ~16:00 EST, after CFTC publishes new data at ~15:30 EST.
 *
 * Protected by a shared secret — set CRON_SECRET in .env.local and pass it
 * as the Authorization header: `Bearer <CRON_SECRET>`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const CFTC_BASE = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";

const INSTRUMENTS = [
  { pair: "EURUSD", code: "099741", usdBase: false },
  { pair: "GBPUSD", code: "096742", usdBase: false },
  { pair: "AUDUSD", code: "232741", usdBase: false },
  { pair: "NZDUSD", code: "112741", usdBase: false },
  { pair: "USDJPY", code: "097741", usdBase: true  },
  { pair: "USDCHF", code: "092741", usdBase: true  },
  { pair: "USDCAD", code: "090741", usdBase: true  },
  { pair: "XAUUSD", code: "088691", usdBase: false },
  { pair: "NAS100", code: "209742", usdBase: false },
  { pair: "DXY",    code: "098662", usdBase: false },
] as const;

interface SocrataRow {
  report_date_as_yyyy_mm_dd:   string;
  noncomm_positions_long_all:  string;
  noncomm_positions_short_all: string;
  comm_positions_long_all:     string;
  comm_positions_short_all:    string;
  nonrept_positions_long_all:  string;
  nonrept_positions_short_all: string;
}

function n(s: string) { return parseInt(s ?? "0") || 0; }

async function syncInstrument(code: string, pair: string, usdBase: boolean) {
  const url = new URL(CFTC_BASE);
  url.searchParams.set("$where",  `cftc_contract_market_code='${code}'`);
  url.searchParams.set("$order",  "report_date_as_yyyy_mm_dd DESC");
  url.searchParams.set("$limit",  "8");
  url.searchParams.set(
    "$select",
    "report_date_as_yyyy_mm_dd,noncomm_positions_long_all,noncomm_positions_short_all,comm_positions_long_all,comm_positions_short_all,nonrept_positions_long_all,nonrept_positions_short_all"
  );

  const ac  = new AbortController();
  const tid = setTimeout(() => ac.abort(), 25_000);
  const res = await fetch(url.toString(), { signal: ac.signal });
  clearTimeout(tid);

  if (!res.ok) throw new Error(`CFTC ${res.status} for ${pair}`);
  const rows = (await res.json()) as SocrataRow[];

  const sign = usdBase ? -1 : 1;

  await Promise.all(
    rows.map((r) => {
      const reportDate = new Date(r.report_date_as_yyyy_mm_dd.slice(0, 10) + "T00:00:00.000Z");
      const largeSpecNet  = sign * (n(r.noncomm_positions_long_all)  - n(r.noncomm_positions_short_all));
      const commercialNet = sign * (n(r.comm_positions_long_all)     - n(r.comm_positions_short_all));
      const smallSpecNet  = sign * (n(r.nonrept_positions_long_all)  - n(r.nonrept_positions_short_all));

      return prisma.cotReport.upsert({
        where:  { pair_reportDate: { pair, reportDate } },
        update: { largeSpecNet, commercialNet, smallSpecNet },
        create: { pair, reportDate, largeSpecNet, commercialNet, smallSpecNet },
      });
    })
  );

  return rows.length;
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  await Promise.allSettled(
    INSTRUMENTS.map(async (inst) => {
      try {
        const count = await syncInstrument(inst.code, inst.pair, inst.usdBase);
        results[inst.pair] = `${count} rows upserted`;
      } catch (e) {
        results[inst.pair] = `error: ${e instanceof Error ? e.message : String(e)}`;
      }
    })
  );

  return NextResponse.json({ ok: true, synced: new Date().toISOString(), results });
}
