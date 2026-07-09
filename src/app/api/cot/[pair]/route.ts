import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInstruments } from "@/lib/server/getInstruments";
import { requirePaidPlan } from "@/lib/plan-guard";
import { computeCotStats, EMPTY_COT_STATS, INDEX_WEEKS } from "@/lib/cot/signal";
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
  const inst = instruments.find((i) => i.symbol === upper && i.cotContract != null);
  if (!inst) {
    return NextResponse.json({ error: "Unknown pair" }, { status: 404 });
  }

  const url    = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10));

  // For offset=0, fetch the full index window to compute the COT Index (3yr/156w)
  const isFirstPage = offset === 0;
  const take        = isFirstPage ? Math.max(TAKE, INDEX_WEEKS) : TAKE;

  const [rows, totalWeeks] = await Promise.all([
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
      },
    }),
    prisma.cotReport.count({ where: { pair: upper } }),
  ]);

  const mapped: CotDetailRow[] = rows.map((r) => ({
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
  }));

  // Compute signal from the index window (first page only has enough rows)
  const signalData = isFirstPage && mapped.length >= 2
    ? computeCotStats(mapped.slice(0, INDEX_WEEKS))
    : EMPTY_COT_STATS;

  // Return only TAKE rows as display data (trim the extra rows used for computation)
  const displayRows = isFirstPage ? mapped.slice(0, TAKE) : mapped;

  return NextResponse.json({
    pair:    upper,
    label:   inst.label,
    usdBase: inst.cotInverted,
    rows:    displayRows,
    totalWeeks,
    ...signalData,
  } satisfies CotDetailResponse);
}
