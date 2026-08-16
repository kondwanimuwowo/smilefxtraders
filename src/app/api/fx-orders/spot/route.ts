import { NextResponse } from "next/server";
import { PAIRS_ORDER } from "@/types/fx-orders";
import { getSpotwarePrices } from "@/lib/spotware/snapshot";

// Twelve Data symbol format for each FX pair
const TD_SYMBOL: Record<string, string> = {
  EURUSD: "EUR/USD",
  USDJPY: "USD/JPY",
  GBPUSD: "GBP/USD",
  USDCHF: "USD/CHF",
  USDCAD: "USD/CAD",
  AUDUSD: "AUD/USD",
  NZDUSD: "NZD/USD",
  EURGBP: "EUR/GBP",
};

const PAIRS = PAIRS_ORDER as readonly string[];

/**
 * Matches how the source images quote these pairs, and how Twelve Data's
 * `price` endpoint returns them — JPY crosses to 3dp, everything else to 5dp.
 * The expiry cards compare these against strike levels in pips, so the
 * decimal count has to line up with PIP_SIZE in types/fx-orders.ts.
 */
function formatSpot(pair: string, price: number): string {
  return price.toFixed(pair.endsWith("JPY") ? 3 : 5);
}

// Spot prices for the FX option expiry cards.
//
// Broker ticks first (IC Markets via the SpotwareFeed Durable Object), Twelve
// Data only for whatever's left. Spotware is the better source here for the
// same reason it backs the ticker: real broker bids rather than an aggregated
// consolidated quote, and the expiry cards are measuring distance-to-strike in
// pips, where the two can disagree by enough to move a level in or out of the
// 50-pip alert band.
//
// Twelve Data is not merely a fallback for total failure — it fills per-pair
// gaps too. EURGBP in particular only reaches Spotware if the symbol resolved
// on the broker side, and a cold Durable Object returns nothing at all.
export async function GET() {
  const spots: Record<string, string> = {};

  const spotware = await getSpotwarePrices();
  for (const pair of PAIRS) {
    const price = spotware[pair];
    if (price != null) spots[pair] = formatSpot(pair, price);
  }

  const missing = PAIRS.filter((p) => !(p in spots) && TD_SYMBOL[p]);
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!missing.length || !apiKey) {
    return NextResponse.json(spots, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" },
    });
  }

  try {
    const symbols = missing.map((p) => TD_SYMBOL[p]).join(",");
    const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);

    if (!res.ok) return NextResponse.json(spots);

    // Twelve Data returns { "EUR/USD": { price: "1.1234" }, ... } for a
    // multi-symbol request, but unwraps to a bare { price } for a single one.
    const body = (await res.json()) as Record<string, unknown>;
    const data: Record<string, { price?: string; status?: string }> =
      missing.length === 1
        ? { [TD_SYMBOL[missing[0]]]: body as { price?: string; status?: string } }
        : (body as Record<string, { price?: string; status?: string }>);

    for (const pair of missing) {
      const entry = data[TD_SYMBOL[pair]];
      if (!entry || entry.status === "error" || !entry.price) continue;
      spots[pair] = entry.price;
    }

    return NextResponse.json(spots, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" },
    });
  } catch {
    return NextResponse.json(spots);
  }
}
