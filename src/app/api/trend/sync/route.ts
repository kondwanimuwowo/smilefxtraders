/**
 * /api/trend/sync
 *
 * Recomputes the Trend Matrix's market structure from broker candles. Called
 * hourly by cron-jobs.org (see CRON.md). `?tf=H1,H4` limits the run to those
 * timeframes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireCronSecret } from "@/lib/cron-auth";
import { getInstruments } from "@/lib/server/getInstruments";
import { syncTrendStructure } from "@/lib/trend/sync";
import { TREND_TFS, type TrendTf } from "@/lib/trend/structure";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    const tfParam = req.nextUrl.searchParams.get("tf");
    const tfs = tfParam
      ? TREND_TFS.filter((tf) => tfParam.split(",").includes(tf))
      : TREND_TFS;
    if (!tfs.length) {
      return NextResponse.json({ error: `"tf" must list some of ${TREND_TFS.join(", ")}` }, { status: 400 });
    }

    const pairs = (await getInstruments()).map((i) => i.symbol);
    const results = await syncTrendStructure(pairs, tfs as TrendTf[]);
    const failed = results.filter((r) => !r.ok);
    if (failed.length) console.error("[trend/sync] failed cells:", JSON.stringify(failed));

    return NextResponse.json({ ok: failed.length === 0, synced: new Date().toISOString(), updated: results.length - failed.length, failed });
  } catch (err) {
    return handleApiError("trend/sync", err);
  }
}
