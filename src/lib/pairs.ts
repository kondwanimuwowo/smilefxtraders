// Shared pair/currency metadata — extracted from pair/[pair]/page.tsx, which
// previously kept its own private copy of this table. Anything that needs to
// decompose a pair symbol into its component currencies (calendar filtering,
// macro currency scoring, etc.) should import from here rather than
// redefining it, so there's exactly one source of truth for how XAUUSD/NAS100
// are treated for currency-exposure purposes.

export interface PairMeta {
  label: string;
  base: string; // e.g. "EUR" for EURUSD
  quote: string; // e.g. "USD"
  currencies: string[]; // for calendar/macro currency filtering
  usdBase: boolean;
}

// NAS100's base ("NAS") is deliberately excluded from `currencies` — it isn't a
// real currency, so NAS100 only contributes USD exposure. XAUUSD's base (XAU)
// IS included — gold is treated as a pseudo-currency with its own exposure.
export const PAIR_META: Record<string, PairMeta> = {
  EURUSD: { label: "Euro FX", base: "EUR", quote: "USD", currencies: ["EUR", "USD"], usdBase: false },
  GBPUSD: { label: "British Pound", base: "GBP", quote: "USD", currencies: ["GBP", "USD"], usdBase: false },
  AUDUSD: { label: "Australian Dollar", base: "AUD", quote: "USD", currencies: ["AUD", "USD"], usdBase: false },
  NZDUSD: { label: "NZ Dollar", base: "NZD", quote: "USD", currencies: ["NZD", "USD"], usdBase: false },
  USDJPY: { label: "Japanese Yen", base: "USD", quote: "JPY", currencies: ["USD", "JPY"], usdBase: true },
  USDCHF: { label: "Swiss Franc", base: "USD", quote: "CHF", currencies: ["USD", "CHF"], usdBase: true },
  USDCAD: { label: "Canadian Dollar", base: "USD", quote: "CAD", currencies: ["USD", "CAD"], usdBase: true },
  XAUUSD: { label: "Gold", base: "XAU", quote: "USD", currencies: ["XAU", "USD"], usdBase: false },
  NAS100: { label: "NASDAQ E-mini", base: "NAS", quote: "USD", currencies: ["USD"], usdBase: false },
  DXY: { label: "USD Index", base: "USD", quote: "", currencies: ["USD"], usdBase: false },
};
