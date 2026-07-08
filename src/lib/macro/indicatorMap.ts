import { IndicatorType } from "@prisma/client";

// Finnhub's economic-calendar events don't carry a clean machine-readable
// category field — just a free-text `event` title (e.g. "CPI YoY",
// "Non-Farm Payrolls", "ISM Manufacturing PMI"). This maps that title to our
// own IndicatorType taxonomy via keyword matching. Order matters — more
// specific keywords are checked before generic ones (e.g. "Core CPI" and
// "CPI" both hit the CPI bucket via one check, but "Non-Farm Payrolls" must
// be checked before a generic "Employment" keyword would also match).
//
// NOTE: written without a live sample of Finnhub's real event-title strings
// (the API key on hand doesn't currently have calendar access — see
// src/app/api/calendar/sync/route.ts). Verify/extend this keyword list once
// real payloads start flowing through the webhook or sync job.
const KEYWORD_RULES: Array<{ pattern: RegExp; type: IndicatorType }> = [
  { pattern: /interest rate|rate decision|fed funds|bank rate|repo rate/i, type: IndicatorType.INTEREST_RATE },
  { pattern: /\bcpi\b|consumer price|inflation rate/i, type: IndicatorType.CPI },
  { pattern: /\bgdp\b|gross domestic product/i, type: IndicatorType.GDP },
  { pattern: /non-?farm payroll|\bnfp\b|claimant count|unemployment rate|employment change|jobless claims|payrolls/i, type: IndicatorType.EMPLOYMENT },
  { pattern: /retail sales/i, type: IndicatorType.RETAIL_SALES },
  { pattern: /\bpmi\b|manufacturing index|ism manufacturing/i, type: IndicatorType.MANUFACTURING_PMI },
  { pattern: /consumer confidence|consumer sentiment|business confidence/i, type: IndicatorType.CONSUMER_CONFIDENCE },
  { pattern: /trade balance|current account/i, type: IndicatorType.TRADE_BALANCE },
  { pattern: /10-?year|10y|bond yield|gilt yield|treasury yield/i, type: IndicatorType.BOND_YIELD_10Y },
];

export function mapEventTitleToIndicator(title: string): IndicatorType | null {
  for (const { pattern, type } of KEYWORD_RULES) {
    if (pattern.test(title)) return type;
  }
  return null;
}

// Finnhub's country field format for the calendar endpoint isn't confirmed
// live (see note above) — this accepts several plausible variants (ISO2,
// common abbreviations, full names) for each currency we track, so whichever
// shape actually comes back has a good chance of matching. Extend once
// verified against real data.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", USA: "USD", "UNITED STATES": "USD",
  EU: "EUR", EMU: "EUR", EA: "EUR", "EURO AREA": "EUR", EUROZONE: "EUR", "EUROPEAN UNION": "EUR",
  GB: "GBP", UK: "GBP", "UNITED KINGDOM": "GBP",
  NZ: "NZD", "NEW ZEALAND": "NZD",
};

export function mapCountryToCurrency(country: string): string | null {
  return COUNTRY_TO_CURRENCY[country.trim().toUpperCase()] ?? null;
}

// The currencies MacroEdge tracks calendar events for. XAU (gold) has no
// central bank/calendar of its own — deliberately excluded here, see the
// MacroEdge plan's Layer 3 scoring notes on why XAU gets a different model.
export const TRACKED_CURRENCIES = ["USD", "EUR", "GBP", "NZD"] as const;
