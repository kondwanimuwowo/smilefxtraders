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
import { getInstruments } from "@/lib/server/getInstruments";

const CFTC_BASE = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";

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

async function syncInstrument(code: string, pair: string, usdBase: boolean, limit = 156) {
  const url = new URL(CFTC_BASE);
  url.searchParams.set("$where",  `cftc_contract_market_code='${code}'`);
  url.searchParams.set("$order",  "report_date_as_yyyy_mm_dd DESC");
  url.searchParams.set("$limit",  String(limit));
  url.searchParams.set(
    "$select",
    "report_date_as_yyyy_mm_dd,noncomm_positions_long_all,noncomm_positions_short_all,comm_positions_long_all,comm_positions_short_all,nonrept_positions_long_all,nonrept_positions_short_all"
  );

  const ac  = new AbortController();
  const tid = setTimeout(() => ac.abort(), 30_000);
  const res = await fetch(url.toString(), { signal: ac.signal });
  clearTimeout(tid);

  if (!res.ok) throw new Error(`CFTC ${res.status} for ${pair}`);
  const rows = (await res.json()) as SocrataRow[];

  const sign = usdBase ? -1 : 1;

  await Promise.all(
    rows.map((r) => {
      const reportDate    = new Date(r.report_date_as_yyyy_mm_dd.slice(0, 10) + "T00:00:00.000Z");
      const lsLong        = n(r.noncomm_positions_long_all);
      const lsShort       = n(r.noncomm_positions_short_all);
      const cLong         = n(r.comm_positions_long_all);
      const cShort        = n(r.comm_positions_short_all);
      const ssLong        = n(r.nonrept_positions_long_all);
      const ssShort       = n(r.nonrept_positions_short_all);
      const largeSpecNet  = sign * (lsLong  - lsShort);
      const commercialNet = sign * (cLong   - cShort);
      const smallSpecNet  = sign * (ssLong  - ssShort);

      const fields = {
        largeSpecNet,  largeSpecLong: lsLong,  largeSpecShort: lsShort,
        commercialNet, commercialLong: cLong,  commercialShort: cShort,
        smallSpecNet,  smallSpecLong: ssLong,  smallSpecShort: ssShort,
      };

      return prisma.cotReport.upsert({
        where:  { pair_reportDate: { pair, reportDate } },
        update: fields,
        create: { pair, reportDate, ...fields },
      });
    })
  );

  return rows.length;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const instruments = await getInstruments();
  const cotInstruments = instruments.filter((i) => i.cotCode != null);

  const results: Record<string, string> = {};

  await Promise.allSettled(
    cotInstruments.map(async (inst) => {
      try {
        const count = await syncInstrument(inst.cotCode!, inst.symbol, !inst.cotInverted);
        results[inst.symbol] = `${count} rows upserted`;
      } catch (e) {
        results[inst.symbol] = `error: ${e instanceof Error ? e.message : String(e)}`;
      }
    })
  );

  return NextResponse.json({ ok: true, synced: new Date().toISOString(), results });
}
