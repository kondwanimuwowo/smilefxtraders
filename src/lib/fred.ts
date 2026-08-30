// FRED (Federal Reserve Economic Data) API wrapper. Requires a free
// FRED_API_KEY (register at fred.stlouisfed.org/docs/api/api_key.html) — as
// of Phase 2 this key is NOT yet in .env/.env.local (only Finnhub was
// confirmed available). fetchFredSeries throws a clear, typed error when the
// key is missing so callers (the indicators sync route) can skip FRED
// gracefully and keep syncing World Bank data, exactly like the Finnhub
// calendar-tier fallback in Phase 1 — see FredNotConfiguredError below.
//
// Series IDs are FRED's own catalog. Only US (FEDFUNDS, CPIAUCSL, etc.) have
// been used in this codebase before via other integrations' docs comments —
// the non-US series below (Euro area, UK, NZ) come from FRED's mirrored
// OECD Main Economic Indicators dataset and have NOT been spike-tested
// against a live key (none available yet). Verify/correct once a real
// FRED_API_KEY is added — a wrong series ID fails loudly (FRED returns an
// error for an unknown series id) rather than silently, so this is safe to
// ship and self-corrects on first real sync attempt.

const BASE_URL = "https://api.stlouisfed.org/fred/series/observations";

export class FredNotConfiguredError extends Error {
  constructor() {
    super("FRED_API_KEY is not set");
    this.name = "FredNotConfiguredError";
  }
}

export interface FredObservation {
  date: string; // "2026-06-01"
  value: string; // FRED returns numbers as strings; "." means missing
}

export async function fetchFredSeries(seriesId: string, limit = 6): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new FredNotConfiguredError();

  const url = new URL(BASE_URL);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`FRED ${seriesId} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { observations: FredObservation[] };
    return data.observations ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

export function latestValidObservation(obs: FredObservation[]): FredObservation | null {
  return obs.find((o) => o.value !== ".") ?? null;
}

// Rule engine's "level" fallback (rules.ts) needs at least two periods to
// compute a trend — mirrors recentNonNull in worldbank.ts. `obs` is already
// sorted desc (sort_order=desc in fetchFredSeries), so this is just a filter
// + slice, seeding real period-over-period data immediately instead of
// waiting for the next release.
export function recentValidObservations(obs: FredObservation[], count = 3): FredObservation[] {
  return obs.filter((o) => o.value !== ".").slice(0, count);
}

// FRED series per currency/indicator. US series are FRED's native catalog
// (well-established, stable IDs). EUR/GBP/NZD series are FRED's mirror of
// OECD's Main Economic Indicators — unverified against a live key, see the
// file-level note above.
// 2026-08-24: CPI/EMPLOYMENT/INTEREST_RATE entries below were added after
// live-verifying each series's title, frequency and latest observation date
// against the FRED API directly (not assumed from the ID). Three currencies
// previously had no live source for these at all and fell back to World
// Bank's annual data — see confidence.ts for why that matters beyond "old".
//
// Two gaps remain with no live FRED substitute found: GBP CPI and NZD CPI.
// Every OECD-mirror candidate tried for both stopped updating in FRED over a
// year ago. World Bank annual remains the only automated source for those
// two until a national statistics API (ONS, Stats NZ) is wired in, or a
// human enters the release by hand via DataSource.MANUAL.
//
// 2026-08-31: JPY/CHF/CAD/AUD added, live-verified the same way. All four
// hit the identical CPI problem GBP/NZD already have — every OECD-mirror CPI
// series tried (level and YoY-growth variants) for all four currencies
// stopped updating in FRED in 2022-2025 — so CPI for these four is World
// Bank annual / manual entry only, same fallback path as GBP/NZD. CHF has no
// live monthly unemployment series either; its quarterly one
// (LRHUTTTTCHQ156S) is genuinely quarterly at the source, not stale — same
// treatment as NZD's quarterly employment series above.
export const FRED_SERIES: Record<string, Partial<Record<string, string>>> = {
  USD: {
    INTEREST_RATE: "FEDFUNDS", // Effective Federal Funds Rate
    BOND_YIELD_10Y: "DGS10", // 10-Year Treasury Constant Maturity Rate
    CPI: "CPILFESL", // CPI, All Items Less Food & Energy (core) — the Fed's own
    // decisions lean on core PCE (PCEPILFE) more than this, but the platform
    // has one generic "CPI" slot shared across all four currencies, and core
    // CPI is the closer match to what EUR/GBP/NZD's own CPI slots represent.
    EMPLOYMENT: "UNRATE", // Unemployment Rate — replaces the World Bank annual figure
    RETAIL_SALES: "RSAFS", // Advance Retail Sales: Retail and Food Services
    CONSUMER_CONFIDENCE: "UMCSENT", // U. Michigan Consumer Sentiment
  },
  EUR: {
    INTEREST_RATE: "ECBDFR", // ECB Deposit Facility Rate — replaces ECBMRRFR, which had
    // gone stale; this is the rate the ECB itself has been steering with.
    BOND_YIELD_10Y: "IRLTLT01EZM156N", // Long-term interest rate, Euro area (OECD MEI) — unverified
    CPI: "CP0000EZ19M086NEST", // HICP, headline (all items) — not core. No live core-HICP
    // series was found on FRED for the euro area; this is headline pending one.
  },
  GBP: {
    INTEREST_RATE: "IUDSOIA", // SONIA (Sterling Overnight Index Average) — an interbank
    // proxy for Bank Rate, not the Bank Rate itself, but daily and current
    // where no direct Bank Rate series was found live on FRED.
    BOND_YIELD_10Y: "IRLTLT01GBM156N", // Long-term interest rate, UK (OECD MEI) — unverified
    EMPLOYMENT: "LRHUTTTTGBM156S", // Monthly unemployment rate, 15+
  },
  NZD: {
    INTEREST_RATE: "IR3TIB01NZM156N", // 3-month interbank rate — a proxy for the RBNZ's OCR,
    // not the OCR itself, but monthly and current where no direct policy-rate
    // series was found live on FRED.
    BOND_YIELD_10Y: "IRLTLT01NZM156N", // Long-term interest rate, NZ (OECD MEI) — unverified
    EMPLOYMENT: "LRHUTTTTNZQ156S", // Quarterly unemployment rate, 15+ — genuinely quarterly
    // at the source (Stats NZ), not a stale monthly feed. See confidence.ts's
    // classifyLevel for why that is scored as "usable", not penalized.
  },
  JPY: {
    INTEREST_RATE: "IR3TIB01JPM156N", // 3-month interbank rate — a proxy for the BOJ's policy
    // rate, live-verified 2026-05-01.
    BOND_YIELD_10Y: "IRLTLT01JPM156N", // Long-term interest rate, Japan (OECD MEI) — verified live
    EMPLOYMENT: "LRHUTTTTJPM156S", // Monthly unemployment rate, 15+ — verified live
    // No CPI: every candidate (JPNCPIALLMINMEI, CPALTT01JPM659N) stopped
    // updating in FRED in 2022. World Bank annual / manual entry only.
  },
  CHF: {
    INTEREST_RATE: "IR3TIB01CHM156N", // 3-month interbank rate — a proxy for the SNB's policy
    // rate, live-verified.
    BOND_YIELD_10Y: "IRLTLT01CHM156N", // Long-term interest rate, Switzerland (OECD MEI) — verified live
    EMPLOYMENT: "LRHUTTTTCHQ156S", // Quarterly unemployment rate, 15+ — genuinely quarterly
    // at the source, not a stale monthly feed (no live monthly series exists
    // for Switzerland in this FRED family).
    // No CPI: every candidate stopped updating in 2025. World Bank annual /
    // manual entry only.
  },
  CAD: {
    INTEREST_RATE: "IR3TIB01CAM156N", // 3-month interbank rate — a proxy for the BoC's policy
    // rate, live-verified.
    BOND_YIELD_10Y: "IRLTLT01CAM156N", // Long-term interest rate, Canada (OECD MEI) — verified live
    EMPLOYMENT: "LRHUTTTTCAM156S", // Monthly unemployment rate, 15+ — verified live
    // No CPI: every candidate stopped updating in 2025. World Bank annual /
    // manual entry only.
  },
  AUD: {
    INTEREST_RATE: "IR3TIB01AUM156N", // 3-month interbank rate — a proxy for the RBA's cash
    // rate, live-verified.
    BOND_YIELD_10Y: "IRLTLT01AUM156N", // Long-term interest rate, Australia (OECD MEI) — verified live
    EMPLOYMENT: "LRHUTTTTAUM156S", // Monthly unemployment rate, 15+ — verified live
    // No CPI: every candidate (quarterly, the source's real cadence) stopped
    // updating in 2025. World Bank annual / manual entry only.
  },
};
