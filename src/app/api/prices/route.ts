import { NextResponse } from "next/server";

// Twelve Data symbol → display name mapping
const TD_SYMBOLS = ["EUR/USD", "GBP/USD", "NZD/USD", "XAU/USD", "IXIC", "DXY"] as const;
const DISPLAY: Record<string, string> = {
  "EUR/USD": "EURUSD",
  "GBP/USD": "GBPUSD",
  "NZD/USD": "NZDUSD",
  "XAU/USD": "XAUUSD",
  "IXIC":    "NAS100",
  "DXY":     "DXY",
};

export interface PriceTick {
  sym:   string;
  price: string;
  chg:   number; // daily % change
}

const FALLBACK: PriceTick[] = [
  { sym: "EURUSD", price: "1.08642", chg: +0.34 },
  { sym: "GBPUSD", price: "1.27310", chg: -0.18 },
  { sym: "NZDUSD", price: "0.61245", chg: +0.52 },
  { sym: "XAUUSD", price: "2338.40", chg: +0.91 },
  { sym: "NAS100", price: "18742.5", chg: -0.27 },
  { sym: "DXY",    price: "104.27",  chg: -0.21 },
];

function formatPrice(price: number, sym: string): string {
  if (sym === "IXIC" || price > 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (price > 10)  return price.toFixed(2);
  return price.toFixed(5);
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return NextResponse.json(FALLBACK);

  try {
    const symbols = TD_SYMBOLS.join(",");
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);

    if (!res.ok) return NextResponse.json(FALLBACK);
    const data = (await res.json()) as Record<string, Record<string, string>>;

    const ticks: PriceTick[] = TD_SYMBOLS.flatMap((sym) => {
      const q = data[sym];
      if (!q || q.status === "error" || !q.close) return [];
      const price = parseFloat(q.close);
      const chg   = parseFloat(q.percent_change ?? "0");
      if (isNaN(price)) return [];
      return [{ sym: DISPLAY[sym] ?? sym, price: formatPrice(price, sym), chg: Math.round(chg * 100) / 100 }];
    });

    return NextResponse.json(ticks.length >= 3 ? ticks : FALLBACK, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
