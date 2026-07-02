/**
 * /api/cot/sync
 *
 * Fetches the latest 8 weeks from the CFTC API and upserts into Supabase.
 * Called by a daily cron job (cron-jobs.org) at 21:30 UTC. CFTC publishes
 * new data on Fridays at ~15:30 ET but releases are sometimes delayed —
 * running daily picks up late releases; unchanged days are a cheap no-op.
 *
 * Protected by a shared secret — set CRON_SECRET in .env.local and pass it
 * as the Authorization header: `Bearer <CRON_SECRET>`.
 */

import { NextResponse, type NextRequest } from "next/server";
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

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
