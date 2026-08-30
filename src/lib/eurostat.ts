// Eurostat dissemination API — no API key required. Fills the one FRED-dead
// series in MacroEdge's tracked set: EUR employment. FRED's OECD-mirrored
// euro-area unemployment series runs months behind the domestic release (see
// confidence.ts's calibration note), so Eurostat's own une_rt_m dataset
// (monthly, seasonally-adjusted unemployment rate) is used directly instead.
//
// GBP CPI and NZD CPI stay manual-entry-only: ONS's new beta API only
// exposes CPIH (a different measure from the CPI the BoE targets, not a
// substitute), and Stats NZ's API returned 502 on every endpoint tried.
//
// Response is JSON-stat 2.0. With every non-time dimension pinned to a single
// value (see query below), `size` collapses to [1,1,1,1,1,1,N] and the flat
// `value` object's keys equal the time dimension's own index — no multi-
// dimensional index math needed. `value` is sparse: the most recent 0-2
// months are typically unpublished and simply absent as keys.

const BASE_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

// EA21 = current euro-area aggregate (as of the 2026 enlargement to 21
// members). Verified live — EA20 (the prior member count) returns an empty
// dataset now that Eurostat has rolled the code forward.
const EUROSTAT_GEO = "EA21";

interface EurostatResponse {
  dimension: {
    time: { category: { index: Record<string, number> } };
  };
  value: Record<string, number>;
}

export interface EurostatObservation {
  period: string; // "YYYY-MM"
  value: number;
}

export async function fetchEurostatUnemploymentRate(sinceYear: number): Promise<EurostatObservation[]> {
  const url =
    `${BASE_URL}/une_rt_m?format=JSON&geo=${EUROSTAT_GEO}&s_adj=SA&sex=T&age=TOTAL` +
    `&unit=PC_ACT&sinceTimePeriod=${sinceYear}-01`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Eurostat une_rt_m → HTTP ${res.status}`);
    }
    const data = (await res.json()) as EurostatResponse;
    const index = data.dimension.time.category.index;

    return Object.entries(index)
      .map(([period, idx]) => ({ period, value: data.value[String(idx)] }))
      .filter((row): row is EurostatObservation => row.value !== undefined)
      .sort((a, b) => (a.period < b.period ? 1 : -1)); // most recent first
  } finally {
    clearTimeout(timeout);
  }
}

export function recentEurostatObservations(rows: EurostatObservation[], count = 3): EurostatObservation[] {
  return rows.slice(0, count);
}
