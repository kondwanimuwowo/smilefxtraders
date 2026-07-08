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
export const FRED_SERIES: Record<string, Partial<Record<string, string>>> = {
  USD: {
    INTEREST_RATE: "FEDFUNDS", // Effective Federal Funds Rate
    BOND_YIELD_10Y: "DGS10", // 10-Year Treasury Constant Maturity Rate
    RETAIL_SALES: "RSAFS", // Advance Retail Sales: Retail and Food Services
    CONSUMER_CONFIDENCE: "UMCSENT", // U. Michigan Consumer Sentiment
  },
  EUR: {
    INTEREST_RATE: "ECBMRRFR", // ECB Main Refinancing Operations Rate — unverified series id
    BOND_YIELD_10Y: "IRLTLT01EZM156N", // Long-term interest rate, Euro area (OECD MEI) — unverified
  },
  GBP: {
    BOND_YIELD_10Y: "IRLTLT01GBM156N", // Long-term interest rate, UK (OECD MEI) — unverified
  },
  NZD: {
    BOND_YIELD_10Y: "IRLTLT01NZM156N", // Long-term interest rate, NZ (OECD MEI) — unverified
  },
};
