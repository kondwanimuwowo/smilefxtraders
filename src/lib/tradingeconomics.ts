// tradingeconomics.com — plain fetch() + deterministic regex parsing, no
// headless browser needed. Verified live 2026-09-01: unlike ForexFactory,
// every page used here (calendar, per-country indicators, bonds) is
// server-rendered — the real event/indicator data is present in the raw
// HTML response, not injected by client-side JS. That means no Cloudflare
// Browser Run dependency and, more importantly, no LLM extraction step:
// parsing is plain code against real markup, so there is nothing here that
// can hallucinate the way an AI "read this page and tell me what's on it"
// pass can (see the interest-rate seed's header note from earlier this
// session, where exactly that happened on a different source).
//
// investing.com was also considered and rejected — it sits behind a real
// Cloudflare bot-challenge ("Just a moment..."), and that is not something
// to route around, by headless browser or otherwise.
import { IndicatorType } from "@/generated/prisma/client";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: controller.signal });
    if (!res.ok) throw new Error(`tradingeconomics ${url} → HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

// Verified live against tradingeconomics.com/{slug}/indicators,
// /{slug}/calendar, and /bonds for every one of these eight — see the
// session notes for the exact values cross-checked against
// worldgovernmentbonds.com and ForexFactory.
export const TE_COUNTRY_SLUG: Record<string, string> = {
  USD: "united-states",
  EUR: "euro-area", // has its own genuine aggregate entry, not a Germany substitute
  GBP: "united-kingdom",
  NZD: "new-zealand",
  JPY: "japan",
  CHF: "switzerland",
  CAD: "canada",
  AUD: "australia",
};

// TE's calendar rows carry a clean, already-categorized `data-category`
// attribute (e.g. data-category="inflation rate") rather than only a
// free-text title — more reliable than the keyword-matching
// mapEventTitleToIndicator() this project uses for Finnhub, so this maps
// straight from that category string instead of duplicating a fuzzy regex
// pass. Keys are lowercased to match how TE renders the attribute.
const TE_CATEGORY_TO_INDICATOR: Record<string, IndicatorType> = {
  "interest rate": IndicatorType.INTEREST_RATE,
  "inflation rate": IndicatorType.CPI,
  "inflation rate mom": IndicatorType.CPI,
  "gdp growth rate": IndicatorType.GDP,
  "gdp growth": IndicatorType.GDP,
  "unemployment rate": IndicatorType.EMPLOYMENT,
  "retail sales mom": IndicatorType.RETAIL_SALES,
  "retail sales yoy": IndicatorType.RETAIL_SALES,
  "manufacturing pmi": IndicatorType.MANUFACTURING_PMI,
  "consumer confidence": IndicatorType.CONSUMER_CONFIDENCE,
  "balance of trade": IndicatorType.TRADE_BALANCE,
  "government bond 10y": IndicatorType.BOND_YIELD_10Y,
};

export function mapTECategoryToIndicator(category: string): IndicatorType | null {
  return TE_CATEGORY_TO_INDICATOR[category.trim().toLowerCase()] ?? null;
}

// ── Bond yields (tradingeconomics.com/bonds) ────────────────────────────
//
// One shared page for every country. Each row links to
// /{country-slug}/government-bond-yield — a stable, predictable URL, unlike
// the ticker-style data-symbol codes (USGG10YR, GEBR10Y, ...) also present
// on the page, which aren't derivable from a currency code and would need
// their own hand-verified map. Matching on the URL reuses the same
// TE_COUNTRY_SLUG map as everything else here.
export async function fetchTEBondYields(): Promise<Record<string, number>> {
  const html = await fetchText("https://tradingeconomics.com/bonds");
  const out: Record<string, number> = {};
  for (const [currency, slug] of Object.entries(TE_COUNTRY_SLUG)) {
    const marker = `/${slug}/government-bond-yield`;
    const i = html.indexOf(marker);
    if (i === -1) continue;
    const window = html.slice(i, i + 600);
    const m = window.match(/>\s*(-?\d+\.\d+)\s*</);
    if (m) out[currency] = Number.parseFloat(m[1]);
  }
  return out;
}

// ── Country indicator levels (tradingeconomics.com/{slug}/indicators) ───
//
// One row per indicator category: <a ...>Label</a></td><td>current</td>
// <td>previous</td>. This is level data (current vs. prior reading), the
// same shape FRED/World Bank snapshots already are — no forecast exists
// here, since this page shows the latest published value, not a scheduled
// release. Feeds MacroIndicatorSnapshot the same way FRED does.
export interface TEIndicatorLevel {
  indicatorType: IndicatorType;
  current: number;
  previous: number;
}

export async function fetchTEIndicatorLevels(currency: string): Promise<TEIndicatorLevel[]> {
  const slug = TE_COUNTRY_SLUG[currency];
  if (!slug) return [];
  const html = await fetchText(`https://tradingeconomics.com/${slug}/indicators`);

  // Row shape (verified live): a table row whose first cell is an <a> with
  // the indicator label, immediately followed by two plain <td> cells
  // (current, previous). The nav menu earlier in the page reuses the same
  // label text without this row shape, so matching the row pattern itself
  // (not just the label) avoids picking up nav links.
  const rowPattern = /<a[^>]*>\s*([A-Za-z0-9 /%.&'-]+?)\s*<\/a>\s*<\/td>\s*<td>\s*(-?[\d,]+\.?\d*)\s*<\/td>\s*<td>\s*(-?[\d,]+\.?\d*)\s*<\/td>/g;

  const out: TEIndicatorLevel[] = [];
  const seen = new Set<IndicatorType>();
  for (const m of html.matchAll(rowPattern)) {
    const label = m[1].trim();
    const indicatorType = mapTECategoryToIndicator(label);
    if (!indicatorType || seen.has(indicatorType)) continue; // first (most specific) match wins
    const current = Number.parseFloat(m[2].replace(/,/g, ""));
    const previous = Number.parseFloat(m[3].replace(/,/g, ""));
    if (!Number.isFinite(current) || !Number.isFinite(previous)) continue;
    out.push({ indicatorType, current, previous });
    seen.add(indicatorType);
  }
  return out;
}

// ── Calendar events (tradingeconomics.com/{slug}/calendar) ──────────────
//
// Each row is a <tr data-id="..." data-country="..." data-category="..."
// data-event="..."> carrying real machine-readable attributes, plus nested
// <span id='actual'>/<span id='previous'>/<a id='consensus'> cells. TE's
// own "Consensus" column is what's mapped to our `forecast` field — it is
// the market's expected value for the release, the same concept
// ForexFactory's "Forecast" column represents.
export interface TECalendarEvent {
  externalId: string; // "te:<data-id>" — TE's own id, stable across re-fetches
  indicatorType: IndicatorType;
  title: string;
  eventTime: Date;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

// Row start only — NOT a full row-to-</tr> match. Each row embeds its own
// nested <table><tr>...</tr></table> for the flag/country-code mini-table,
// so a non-greedy match to the nearest </tr> stops at that INNER close tag
// and truncates before the title/actual/forecast content that follows it.
// Regex can't reliably match balanced/nested tags, so instead of trying,
// this only anchors the row's start and a fixed-size window after it is
// sliced out to search within (ROW_WINDOW_CHARS below) — verified live
// against a real captured page that this window comfortably covers a full
// row's content.
const ROW_START_RE = /<tr data-url="([^"]*)" data-id="(\d+)" data-country="([^"]*)" data-category="([^"]*)" data-event="([^"]*)"[^>]*>/g;
// Measured live 2026-09-01: the consensus field can sit ~2050 chars into a
// row (the chart-thumbnail <div> and its data-src cloudfront URL push it
// past the row's earlier fields), which silently dropped every forecast
// value when this was 2000. Widened with headroom rather than tuned to the
// exact measured offset.
const ROW_WINDOW_CHARS = 3000;
const DATE_RE = /class='\s*(\d{4}-\d{2}-\d{2})'/;
const TIME_RE = /(\d{1,2}:\d{2}\s*(?:AM|PM))/;
const TITLE_RE = /class='calendar-event' href='[^']*'>([^<]+)</;
const ACTUAL_RE = /id='actual'>([^<]*)</;
const PREVIOUS_RE = /id='previous'>([^<]*)</;
const CONSENSUS_RE = /id='consensus'[^>]*>([^<]*)</;

export async function fetchTECalendarEvents(currency: string): Promise<TECalendarEvent[]> {
  const slug = TE_COUNTRY_SLUG[currency];
  if (!slug) return [];
  const html = await fetchText(`https://tradingeconomics.com/${slug}/calendar`);

  const out: TECalendarEvent[] = [];
  for (const m of html.matchAll(ROW_START_RE)) {
    const [, , dataId, , category] = m;
    const indicatorType = mapTECategoryToIndicator(category);
    if (!indicatorType) continue;
    const body = html.slice(m.index, m.index + ROW_WINDOW_CHARS);

    const dateMatch = body.match(DATE_RE);
    const timeMatch = body.match(TIME_RE);
    if (!dateMatch) continue;
    // TE does not expose an explicit timezone on this plain-HTML render —
    // treated as UTC directly. A few hours of drift here is well inside the
    // day-scale age/cadence tolerances scoring.ts and confidence.ts already
    // work with; revisit only if a systematic offset shows up in practice.
    const timeStr = timeMatch ? timeMatch[1] : "12:00 AM";
    const eventTime = parseTEDateTime(dateMatch[1], timeStr);
    if (!eventTime) continue;

    const titleMatch = body.match(TITLE_RE);
    const actualMatch = body.match(ACTUAL_RE);
    const previousMatch = body.match(PREVIOUS_RE);
    const consensusMatch = body.match(CONSENSUS_RE);

    const actual = actualMatch?.[1]?.trim() || null;
    const forecast = consensusMatch?.[1]?.trim() || null;
    const previous = previousMatch?.[1]?.trim() || null;

    out.push({
      externalId: `te:${dataId}`,
      indicatorType,
      title: titleMatch?.[1]?.trim() ?? category,
      eventTime,
      actual,
      forecast,
      previous,
    });
  }
  return out;
}

function parseTEDateTime(dateStr: string, timeStr: string): Date | null {
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number.parseInt(m[1], 10);
  const min = Number.parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  const iso = `${dateStr}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
