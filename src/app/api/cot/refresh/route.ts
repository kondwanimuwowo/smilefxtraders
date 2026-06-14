/**
 * /api/cot/refresh
 *
 * Manual sync — same logic as /api/cot/sync but protected by Supabase user
 * auth instead of CRON_SECRET. Any logged-in user can trigger it.
 * Called by the Refresh button on the COT page.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
      const reportDate    = new Date(r.report_date_as_yyyy_mm_dd.slice(0, 10) + "T00:00:00.000Z");
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

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
