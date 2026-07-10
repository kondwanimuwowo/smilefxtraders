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
import { getInstruments } from "@/lib/server/getInstruments";
import { syncAllInstruments } from "@/lib/cot/sync";
import { snapshotCotSignals, notifyCotSignalChanges } from "@/lib/cot/notify";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instruments = await getInstruments();
  const cotPairs    = instruments.filter((i) => i.cotCode != null).map((i) => i.symbol);

  const before  = await snapshotCotSignals(cotPairs);
  const results = await syncAllInstruments(instruments, 8);
  await notifyCotSignalChanges(before); // no-op unless a new report landed

  return NextResponse.json({ ok: true, synced: new Date().toISOString(), results });
}
