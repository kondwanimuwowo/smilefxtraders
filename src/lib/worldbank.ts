// World Bank Open Data API — no API key required (public REST API). Response
// shape verified live: GET https://api.worldbank.org/v2/country/{code}/indicator/{id}?format=json
// returns a 2-element array: [pagination metadata, data rows[]]. Rows are
// ordered most-recent-year first but often have `value: null` for the most
// recent 1-2 years (not yet published) — callers should take the first row
// with a non-null value, not just rows[0].

const BASE_URL = "https://api.worldbank.org/v2";

export interface WorldBankRow {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string; // year, e.g. "2024"
  value: number | null;
  unit: string;
}

type WorldBankResponse = [unknown, WorldBankRow[] | null];

export async function fetchWorldBankIndicator(
  countryCode: string,
  indicatorId: string,
): Promise<WorldBankRow[]> {
  const url = `${BASE_URL}/country/${countryCode}/indicator/${indicatorId}?format=json&per_page=10`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`World Bank ${indicatorId}/${countryCode} → HTTP ${res.status}`);
    }
    const data = (await res.json()) as WorldBankResponse;
    return data[1] ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

export function latestNonNull(rows: WorldBankRow[]): WorldBankRow | null {
  return rows.find((r) => r.value !== null) ?? null;
}

// Rule engine's "level" fallback (rules.ts) needs at least two periods to
// compute a trend — a single latest snapshot can't do that. Returns up to
// `count` most recent non-null rows so the sync route can seed real
// year-over-year comparison data immediately, rather than waiting a full
// year for the second data point to accumulate naturally.
export function recentNonNull(rows: WorldBankRow[], count = 3): WorldBankRow[] {
  return rows.filter((r) => r.value !== null).slice(0, count);
}

// World Bank's aggregate/ISO2 codes for the currencies MacroEdge tracks.
// EMU = "Euro area" aggregate (matches ECB's currency bloc reasonably well
// for macro purposes — not a perfect substitute for a single "EUR country"
// since none exists, but this is the World Bank's own standard aggregate).
export const WORLD_BANK_COUNTRY_CODE: Record<string, string> = {
  USD: "US",
  EUR: "EMU",
  GBP: "GB",
  NZD: "NZ",
};

// Indicators World Bank publishes annually that map onto our IndicatorType
// taxonomy. World Bank has no interest-rate, PMI, consumer-confidence, or
// calendar-driven series — those stay FRED/Finnhub-only. This set is
// deliberately the annual/slow-moving subset the plan calls out as safe to
// fold into the existing sync/table pattern rather than a parallel schema.
export const WORLD_BANK_INDICATORS: Partial<Record<string, string>> = {
  GDP: "NY.GDP.MKTP.KD.ZG", // GDP growth (annual %) — verified live
  CPI: "FP.CPI.TOTL.ZG", // Inflation, consumer prices (annual %) — verified live
  EMPLOYMENT: "SL.UEM.TOTL.ZS", // Unemployment, total (% of labor force) — verified live
  TRADE_BALANCE: "BN.CAB.XOKA.GD.ZS", // Current account balance (% of GDP), used as a trade-balance proxy — verified live
};
