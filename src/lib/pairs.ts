// Shared pair/currency metadata — derived from the `instruments` DB table
// (the single source of truth for tradeable symbols) rather than a separate
// hand-maintained record. Anything that needs to decompose a pair symbol into
// its component currencies (calendar filtering, macro currency scoring, pair
// hub, etc.) should call deriveMeta()/deriveMetaMap() against Instrument rows
// rather than re-hardcoding pair metadata.

import type { Instrument } from "@prisma/client";

export interface PairMeta {
  label: string;
  base: string; // e.g. "EUR" for EURUSD
  quote: string; // e.g. "USD"
  currencies: string[]; // for calendar/macro currency filtering
  usdBase: boolean;
}

// NAS100/US500/US30/UK100/GER40's base (their own symbol) is deliberately
// excluded from `currencies` — they aren't real currencies, so an index only
// contributes USD exposure. XAUUSD/XAGUSD's base (XAU/XAG) IS included —
// metals are treated as pseudo-currencies with their own exposure.
//
// DXY is the one genuine exception derivation can't handle: it's the USD
// index itself, not "USD vs something" — base is "USD", not the symbol.
function deriveMeta(instrument: Instrument): PairMeta {
  const { symbol, label, category, cotInverted } = instrument;

  if (symbol === "DXY") {
    return { label, base: "USD", quote: "", currencies: ["USD"], usdBase: false };
  }

  if (category === "commodity") {
    const base = symbol.replace("USD", "");
    return { label, base, quote: "USD", currencies: [base, "USD"], usdBase: false };
  }

  if (category === "index") {
    return { label, base: symbol, quote: "USD", currencies: ["USD"], usdBase: false };
  }

  // forex — standard 6-char base+quote symbol
  const base  = symbol.slice(0, 3);
  const quote = symbol.slice(3, 6);
  return { label, base, quote, currencies: [base, quote], usdBase: cotInverted };
}

export function deriveMetaMap(instruments: Instrument[]): Record<string, PairMeta> {
  const map: Record<string, PairMeta> = {};
  for (const inst of instruments) map[inst.symbol] = deriveMeta(inst);
  return map;
}

// ── Instrument groups ────────────────────────────────────────────────────────
// The one grouping taxonomy for instruments (category + tier), shared by
// /pairs (grid sections) and /cot (filter dropdown) so they never drift.

export type GroupId = "majors" | "minors" | "commodities" | "indices" | "dollar";

export interface InstrumentGroup {
  id:          GroupId;
  label:       string;
  description: string;
  instruments: Instrument[];
}

export function groupInstruments(instruments: Instrument[]): InstrumentGroup[] {
  const dxy    = instruments.filter((i) => i.symbol === "DXY");
  const majors = instruments.filter((i) => i.category === "forex" && i.tier === "major");
  const minors = instruments.filter((i) => i.category === "forex" && i.tier !== "major");
  const commodities = instruments.filter((i) => i.category === "commodity");
  const indices = instruments.filter((i) => i.category === "index" && i.symbol !== "DXY");

  const groups: InstrumentGroup[] = [
    { id: "majors", label: "FX Majors", description: "The most liquid currency pairs, traded during the London and New York sessions", instruments: majors },
    { id: "minors", label: "FX Minors", description: "Cross pairs among major currencies — no direct CFTC contract, so COT bias is derived from each leg's currency positioning", instruments: minors },
    { id: "commodities", label: "Commodities", description: "Metals and energy with a strong correlation to USD flows", instruments: commodities },
    { id: "indices", label: "Indices", description: "Equity indices — some carry a direct CFTC COT contract, others are price-only", instruments: indices },
    { id: "dollar", label: "Dollar Index", description: "The master bias: DXY direction sets the tone for all USD pairs simultaneously", instruments: dxy },
  ];

  return groups.filter((g) => g.instruments.length > 0);
}
