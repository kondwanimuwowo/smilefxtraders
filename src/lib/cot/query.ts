// Server-side COT lookups for internal consumers (MacroEdge confluence, Gavo)
// that need the current signal without going through the plan-gated HTTP API.

import { prisma } from "@/lib/prisma";
import { computeCotStats, INDEX_WEEKS } from "./signal";
import type { CotSignal } from "./types";

/** Current COT signal for a pair, or null when the DB has too little history. */
export async function getCotSignal(pair: string): Promise<CotSignal | null> {
  const rows = await prisma.cotReport.findMany({
    where:   { pair: pair.toUpperCase() },
    orderBy: { reportDate: "desc" },
    take:    INDEX_WEEKS,
    select:  { reportDate: true, largeSpecNet: true, commercialNet: true, smallSpecNet: true },
  });
  if (rows.length < 2) return null;

  const window = rows.map((r) => ({
    date:          r.reportDate.toISOString().split("T")[0],
    largeSpecNet:  r.largeSpecNet,
    commercialNet: r.commercialNet,
    smallSpecNet:  r.smallSpecNet,
  }));
  return computeCotStats(window).signal;
}
