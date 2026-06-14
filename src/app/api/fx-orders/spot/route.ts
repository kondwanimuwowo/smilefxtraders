import { NextResponse } from "next/server";
import { PAIRS_ORDER } from "@/types/fx-orders";

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

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const symbols = PAIRS.map((p) => TD_SYMBOL[p]).filter(Boolean).join(",");
    const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);

    if (!res.ok) return NextResponse.json({});

    // Twelve Data returns { "EUR/USD": { price: "1.1234" }, ... }
    const data = (await res.json()) as Record<string, { price?: string; status?: string }>;

    const spots: Record<string, string> = {};
    for (const pair of PAIRS) {
      const tdSym = TD_SYMBOL[pair];
      if (!tdSym) continue;
      const entry = data[tdSym];
      if (!entry || entry.status === "error" || !entry.price) continue;
      spots[pair] = entry.price;
    }

    return NextResponse.json(spots, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" },
    });
  } catch {
    return NextResponse.json({});
  }
}
