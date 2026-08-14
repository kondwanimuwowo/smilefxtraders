/**
 * /api/cot/refresh
 *
 * Manual sync — same logic as /api/cot/sync but protected by user plan
 * instead of CRON_SECRET. Called by the Refresh button on the COT page.
 *
 * Skips the CFTC round-trip entirely when the DB already holds CFTC's most
 * recently published report — checked against CFTC directly (one cheap
 * 1-row lookup) rather than a guessed publication-time cutoff, so the
 * button reflects reality instead of a calendar assumption.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstruments } from "@/lib/server/getInstruments";
import { requirePaidPlan } from "@/lib/plan-guard";
import { syncAllInstruments, getLatestCftcReportDate } from "@/lib/cot/sync";
import { snapshotCotSignals, notifyCotSignalChanges } from "@/lib/cot/notify";
import { handleApiError } from "@/lib/api-error";

export async function POST() {
  try {
    const denied = await requirePaidPlan("COT refresh");
    if (denied) return denied;

    const instruments = await getInstruments();
    const cotInstruments = instruments.filter((i) => i.cotCode != null);
    const cotPairs = cotInstruments.map((i) => i.symbol);

    const [latest, cftcLatest] = await Promise.all([
      prisma.cotReport.aggregate({ _max: { reportDate: true } }),
      cotInstruments[0] ? getLatestCftcReportDate(cotInstruments[0].cotCode!) : Promise.resolve(null),
    ]);

    // cftcLatest is null when CFTC's lookup itself failed — fall through to a
    // full sync rather than block on an unknown state.
    if (cftcLatest && latest._max.reportDate && latest._max.reportDate >= cftcLatest) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Data is current (latest report ${latest._max.reportDate.toISOString().slice(0, 10)}).`,
      });
    }

    const before  = await snapshotCotSignals(cotPairs);
    const results = await syncAllInstruments(instruments, 8);
    await notifyCotSignalChanges(before); // no-op unless a new report landed

    return NextResponse.json({ ok: true, synced: new Date().toISOString(), results });
  } catch (err) {
    return handleApiError("cot/refresh", err);
  }
}
