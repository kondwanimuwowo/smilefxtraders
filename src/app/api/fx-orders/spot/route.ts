import { NextResponse } from "next/server";
import { PAIRS_ORDER } from "@/types/fx-orders";
import { getSpotwarePrices } from "@/lib/spotware/snapshot";
import { createClient, getAuthedUser } from "@/lib/supabase/server";

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
/**
 * Per-pair provenance on `X-Spot-Source`, e.g.
 * `spotware=EURUSD,USDJPY; twelvedata=EURGBP`.
 *
 * The two sources agree to within a pip or so, which makes the response body
 * alone useless for telling them apart — both when verifying the feed by hand
 * and, more importantly, when the broker connection quietly degrades to Twelve
 * Data in production. A header keeps that visible without changing the JSON
 * the page consumes.
 */
function respond(spots: Record<string, string>, fromSpotware: Set<string>) {
  const spotware = Object.keys(spots).filter((p) => fromSpotware.has(p));
  const twelvedata = Object.keys(spots).filter((p) => !fromSpotware.has(p));
  const parts: string[] = [];
  if (spotware.length) parts.push(`spotware=${spotware.join(",")}`);
  if (twelvedata.length) parts.push(`twelvedata=${twelvedata.join(",")}`);

  // `private`, not `public`: the payload is identical for every user, but the
  // route is now behind auth, and a shared cache holding a 200 would happily
  // replay it to a caller who never authenticated — defeating the gate. The
  // browser-level 30s still absorbs a page's repeat polls, which is where most
  // of the Twelve Data savings were anyway.
  return NextResponse.json(spots, {
    headers: {
      "Cache-Control":  "private, max-age=30",
      "X-Spot-Source":  parts.join("; ") || "none",
    },
  });
}

export async function GET() {
  // The proxy leaves /api public, so this route enforces its own access (same
  // reasoning as lib/plan-guard.ts). No plan check — FX expiries are not a
  // paid feature — but anonymous callers were spending Twelve Data credits
  // and reading the broker feed's health off X-Spot-Source.
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const spots: Record<string, string> = {};
  const fromSpotware = new Set<string>();

  const spotware = await getSpotwarePrices();
  for (const pair of PAIRS) {
    const price = spotware[pair];
    if (price != null) {
      spots[pair] = formatSpot(pair, price);
      fromSpotware.add(pair);
    }
  }

  const missing = PAIRS.filter((p) => !(p in spots) && TD_SYMBOL[p]);
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!missing.length || !apiKey) return respond(spots, fromSpotware);

  try {
    const symbols = missing.map((p) => TD_SYMBOL[p]).join(",");
    const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);

    if (!res.ok) return respond(spots, fromSpotware);

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

    return respond(spots, fromSpotware);
  } catch {
    return respond(spots, fromSpotware);
  }
}
