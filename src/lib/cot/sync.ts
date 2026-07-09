// Shared CFTC → Supabase sync used by /api/cot/sync (cron) and
// /api/cot/refresh (manual). Fetches the Legacy Futures-Only report from the
// CFTC Socrata API and upserts pair-framed rows (see types.ts for the sign
// convention). prisma/seed-cot.ts implements the same parsing for the
// one-time full-history load — keep the two in step.

import { prisma } from "@/lib/prisma";

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

/**
 * Sync the latest `limit` weeks for one instrument.
 * `inverted` = instruments.cotInverted — true for USD-base pairs
 * (USDJPY/USDCHF/USDCAD): nets are multiplied by −1 so positive = bullish on
 * the displayed pair. Long/short columns stay raw (contract framing).
 */
export async function syncInstrument(code: string, pair: string, inverted: boolean, limit = 8): Promise<number> {
  const url = new URL(CFTC_BASE);
  url.searchParams.set("$where",  `cftc_contract_market_code='${code}'`);
  url.searchParams.set("$order",  "report_date_as_yyyy_mm_dd DESC");
  url.searchParams.set("$limit",  String(limit));
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

  const sign = inverted ? -1 : 1;

  await Promise.all(
    rows.map((r) => {
      // Append Z to force UTC — parsed as local time, dates shift backwards in UTC+2
      const reportDate = new Date(r.report_date_as_yyyy_mm_dd.slice(0, 10) + "T00:00:00.000Z");
      const lsLong  = n(r.noncomm_positions_long_all);
      const lsShort = n(r.noncomm_positions_short_all);
      const cLong   = n(r.comm_positions_long_all);
      const cShort  = n(r.comm_positions_short_all);
      const ssLong  = n(r.nonrept_positions_long_all);
      const ssShort = n(r.nonrept_positions_short_all);

      const fields = {
        largeSpecNet:  sign * (lsLong - lsShort),  largeSpecLong: lsLong,  largeSpecShort: lsShort,
        commercialNet: sign * (cLong  - cShort),   commercialLong: cLong,  commercialShort: cShort,
        smallSpecNet:  sign * (ssLong - ssShort),  smallSpecLong: ssLong,  smallSpecShort: ssShort,
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

/** Sync every COT-enabled instrument; returns a per-symbol result map. */
export async function syncAllInstruments(
  instruments: { symbol: string; cotCode: string | null; cotInverted: boolean }[],
  limit: number,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.allSettled(
    instruments
      .filter((i) => i.cotCode != null)
      .map(async (inst) => {
        try {
          const count = await syncInstrument(inst.cotCode!, inst.symbol, inst.cotInverted, limit);
          results[inst.symbol] = `${count} rows upserted`;
        } catch (e) {
          results[inst.symbol] = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
      })
  );

  return results;
}
