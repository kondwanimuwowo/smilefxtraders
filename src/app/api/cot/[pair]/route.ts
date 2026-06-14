import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CotSignal } from "@/app/api/cot/route";

const VALID_PAIRS = new Set([
  "EURUSD", "GBPUSD", "AUDUSD", "NZDUSD",
  "USDJPY", "USDCHF", "USDCAD",
  "XAUUSD", "NAS100", "DXY",
]);

const LABELS: Record<string, string> = {
  EURUSD: "Euro FX",          GBPUSD: "British Pound",
  AUDUSD: "Australian Dollar", NZDUSD: "NZ Dollar",
  USDJPY: "Japanese Yen",     USDCHF: "Swiss Franc",
  USDCAD: "Canadian Dollar",  XAUUSD: "Gold",
  NAS100: "NASDAQ E-mini",    DXY:    "USD Index",
};

const USD_BASE = new Set(["USDJPY", "USDCHF", "USDCAD"]);

export const revalidate = 1800;

const TAKE = 104;

export interface CotDetailRow {
  date:          string;
  largeSpecNet:  number;
  commercialNet: number;
  smallSpecNet:  number;
}

export interface CotDetailResponse {
  pair:          string;
  label:         string;
  usdBase:       boolean;
  rows:          CotDetailRow[];
  totalWeeks:    number;
  // Current signal — computed from the two most recent rows
  signal:        CotSignal;
  cotIndex:      number;
  cotIndexC:     number;
  wowChange:     number;
  reportDate:    string;
  divergenceType: "aligned" | "mixed" | "counter";
}

// Mirrors the signal computation in /api/cot/route.ts
function computeSignal(rows52: CotDetailRow[]): Pick<
  CotDetailResponse,
  "signal" | "cotIndex" | "cotIndexC" | "wowChange" | "reportDate" | "divergenceType"
> {
  const current = rows52[0];
  const prev    = rows52[1] ?? rows52[0];

  const allLS = rows52.map((r) => r.largeSpecNet);
  const allC  = rows52.map((r) => r.commercialNet);
  const min52w  = Math.min(...allLS);
  const max52w  = Math.max(...allLS);
  const minC52w = Math.min(...allC);
  const maxC52w = Math.max(...allC);

  const rangeLS = max52w  - min52w  || 1;
  const rangeC  = maxC52w - minC52w || 1;

  const cotIndex  = Math.round(Math.max(0, Math.min(100, ((current.largeSpecNet  - min52w)  / rangeLS) * 100)));
  const cotIndexC = Math.round(Math.max(0, Math.min(100, ((current.commercialNet - minC52w) / rangeC)  * 100)));

  const wowChange    = current.largeSpecNet - prev.largeSpecNet;
  const lsIncreasing = wowChange > 0;
  const cMoreShort   = current.commercialNet < prev.commercialNet;
  const netLong      = current.largeSpecNet > 0;

  const avgAbsNet      = (Math.abs(current.largeSpecNet) + Math.abs(current.commercialNet) + Math.abs(current.smallSpecNet)) / 3;
  const mixedThreshold = Math.max(500, avgAbsNet * 0.01);

  let divergenceType: CotDetailResponse["divergenceType"];
  if (Math.abs(wowChange) < mixedThreshold) divergenceType = "mixed";
  else if (lsIncreasing === cMoreShort)     divergenceType = "aligned";
  else                                      divergenceType = "counter";

  let signal: CotSignal;
  if      (netLong  && lsIncreasing  && cotIndex >= 65) signal = "strong_bull";
  else if (netLong  && lsIncreasing)                    signal = "bull";
  else if (netLong  && !lsIncreasing && cotIndex >= 70) signal = "neutral";
  else if (netLong  && !lsIncreasing)                   signal = "bull";
  else if (!netLong && !lsIncreasing && cotIndex <= 35) signal = "strong_bear";
  else if (!netLong && !lsIncreasing)                   signal = "bear";
  else if (!netLong && lsIncreasing  && cotIndex <= 30) signal = "neutral";
  else if (!netLong && lsIncreasing)                    signal = "bear";
  else                                                  signal = "neutral";

  const reportDate = new Date(current.date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return { signal, cotIndex, cotIndexC, wowChange, reportDate, divergenceType };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  const upper = pair.toUpperCase();

  if (!VALID_PAIRS.has(upper)) {
    return NextResponse.json({ error: "Unknown pair" }, { status: 404 });
  }

  const url    = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10));

  // For offset=0, fetch 52 extra rows to compute the COT Index (52w range)
  const isFirstPage = offset === 0;
  const take        = isFirstPage ? Math.max(TAKE, 52) : TAKE;

  const [rows, totalWeeks] = await Promise.all([
    prisma.cotReport.findMany({
      where:   { pair: upper },
      orderBy: { reportDate: "desc" },
      take,
      skip:    offset,
      select:  { reportDate: true, largeSpecNet: true, commercialNet: true, smallSpecNet: true },
    }),
    prisma.cotReport.count({ where: { pair: upper } }),
  ]);

  const mapped: CotDetailRow[] = rows.map((r) => ({
    date:          r.reportDate.toISOString().split("T")[0],
    largeSpecNet:  r.largeSpecNet,
    commercialNet: r.commercialNet,
    smallSpecNet:  r.smallSpecNet,
  }));

  // Compute signal from first 52 (or all available) rows
  const signalRows  = isFirstPage ? mapped.slice(0, 52) : mapped;
  const signalData  = mapped.length >= 2 ? computeSignal(signalRows.length >= 2 ? signalRows : mapped) : {
    signal: "neutral" as CotSignal, cotIndex: 50, cotIndexC: 50,
    wowChange: 0, reportDate: "—", divergenceType: "mixed" as const,
  };

  // Return only TAKE rows as display data (trim the extra 52 used for computation)
  const displayRows = isFirstPage ? mapped.slice(0, TAKE) : mapped;

  return NextResponse.json({
    pair:    upper,
    label:   LABELS[upper],
    usdBase: USD_BASE.has(upper),
    rows:    displayRows,
    totalWeeks,
    ...signalData,
  } satisfies CotDetailResponse);
}
