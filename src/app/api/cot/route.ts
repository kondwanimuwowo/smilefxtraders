import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// ── Instruments ───────────────────────────────────────────────────────────────
// min52w / max52w are fallback ranges used when fewer than 52 weeks are in the
// DB. Once the seed runs they are computed dynamically from real data.

const INSTRUMENTS = [
  { pair: "EURUSD", label: "Euro FX",          usdBase: false, min52w: -98400,  max52w: 224600,  minC52w: -252400, maxC52w: 98800   },
  { pair: "GBPUSD", label: "British Pound",     usdBase: false, min52w: -74200,  max52w: 58600,   minC52w: -68400,  maxC52w: 82400   },
  { pair: "AUDUSD", label: "Australian Dollar", usdBase: false, min52w: -88400,  max52w: 72600,   minC52w: -84200,  maxC52w: 96400   },
  { pair: "NZDUSD", label: "NZ Dollar",         usdBase: false, min52w: -32800,  max52w: 28400,   minC52w: -28600,  maxC52w: 36200   },
  { pair: "USDJPY", label: "Japanese Yen",      usdBase: true,  min52w: -86400,  max52w: 76200,   minC52w: -78200,  maxC52w: 88400   },
  { pair: "USDCHF", label: "Swiss Franc",       usdBase: true,  min52w: -42600,  max52w: 38400,   minC52w: -36400,  maxC52w: 44200   },
  { pair: "USDCAD", label: "Canadian Dollar",   usdBase: true,  min52w: -62800,  max52w: 56200,   minC52w: -58400,  maxC52w: 66400   },
  { pair: "XAUUSD", label: "Gold",              usdBase: false, min52w: 68400,   max52w: 198200,  minC52w: -242600, maxC52w: -82400  },
  { pair: "NAS100", label: "NASDAQ E-mini",     usdBase: false, min52w: -48600,  max52w: 82400,   minC52w: -58400,  maxC52w: 42600   },
  { pair: "DXY",    label: "USD Index",         usdBase: false, min52w: -62400,  max52w: 48200,   minC52w: -52800,  maxC52w: 64600   },
] as const;

// ── Types exported for the client component ────────────────────────────────────

export interface CotWeek {
  date:          string;
  largeSpecNet:  number;
  commercialNet: number;
  smallSpecNet:  number;
}

export type CotSignal = "strong_bull" | "bull" | "neutral" | "bear" | "strong_bear";

export interface CotEntry {
  pair:           string;
  label:          string;
  usdBase:        boolean; // true = USDJPY/USDCHF/USDCAD — positions inverted for USD-quote framing
  reportDate:     string;
  history:        CotWeek[];  // newest first, up to 8 weeks (display); full history in DB
  cotIndex:       number;     // 0–100 (large spec percentile in 52w range)
  cotIndexC:      number;     // 0–100 (commercial percentile in 52w range)
  signal:         CotSignal;
  wowChange:      number;
  divergenceType: "aligned" | "mixed" | "counter";
  totalWeeks:     number;     // total history available in DB
}

// ── Compute CotEntry from DB rows + 52w window ────────────────────────────────

interface Meta { min52w: number; max52w: number; minC52w: number; maxC52w: number }

function computeEntry(
  pair: string,
  label: string,
  usdBase: boolean,
  history8: CotWeek[],   // 8 most recent weeks (newest first)
  range52:  CotWeek[],   // up to 52 weeks for index calculation
  meta: Meta,
  totalWeeks: number,
): CotEntry {
  const current = history8[0];
  const prev    = history8[1] ?? history8[0];

  // Compute 52w range from actual DB data when available
  const allLS = range52.map((w) => w.largeSpecNet);
  const allC  = range52.map((w) => w.commercialNet);
  const min52w  = allLS.length >= 10 ? Math.min(...allLS) : meta.min52w;
  const max52w  = allLS.length >= 10 ? Math.max(...allLS) : meta.max52w;
  const minC52w = allC.length  >= 10 ? Math.min(...allC)  : meta.minC52w;
  const maxC52w = allC.length  >= 10 ? Math.max(...allC)  : meta.maxC52w;

  const rangeLS = max52w - min52w || 1;
  const rangeC  = maxC52w - minC52w || 1;

  const cotIndex  = Math.round(Math.max(0, Math.min(100, ((current.largeSpecNet  - min52w)  / rangeLS) * 100)));
  const cotIndexC = Math.round(Math.max(0, Math.min(100, ((current.commercialNet - minC52w) / rangeC)  * 100)));

  const wowChange      = current.largeSpecNet - prev.largeSpecNet;
  const lsIncreasing   = wowChange > 0;
  // Commercials go more short (net decreases) when they're hedging against a rising market.
  // "cMoreShort = true" is the bullish confirmation for non-USD-base pairs.
  const cMoreShort     = current.commercialNet < prev.commercialNet;
  const netLong        = current.largeSpecNet > 0;

  // Scale the "mixed" threshold to open interest proxy (avg absolute net across 3 groups)
  const avgAbsNet = (Math.abs(current.largeSpecNet) + Math.abs(current.commercialNet) + Math.abs(current.smallSpecNet)) / 3;
  const mixedThreshold = Math.max(500, avgAbsNet * 0.01); // 1% of avg position size, min 500

  let divergenceType: CotEntry["divergenceType"];
  if (Math.abs(wowChange) < mixedThreshold) divergenceType = "mixed";
  else if (lsIncreasing === cMoreShort)     divergenceType = "aligned";  // both confirming same direction
  else                                      divergenceType = "counter";

  // Signal is based on absolute net direction (long/short) + weekly momentum.
  // COT Index tells you how EXTREME the positioning is within the 52-week range,
  // not whether to be bullish or bearish — that's determined by net direction.
  let signal: CotSignal;
  if      (netLong  && lsIncreasing  && cotIndex >= 65) signal = "strong_bull";
  else if (netLong  && lsIncreasing)                    signal = "bull";
  else if (netLong  && !lsIncreasing && cotIndex >= 70) signal = "neutral";  // distributing from extreme long
  else if (netLong  && !lsIncreasing)                   signal = "bull";     // still net long, just trimming
  else if (!netLong && !lsIncreasing && cotIndex <= 35) signal = "strong_bear";
  else if (!netLong && !lsIncreasing)                   signal = "bear";
  else if (!netLong && lsIncreasing  && cotIndex <= 30) signal = "neutral";  // covering from extreme short
  else if (!netLong && lsIncreasing)                    signal = "bear";     // still net short, just covering
  else                                                  signal = "neutral";

  const reportDate = new Date(current.date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return { pair, label, usdBase, reportDate, history: history8, cotIndex, cotIndexC, signal, wowChange, divergenceType, totalWeeks };
}

// ── Route handler ─────────────────────────────────────────────────────────────

// Revalidate every 30 minutes — the DB is the source of truth, updates weekly
export const revalidate = 1800;

export async function GET(_req: NextRequest) {
  // Plan gate — COT data requires PRO or FUNDED
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { plan: true } }).catch(() => null);
    if (dbUser?.plan === "FREE") {
      return NextResponse.json({ error: "COT Reports require a Pro or Funded Track plan.", upgrade: true }, { status: 403 });
    }
  }

  // Fetch 52 weeks for each instrument from Supabase in parallel
  const dbResults = await Promise.allSettled(
    INSTRUMENTS.map((inst) =>
      prisma.cotReport.findMany({
        where:   { pair: inst.pair },
        orderBy: { reportDate: "desc" },
        take:    52,
        select:  { reportDate: true, largeSpecNet: true, commercialNet: true, smallSpecNet: true },
      })
    )
  );

  // Count total available history per instrument
  const totalCounts = await Promise.allSettled(
    INSTRUMENTS.map((inst) => prisma.cotReport.count({ where: { pair: inst.pair } }))
  );

  const entries: CotEntry[] = INSTRUMENTS.map((inst, i) => {
    const result     = dbResults[i];
    const countResult = totalCounts[i];
    const rows = result.status === "fulfilled" ? result.value : [];
    const totalWeeks = countResult.status === "fulfilled" ? countResult.value : rows.length;

    if (rows.length >= 2) {
      const history8: CotWeek[] = rows.slice(0, 8).map((r) => ({
        date:          r.reportDate.toISOString().split("T")[0],
        largeSpecNet:  r.largeSpecNet,
        commercialNet: r.commercialNet,
        smallSpecNet:  r.smallSpecNet,
      }));
      const range52: CotWeek[] = rows.map((r) => ({
        date:          r.reportDate.toISOString().split("T")[0],
        largeSpecNet:  r.largeSpecNet,
        commercialNet: r.commercialNet,
        smallSpecNet:  r.smallSpecNet,
      }));
      return computeEntry(inst.pair, inst.label, inst.usdBase, history8, range52, inst, totalWeeks);
    }

    // DB is empty for this instrument — this only happens before the seed runs
    return {
      pair:           inst.pair,
      label:          inst.label,
      usdBase:        inst.usdBase,
      reportDate:     "—",
      history:        [],
      cotIndex:       50,
      cotIndexC:      50,
      signal:         "neutral" as CotSignal,
      wowChange:      0,
      divergenceType: "mixed" as const,
      totalWeeks:     0,
    };
  });

  return NextResponse.json(entries);
}
