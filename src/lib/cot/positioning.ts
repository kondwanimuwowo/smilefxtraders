// Positioning flags on top of the COT signal. The signal follows the large
// speculators; these say when following them is risky.
//
//   crowding:  specs hold an outsized share of open interest, or sit at an
//              extreme of their 3-year range. A crowded side unwinds fast.
//   vsPrice:   specs added to a position while price moved against it over
//              the same 13 weeks. They are losing, and a loser can squeeze.
//
// Example that motivated this (13 Nov 2026): USDJPY read strong_bear with
// specs net long yen at 27% of OI after adding ~148k contracts in 13 weeks,
// while USDJPY rose from 156 to 160. The signal said "follow the shorts";
// the positioning said the shorts were crowded and underwater.

import { getCandles } from "@/lib/spotware/candles";

const CROWDED_PCT_OF_OI = 0.25;
const CROWDED_INDEX_LOW = 10;
const CROWDED_INDEX_HIGH = 90;
/** Ignore small 13-week drifts in either series. */
const MIN_PRICE_MOVE_PCT = 1;
const MIN_SPEC_CHANGE_PCT_OF_OI = 0.05;

export interface CotPositioning {
  crowding: { side: "long" | "short"; pctOfOi: number | null; reason: "share_of_oi" | "range_extreme" } | null;
  vsPrice:  { priceChangePct: number; specChange13w: number } | null;
}

export function assessCrowding(
  largeSpecNet: number,
  openInterest: number | null,
  cotIndex: number,
): CotPositioning["crowding"] {
  const side = largeSpecNet >= 0 ? "long" : "short";
  const pct = openInterest && openInterest > 0 ? largeSpecNet / openInterest : null;
  if (pct != null && Math.abs(pct) >= CROWDED_PCT_OF_OI) return { side, pctOfOi: pct, reason: "share_of_oi" };
  if ((side === "long" && cotIndex >= CROWDED_INDEX_HIGH) || (side === "short" && cotIndex <= CROWDED_INDEX_LOW)) {
    return { side, pctOfOi: pct, reason: "range_extreme" };
  }
  return null;
}

/** Specs grew a position over 13 weeks while price moved the other way. Nets are pair-framed. */
export function assessVsPrice(
  change13w: number | null,
  openInterest: number | null,
  priceChangePct: number | null,
): CotPositioning["vsPrice"] {
  if (change13w == null || priceChangePct == null) return null;
  if (Math.abs(priceChangePct) < MIN_PRICE_MOVE_PCT) return null;
  if (openInterest && Math.abs(change13w) / openInterest < MIN_SPEC_CHANGE_PCT_OF_OI) return null;
  const fighting = (change13w > 0 && priceChangePct < 0) || (change13w < 0 && priceChangePct > 0);
  return fighting ? { priceChangePct, specChange13w: change13w } : null;
}

/** Close-to-close % change over the 13 weeks ending at the report date, from broker weekly bars. */
export async function priceChange13w(pair: string, reportDate: string): Promise<number | null> {
  const end = new Date(`${reportDate}T23:59:59Z`);
  const from = new Date(end.getTime() - 16 * 7 * 86_400_000);
  try {
    const { bars } = await getCandles({ symbol: pair, period: "D1", from, to: end });
    if (bars.length < 40) return null;
    const last = bars.at(-1)!;
    const target = last.time - 91 * 86_400;
    const start = bars.reduce((best, b) => (Math.abs(b.time - target) < Math.abs(best.time - target) ? b : best));
    return ((last.c - start.c) / start.c) * 100;
  } catch {
    // No broker feed (e.g. `next dev` without wrangler): the flag is optional.
    return null;
  }
}

export async function getCotPositioning(args: {
  pair: string;
  reportDate: string;
  largeSpecNet: number;
  openInterest: number | null;
  cotIndex: number;
  change13w: number | null;
}): Promise<CotPositioning> {
  const crowding = assessCrowding(args.largeSpecNet, args.openInterest, args.cotIndex);
  const pricePct = args.change13w == null ? null : await priceChange13w(args.pair, args.reportDate);
  return { crowding, vsPrice: assessVsPrice(args.change13w, args.openInterest, pricePct) };
}
