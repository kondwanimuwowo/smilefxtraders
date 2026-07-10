/**
 * /api/cot/refresh
 *
 * Manual sync — same logic as /api/cot/sync but protected by user plan
 * instead of CRON_SECRET. Called by the Refresh button on the COT page.
 *
 * Skips the CFTC round-trip entirely when the DB already holds the most
 * recent published report, so the button can't be used to hammer the CFTC
 * API or the DB with redundant upserts.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstruments } from "@/lib/server/getInstruments";
import { requirePaidPlan } from "@/lib/plan-guard";
import { syncAllInstruments } from "@/lib/cot/sync";
import { snapshotCotSignals, notifyCotSignalChanges } from "@/lib/cot/notify";

/**
 * The report week (a Tuesday) we expect to be available by now.
 * CFTC publishes Tuesday data on Friday ~15:30 ET; we treat it as expected
 * from Saturday 00:00 UTC (comfortably past the release in either DST phase).
 */
function latestExpectedReportDate(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // Walk back to the most recent Tuesday (UTC day 2)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() - 2 + 7) % 7));
  // If that Tuesday's Saturday-publication moment hasn't passed, use the week before
  const published = new Date(d);
  published.setUTCDate(published.getUTCDate() + 4); // Tuesday + 4 = Saturday 00:00 UTC
  if (now < published) d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

export async function POST() {
  const denied = await requirePaidPlan("COT refresh");
  if (denied) return denied;

  const latest = await prisma.cotReport.aggregate({ _max: { reportDate: true } });
  const expected = latestExpectedReportDate();
  if (latest._max.reportDate && latest._max.reportDate >= expected) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `Data is current (latest report ${latest._max.reportDate.toISOString().slice(0, 10)}).`,
    });
  }

  const instruments = await getInstruments();
  const cotPairs    = instruments.filter((i) => i.cotCode != null).map((i) => i.symbol);

  const before  = await snapshotCotSignals(cotPairs);
  const results = await syncAllInstruments(instruments, 8);
  await notifyCotSignalChanges(before); // no-op unless a new report landed

  return NextResponse.json({ ok: true, synced: new Date().toISOString(), results });
}
