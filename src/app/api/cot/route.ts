import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstruments } from "@/lib/server/getInstruments";
import { requirePaidPlan } from "@/lib/plan-guard";
import { computeCotStats, EMPTY_COT_STATS, INDEX_WEEKS, percentile } from "@/lib/cot/signal";
import { deriveMetaMap } from "@/lib/pairs";
import { computeCrossPairSignal } from "@/lib/cot/crossPairSignal";
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
          select:  {
            reportDate:    true,
            largeSpecNet:  true, largeSpecLong: true, largeSpecShort: true,
            commercialNet: true, smallSpecNet:  true, openInterest:   true,
          },
        })
      )
    ),
    // One groupBy for totals + full-history net range (all-time index)
    prisma.cotReport.groupBy({
      by:     ["pair"],
      _count: { pair: true },
      _min:   { largeSpecNet: true },
      _max:   { largeSpecNet: true },
    }),
  ]);

  const totalByPair = new Map(totals.map((t) => [t.pair, t._count.pair]));
  const rangeByPair = new Map(totals.map((t) => [t.pair, { min: t._min.largeSpecNet, max: t._max.largeSpecNet }]));

  const entries: CotEntry[] = cotInstruments.map((inst, i) => {
    const result = dbResults[i];
    const rows   = result.status === "fulfilled" ? result.value : [];
    const totalWeeks = totalByPair.get(inst.pair) ?? rows.length;

    if (rows.length >= 2) {
      const window: CotWeek[] = rows.map((r) => ({
        date:           r.reportDate.toISOString().split("T")[0],
        largeSpecNet:   r.largeSpecNet,
        commercialNet:  r.commercialNet,
        smallSpecNet:   r.smallSpecNet,
        largeSpecLong:  r.largeSpecLong,
        largeSpecShort: r.largeSpecShort,
      }));
      const stats = computeCotStats(window, inst.fallback);

      // 1-year index over the most recent 52 weeks of the fetched window
      const win52 = window.slice(0, 52).map((w) => w.largeSpecNet);
      const cotIndex52w = win52.length >= 52
        ? percentile(win52[0], Math.min(...win52), Math.max(...win52))
        : null;

      // All-time index from the groupBy's full-history range
      const range = rangeByPair.get(inst.pair);
      const cotIndexAll = range?.min != null && range?.max != null
        ? percentile(window[0].largeSpecNet, range.min, range.max)
        : null;

      return {
        pair:         inst.pair,
        label:        inst.label,
        usdBase:      inst.usdBase,
        history:      window.slice(0, 8),
        totalWeeks,
        openInterest: rows[0].openInterest,
        cotIndex52w,
        cotIndexAll,
        ...stats,
      };
    }

    // DB is empty for this instrument
    return {
      pair:         inst.pair,
      label:        inst.label,
      usdBase:      inst.usdBase,
      history:      [],
      totalWeeks:   0,
      openInterest: null,
      cotIndex52w:  null,
      cotIndexAll:  null,
      ...EMPTY_COT_STATS,
    };
  });

  // Cross pairs (minors) — no direct CFTC contract, so COT is derived from
  // each leg's currency-level positioning (see lib/cot/crossPairSignal.ts).
  const crossInstruments = instruments.filter((i) => i.category === "forex" && i.cotContract == null);
  const metaMap = deriveMetaMap(instruments);

  const crossEntriesRaw = await Promise.all(
    crossInstruments.map(async (inst): Promise<CotEntry | null> => {
      const meta = metaMap[inst.symbol];
      if (!meta) return null;
      const result = await computeCrossPairSignal(meta.base, meta.quote);
      if (!result) return null;
      const { stats, history, totalWeeks } = result;
      return {
        pair:         inst.symbol,
        label:        inst.label,
        usdBase:      false,
        history,
        totalWeeks,
        openInterest: null,
        cotIndex52w:  null,
        cotIndexAll:  null,
        synthetic:    true,
        ...stats,
      };
    })
  );
  const crossEntries = crossEntriesRaw.filter((e): e is CotEntry => e !== null);

  return NextResponse.json([...entries, ...crossEntries]);
}
