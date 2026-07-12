// Shared COT types — single source of truth for API routes and client components.
//
// Sign convention: nets in `cot_reports` are stored PAIR-FRAMED. USD-base pairs
// (USDJPY/USDCHF/USDCAD, instruments.cotInverted = true) have their nets
// multiplied by −1 at write time (seed + sync), so positive net = bullish on
// the displayed pair for every instrument. Long/short columns stay raw
// (contract framing). Consumers must never re-invert.

export type CotSignal = "strong_bull" | "bull" | "neutral" | "bear" | "strong_bear";

export type CotDivergence = "aligned" | "mixed" | "counter";

export interface CotWeek {
  date:           string;
  largeSpecNet:   number;
  commercialNet:  number;
  smallSpecNet:   number;
  // Gross large-spec sides in RAW contract framing (see convention above) —
  // feeds the commentary engine's 6-week positioning-pattern analysis
  largeSpecLong:  number | null;
  largeSpecShort: number | null;
}

export interface CotEntry {
  pair:           string;
  label:          string;
  usdBase:        boolean; // true = USDJPY/USDCHF/USDCAD — nets inverted at write time
  reportDate:     string;
  history:        CotWeek[];  // newest first, up to 8 weeks (display); full history in DB
  cotIndex:       number;     // 0–100 (large spec percentile within the 3yr/156w range)
  cotIndexC:      number;     // 0–100 (commercial percentile within the 3yr/156w range)
  cotIndex52w:    number | null; // 0–100 within the 1-year window (null when <52w history)
  cotIndexAll:    number | null; // 0–100 within the FULL stored history
  signal:         CotSignal;
  wowChange:      number;
  divergenceType: CotDivergence;
  totalWeeks:     number;         // total history available in DB
  openInterest:   number | null;  // latest week's total contracts outstanding
  synthetic?:     boolean;        // true = derived from the pair's two legs, not a direct CFTC contract
}

export interface CotDetailRow {
  date:            string;
  largeSpecLong:   number | null;
  largeSpecShort:  number | null;
  largeSpecNet:    number;
  commercialLong:  number | null;
  commercialShort: number | null;
  commercialNet:   number;
  smallSpecLong:   number | null;
  smallSpecShort:  number | null;
  smallSpecNet:    number;
  openInterest:    number | null;
  cotIndex3yr:     number | null; // rolling 3yr percentile as of THIS week (null when <26w of trailing history)
}

export interface CotDetailResponse {
  pair:           string;
  label:          string;
  usdBase:        boolean;
  rows:           CotDetailRow[];
  totalWeeks:     number;
  // Current signal — computed from the most recent rows
  signal:         CotSignal;
  cotIndex:       number;
  cotIndexC:      number;
  cotIndexAll:    number | null; // percentile within the FULL stored history
  wowChange:      number;
  reportDate:     string;
  divergenceType: CotDivergence;
  synthetic?:     boolean; // true = derived from the pair's two legs, not a direct CFTC contract
}
