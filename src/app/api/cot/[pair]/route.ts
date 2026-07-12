import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstruments } from "@/lib/server/getInstruments";
import { requirePaidPlan } from "@/lib/plan-guard";
import { computeCotStats, EMPTY_COT_STATS, INDEX_WEEKS, percentile } from "@/lib/cot/signal";
import { deriveMetaMap } from "@/lib/pairs";
import { buildSyntheticHistory } from "@/lib/cot/crossPairSignal";
import type { CotDetailResponse, CotDetailRow } from "@/lib/cot/types";

// Rows served per page; the first page fetches INDEX_WEEKS for the signal math.
const TAKE = 104;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  // Plan gate — COT data requires PRO or FUNDED. Internal consumers
  // (MacroEdge confluence) read via lib/cot/query instead of this route.
  const denied = await requirePaidPlan("COT Reports");
  if (denied) return denied;

  const { pair } = await params;
  const upper = pair.toUpperCase();

  const instruments = await getInstruments();
  const inst = instruments.find((i) => i.symbol === upper);
  if (!inst) {
    return NextResponse.json({ error: "Unknown pair" }, { status: 404 });
  }

  // Cross pairs (minors) have no direct CFTC contract — derive from each
  // leg's currency-level positioning instead. Single page: no "load more"
  // pagination, the intersection is naturally bounded (see crossPairSignal.ts).
  if (inst.cotContract == null && inst.category === "forex") {
    const meta = deriveMetaMap(instruments)[upper];
    if (!meta) return NextResponse.json({ error: "Unknown pair" }, { status: 404 });

    const rows = await buildSyntheticHistory(meta.base, meta.quote, INDEX_WEEKS);
    if (rows.length < 2) {
      return NextResponse.json({ error: `Not enough COT history for ${upper} yet` }, { status: 404 });
    }

    const rolling3yr = (i: number): number | null => {
      const win = rows.slice(i, i + INDEX_WEEKS);
      if (win.length < 26) return null;
      let min = Infinity, max = -Infinity;
      for (const w of win) {
        if (w.largeSpecNet < min) min = w.largeSpecNet;
        if (w.largeSpecNet > max) max = w.largeSpecNet;
      }
      return percentile(rows[i].largeSpecNet, min, max);
    };

    const displayRows: CotDetailRow[] = rows.map((r, i) => ({
      date:            r.date,
      largeSpecLong:   null, largeSpecShort:  null, largeSpecNet:  r.largeSpecNet,
      commercialLong:  null, commercialShort: null, commercialNet: r.commercialNet,
      smallSpecLong:   null, smallSpecShort:  null, smallSpecNet:  r.smallSpecNet,
      openInterest:    null,
      cotIndex3yr:      rolling3yr(i),
    }));

    const signalData = computeCotStats(rows);
    const min = Math.min(...rows.map((r) => r.largeSpecNet));
    const max = Math.max(...rows.map((r) => r.largeSpecNet));
    const cotIndexAll = percentile(rows[0].largeSpecNet, min, max);

    return NextResponse.json({
      pair:      upper,
      label:     inst.label,
      usdBase:   false,
      rows:      displayRows,
      totalWeeks: rows.length,
      cotIndexAll,
      synthetic: true,
      ...signalData,
    } satisfies CotDetailResponse);
  }

  if (inst.cotContract == null) {
    return NextResponse.json({ error: "Unknown pair" }, { status: 404 });
  }

  const url    = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10));

  // Every page fetches INDEX_WEEKS extra trailing rows so each displayed week
  // gets a rolling 3yr COT Index computed over ITS OWN trailing window (the
  // index-history line on the chart). offset=0 additionally uses the leading
  // rows for the current signal math.
  const isFirstPage = offset === 0;
  const take        = TAKE + INDEX_WEEKS;

  const [rows, totalWeeks, allTimeRange] = await Promise.all([
    prisma.cotReport.findMany({
      where:   { pair: upper },
      orderBy: { reportDate: "desc" },
      take,
      skip:    offset,
      select:  {
        reportDate:     true,
        largeSpecLong:  true, largeSpecShort:  true, largeSpecNet:  true,
        commercialLong: true, commercialShort: true, commercialNet: true,
        smallSpecLong:  true, smallSpecShort:  true, smallSpecNet:  true,
        openInterest:   true,
      },
    }),
    prisma.cotReport.count({ where: { pair: upper } }),
    // Full-history net range for the all-time COT Index track
    prisma.cotReport.aggregate({
      where: { pair: upper },
      _min:  { largeSpecNet: true },
      _max:  { largeSpecNet: true },
    }),
  ]);

  // Rolling 3yr index for row i = percentile of its net within the window of
  // the INDEX_WEEKS rows ending at that week (rows are newest-first). Needs at
  // least 26 trailing weeks to be meaningful — earlier weeks return null.
  const rolling3yr = (i: number): number | null => {
    const win = rows.slice(i, i + INDEX_WEEKS);
    if (win.length < 26) return null;
    let min = Infinity, max = -Infinity;
    for (const w of win) {
      if (w.largeSpecNet < min) min = w.largeSpecNet;
      if (w.largeSpecNet > max) max = w.largeSpecNet;
    }
    return percentile(rows[i].largeSpecNet, min, max);
  };

  const mapped: CotDetailRow[] = rows.map((r, i) => ({
    date:           r.reportDate.toISOString().split("T")[0],
    largeSpecLong:  r.largeSpecLong,
    largeSpecShort: r.largeSpecShort,
    largeSpecNet:   r.largeSpecNet,
    commercialLong:  r.commercialLong,
    commercialShort: r.commercialShort,
    commercialNet:  r.commercialNet,
    smallSpecLong:  r.smallSpecLong,
    smallSpecShort: r.smallSpecShort,
    smallSpecNet:   r.smallSpecNet,
    openInterest:   r.openInterest,
    cotIndex3yr:    rolling3yr(i),
  }));

  // Compute signal from the index window (first page only has enough rows)
  const signalData = isFirstPage && mapped.length >= 2
    ? computeCotStats(mapped.slice(0, INDEX_WEEKS))
    : EMPTY_COT_STATS;

  // All-time index: current net's percentile within the full stored history
  const cotIndexAll =
    isFirstPage && mapped.length >= 2 && allTimeRange._min.largeSpecNet != null && allTimeRange._max.largeSpecNet != null
      ? percentile(mapped[0].largeSpecNet, allTimeRange._min.largeSpecNet, allTimeRange._max.largeSpecNet)
      : null;

  // Return only TAKE rows as display data (trim the trailing rows fetched for
  // the rolling-index windows and, on the first page, the signal math)
  const displayRows = mapped.slice(0, TAKE);

  return NextResponse.json({
    pair:    upper,
    label:   inst.label,
    usdBase: inst.cotInverted,
    rows:    displayRows,
    totalWeeks,
    cotIndexAll,
    ...signalData,
  } satisfies CotDetailResponse);
}
