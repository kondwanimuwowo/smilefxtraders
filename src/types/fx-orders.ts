// Shared types for FX Option Expiries feature

export interface FxLevel {
  price:    string;        // "1.1470"
  notional: string;        // "580" or "1.1"
  currency: string;        // "€" | "$" | "£" | "A$" | "NZ$"
  unit:     "m" | "bn";   // million | billion
  large:    boolean;       // bold in source — large/significant expiry
}

export interface FxExpiryDay {
  rowIndex: number;  // 0-based position in the image table (top = 0)
  levels:   Record<string, FxLevel[]>; // key: normalized pair e.g. "EURUSD"
}

export interface FxImageExtraction {
  spotPrices: Record<string, string>; // "EURUSD" → "1.1545"
  days:       FxExpiryDay[];
}

// What the DB record looks like when returned from the API
export interface FxOrderRecord {
  id:         string;
  expiryDate: string; // ISO date string
  pair:       string;
  spotPrice:  string | null;
  levels:     FxLevel[];
  imageUrl:   string | null;
  fetchedAt:  string;
}

// Summary for the list page
export interface FxDateSummary {
  date:       string;   // "YYYY-MM-DD"
  dayName:    string;   // "Tuesday"
  pairCount:  number;
  levelCount: number;
  pairs:      string[]; // actual pairs with data for this date, canonical order
}

// Canonical pairs order for the table grid
export const PAIRS_ORDER = [
  "EURUSD", "USDJPY", "GBPUSD", "USDCHF",
  "USDCAD", "AUDUSD", "NZDUSD", "EURGBP",
] as const;

export type PairKey = typeof PAIRS_ORDER[number];

// Display label for pairs
export const PAIR_LABELS: Record<string, string> = {
  EURUSD: "EUR/USD",
  USDJPY: "USD/JPY",
  GBPUSD: "GBP/USD",
  USDCHF: "USD/CHF",
  USDCAD: "USD/CAD",
  AUDUSD: "AUD/USD",
  NZDUSD: "NZD/USD",
  EURGBP: "EUR/GBP",
};

// Pip size per pair (for proximity detection)
export const PIP_SIZE: Record<string, number> = {
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  AUDUSD: 0.0001,
  NZDUSD: 0.0001,
  USDCHF: 0.0001,
  USDCAD: 0.0001,
  EURGBP: 0.0001,
  USDJPY: 0.01,
  XAUUSD: 0.1,
  NAS100: 1,
};

// Format notional for display: "580m" → "€580m", "1.1bn" → "€1.1bn"
export function fmtNotional(level: FxLevel): string {
  return `${level.currency}${level.notional}${level.unit}`;
}

// Full notional in millions for sorting/filtering
export function notionalInMillions(level: FxLevel): number {
  const n = parseFloat(level.notional);
  return level.unit === "bn" ? n * 1000 : n;
}
