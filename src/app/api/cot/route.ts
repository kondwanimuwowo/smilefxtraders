import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstruments } from "@/lib/server/getInstruments";
import { requirePaidPlan } from "@/lib/plan-guard";
import { computeCotStats, EMPTY_COT_STATS, INDEX_WEEKS } from "@/lib/cot/signal";
import type { CotEntry, CotWeek } from "@/lib/cot/types";

export async function GET() {
  // Plan gate — COT data requires PRO or FUNDED
  const denied = await requirePaidPlan("COT Reports");
  if (denied) return denied;

  // Load instrument metadata from DB
  const instruments = await getInstruments();
  const cotInstruments = instruments
    .filter((i) => i.cotContract != null)
    .map((i) => ({
      pair:    i.symbol,
      label:   i.label,
      usdBase: i.cotInverted,
      fallback: {
        min:  i.cotMin52w  ?? 0,
        max:  i.cotMax52w  ?? 0,
        minC: i.cotMinC52w ?? 0,
        maxC: i.cotMaxC52w ?? 0,
      },
    }));

  // Fetch the index window for each instrument + all totals in one groupBy
  const [dbResults, totals] = await Promise.all([
    Promise.allSettled(
      cotInstruments.map((inst) =>
        prisma.cotReport.findMany({
          where:   { pair: inst.pair },
          orderBy: { reportDate: "desc" },
          take:    INDEX_WEEKS,
          select:  { reportDate: true, largeSpecNet: true, commercialNet: true, smallSpecNet: true },
        })
      )
    ),
    prisma.cotReport.groupBy({ by: ["pair"], _count: { pair: true } }),
  ]);

  const totalByPair = new Map(totals.map((t) => [t.pair, t._count.pair]));

  const entries: CotEntry[] = cotInstruments.map((inst, i) => {
    const result = dbResults[i];
    const rows   = result.status === "fulfilled" ? result.value : [];
    const totalWeeks = totalByPair.get(inst.pair) ?? rows.length;

    if (rows.length >= 2) {
      const window: CotWeek[] = rows.map((r) => ({
        date:          r.reportDate.toISOString().split("T")[0],
        largeSpecNet:  r.largeSpecNet,
        commercialNet: r.commercialNet,
        smallSpecNet:  r.smallSpecNet,
      }));
      const stats = computeCotStats(window, inst.fallback);
      return {
        pair:    inst.pair,
        label:   inst.label,
        usdBase: inst.usdBase,
        history: window.slice(0, 8),
        totalWeeks,
        ...stats,
      };
    }

    // DB is empty for this instrument
    return {
      pair:       inst.pair,
      label:      inst.label,
      usdBase:    inst.usdBase,
      history:    [],
      totalWeeks: 0,
      ...EMPTY_COT_STATS,
    };
  });

  return NextResponse.json(entries);
}
