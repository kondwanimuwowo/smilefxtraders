// COT signal-change detection around a sync run. The sync/refresh routes
// snapshot every pair's current signal before syncing, then call
// notifyCotSignalChanges afterwards — a notification goes out only when a NEW
// weekly report landed and its signal label flipped, or its 3-year index
// crossed into an extreme zone (≥80 / ≤20). Fan-out itself (targeting, prefs,
// dedupe) lives in lib/notify-events.ts with the other event fan-outs.

import { prisma } from "@/lib/prisma";
import { computeCotStats, INDEX_WEEKS } from "./signal";
import { fanOutCotSignal } from "@/lib/notify-events";
import { SIGNAL_CFG } from "@/components/cot/signalCfg";
import type { CotSignal } from "./types";

const EXTREME_HIGH = 80;
const EXTREME_LOW  = 20;

export interface CotSnapshot {
  signal:     CotSignal;
  cotIndex:   number;
  latestDate: string; // ISO yyyy-mm-dd
}

async function readSnapshot(pair: string): Promise<CotSnapshot | null> {
  const rows = await prisma.cotReport.findMany({
    where:   { pair },
    orderBy: { reportDate: "desc" },
    take:    INDEX_WEEKS,
    select:  { reportDate: true, largeSpecNet: true, commercialNet: true, smallSpecNet: true },
  });
  if (rows.length < 2) return null;

  const stats = computeCotStats(
    rows.map((r) => ({
      date:          r.reportDate.toISOString().split("T")[0],
      largeSpecNet:  r.largeSpecNet,
      commercialNet: r.commercialNet,
      smallSpecNet:  r.smallSpecNet,
    }))
  );
  return {
    signal:     stats.signal,
    cotIndex:   stats.cotIndex,
    latestDate: rows[0].reportDate.toISOString().split("T")[0],
  };
}

/** Per-pair signal state before a sync run. */
export async function snapshotCotSignals(pairs: string[]): Promise<Map<string, CotSnapshot>> {
  const map = new Map<string, CotSnapshot>();
  await Promise.all(
    pairs.map(async (pair) => {
      const snap = await readSnapshot(pair).catch(() => null);
      if (snap) map.set(pair, snap);
    })
  );
  return map;
}

const isBullish = (s: CotSignal) => s === "strong_bull" || s === "bull";
const isBearish = (s: CotSignal) => s === "strong_bear" || s === "bear";

/**
 * Compare post-sync state against a pre-sync snapshot and fan out
 * notifications for meaningful changes. Never throws — sync results must not
 * depend on notification delivery.
 */
export async function notifyCotSignalChanges(before: Map<string, CotSnapshot>): Promise<void> {
  try {
    const after = await snapshotCotSignals([...before.keys()]);

    for (const [pair, prev] of before) {
      const cur = after.get(pair);
      // Only announce when a new weekly report actually landed
      if (!cur || cur.latestDate <= prev.latestDate) continue;

      const wasHigh = prev.cotIndex >= EXTREME_HIGH;
      const wasLow  = prev.cotIndex <= EXTREME_LOW;
      const isHigh  = cur.cotIndex  >= EXTREME_HIGH;
      const isLow   = cur.cotIndex  <= EXTREME_LOW;

      const flipped        = cur.signal !== prev.signal;
      const enteredExtreme = (isHigh && !wasHigh) || (isLow && !wasLow);
      if (!flipped && !enteredExtreme) continue;

      const label   = SIGNAL_CFG[cur.signal].label;
      const bullish = isBullish(cur.signal) ? true : isBearish(cur.signal) ? false : null;

      const title = flipped
        ? `COT: ${pair} signal is now ${label}`
        : `COT: ${pair} positioning at a 3-year ${isHigh ? "high" : "low"}`;
      const body = flipped
        ? `Was ${SIGNAL_CFG[prev.signal].label} · 3-yr index ${cur.cotIndex}`
        : `${label} · 3-yr index ${cur.cotIndex} (${isHigh ? "≥80" : "≤20"})`;

      await fanOutCotSignal({ pair, title, body, bullish, reportDate: cur.latestDate });
    }
  } catch (e) {
    console.error("[cot] signal notify failed:", e instanceof Error ? e.message : e);
  }
}
