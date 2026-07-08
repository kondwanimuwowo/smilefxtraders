// Thin Finnhub API wrapper — self-throttles because calendar, news, and quote
// calls all share one rate-limit budget on a single API key (see MacroEdge
// plan's "Rate-limit note"). Without this, three independent sync routes would
// each discover the 429 the hard way in production.

const BASE_URL = "https://finnhub.io/api/v1";
const MIN_INTERVAL_MS = 1100; // Finnhub free tier: 60 req/min → stay under 1/sec

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export class FinnhubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "FinnhubError";
  }
}

async function finnhubFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error("FINNHUB_API_KEY is not set");

  await throttle();

  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new FinnhubError(res.status, `Finnhub ${path} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export interface FinnhubCalendarEvent {
  event: string;
  country: string;
  actual: number | null;
  estimate: number | null;
  prev: number | null;
  impact: "low" | "medium" | "high";
  time: string; // "2026-07-08 12:30:00"
  unit?: string;
}

export interface FinnhubCalendarResponse {
  economicCalendar: FinnhubCalendarEvent[];
}

export async function fetchEconomicCalendar(from: string, to: string): Promise<FinnhubCalendarEvent[]> {
  const data = await finnhubFetch<FinnhubCalendarResponse>("/calendar/economic", { from, to });
  return data.economicCalendar ?? [];
}

export interface FinnhubNewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number; // unix seconds
}

export async function fetchGeneralNews(): Promise<FinnhubNewsItem[]> {
  return finnhubFetch<FinnhubNewsItem[]>("/news", { category: "forex" });
}
