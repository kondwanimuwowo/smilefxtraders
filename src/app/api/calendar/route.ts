import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Economic Calendar API Route ───────────────────────────────────────────────
//
// Real data comes from EconomicEvent (populated by /api/calendar/sync, a cron
// job pulling Finnhub's calendar, plus /api/webhooks/finnhub push updates).
// Falls back to MOCK_EVENTS if the table is empty — covers both a fresh DB
// and the current known blocker where the Finnhub account's plan doesn't
// include calendar access yet (verified via direct API testing: /quote and
// /news work on this key, /calendar/economic returns a 403-shaped "no
// access" error). The component at app/(app)/calendar/Calendar.tsx expects
// this exact CalEvent shape either way.

export interface CalEvent {
  id: string;
  date: string; // "2026-06-08"
  time: string; // "08:30" UTC
  currency: string; // "USD", "EUR", "GBP", "NZD", "XAU"
  event: string; // human-readable name
  impact: 1 | 2 | 3; // 1=low, 2=medium, 3=high
  forecast: string | null;
  previous: string | null;
  actual: string | null; // null = not yet released
  unit: string; // "%", "K", "B", "M", "bps", ""
}

// ── Mock events: week of 08–12 Jun 2026 (fallback only) ──────────────────────

const MOCK_EVENTS: CalEvent[] = [
  // Monday
  { id: "e01", date: "2026-06-08", time: "01:30", currency: "NZD", event: "NZIER Business Confidence", impact: 2, forecast: null, previous: "4", actual: null, unit: "" },
  { id: "e02", date: "2026-06-08", time: "14:00", currency: "USD", event: "Consumer Credit (Apr)", impact: 2, forecast: "12.0B", previous: "10.6B", actual: null, unit: "B" },

  // Tuesday
  { id: "e03", date: "2026-06-09", time: "01:30", currency: "NZD", event: "Electronic Card Retail Sales (MoM)", impact: 2, forecast: "0.4%", previous: "-0.3%", actual: null, unit: "%" },
  { id: "e04", date: "2026-06-09", time: "06:00", currency: "GBP", event: "Average Earnings Index (Apr)", impact: 3, forecast: "5.5%", previous: "5.6%", actual: null, unit: "%" },
  { id: "e05", date: "2026-06-09", time: "06:00", currency: "GBP", event: "Claimant Count Change", impact: 3, forecast: "18.0K", previous: "17.8K", actual: null, unit: "K" },
  { id: "e06", date: "2026-06-09", time: "09:00", currency: "EUR", event: "ZEW Economic Sentiment", impact: 2, forecast: "12.0", previous: "11.6", actual: null, unit: "" },
  { id: "e07", date: "2026-06-09", time: "12:30", currency: "USD", event: "NFIB Small Business Index", impact: 2, forecast: "97.5", previous: "97.2", actual: null, unit: "" },

  // Wednesday ─ US CPI day
  { id: "e08", date: "2026-06-10", time: "06:00", currency: "GBP", event: "GDP (MoM) (Apr)", impact: 3, forecast: "0.1%", previous: "0.2%", actual: null, unit: "%" },
  { id: "e09", date: "2026-06-10", time: "06:00", currency: "GBP", event: "Industrial Production (MoM)", impact: 2, forecast: "0.2%", previous: "-0.3%", actual: null, unit: "%" },
  { id: "e10", date: "2026-06-10", time: "12:30", currency: "USD", event: "CPI (YoY) (May)", impact: 3, forecast: "3.2%", previous: "3.4%", actual: null, unit: "%" },
  { id: "e11", date: "2026-06-10", time: "12:30", currency: "USD", event: "Core CPI (MoM) (May)", impact: 3, forecast: "0.3%", previous: "0.3%", actual: null, unit: "%" },
  { id: "e12", date: "2026-06-10", time: "18:00", currency: "USD", event: "Federal Budget Balance", impact: 2, forecast: "-220.0B", previous: "-236.0B", actual: null, unit: "B" },

  // Thursday ─ ECB + US PPI
  { id: "e13", date: "2026-06-11", time: "12:15", currency: "EUR", event: "ECB Interest Rate Decision", impact: 3, forecast: "3.40%", previous: "3.65%", actual: null, unit: "%" },
  { id: "e14", date: "2026-06-11", time: "12:30", currency: "EUR", event: "ECB Press Conference", impact: 3, forecast: null, previous: null, actual: null, unit: "" },
  { id: "e15", date: "2026-06-11", time: "12:30", currency: "USD", event: "Initial Jobless Claims", impact: 3, forecast: "225K", previous: "229K", actual: null, unit: "K" },
  { id: "e16", date: "2026-06-11", time: "12:30", currency: "USD", event: "PPI (MoM) (May)", impact: 3, forecast: "0.2%", previous: "0.5%", actual: null, unit: "%" },
  { id: "e17", date: "2026-06-11", time: "23:50", currency: "NZD", event: "RBNZ Interest Rate Decision", impact: 3, forecast: "4.75%", previous: "5.00%", actual: null, unit: "%" },

  // Friday ─ NFP
  { id: "e18", date: "2026-06-12", time: "12:30", currency: "USD", event: "Non-Farm Payrolls (May)", impact: 3, forecast: "178K", previous: "175K", actual: null, unit: "K" },
  { id: "e19", date: "2026-06-12", time: "12:30", currency: "USD", event: "Unemployment Rate (May)", impact: 3, forecast: "3.9%", previous: "3.9%", actual: null, unit: "%" },
  { id: "e20", date: "2026-06-12", time: "12:30", currency: "USD", event: "Average Hourly Earnings (MoM)", impact: 3, forecast: "0.3%", previous: "0.2%", actual: null, unit: "%" },
  { id: "e21", date: "2026-06-12", time: "14:00", currency: "USD", event: "Michigan Consumer Sentiment (Prelim)", impact: 2, forecast: "69.0", previous: "67.9", actual: null, unit: "" },
];

function impactStringToNumber(impact: string): 1 | 2 | 3 {
  const lower = impact.toLowerCase();
  if (lower === "high") return 3;
  if (lower === "medium") return 2;
  return 1;
}

export async function GET() {
  try {
    const rows = await prisma.economicEvent.findMany({
      orderBy: { eventTime: "asc" },
      take: 200,
    });

    if (rows.length === 0) {
      return NextResponse.json(MOCK_EVENTS);
    }

    const events: CalEvent[] = rows.map((row) => {
      const iso = row.eventTime.toISOString();
      return {
        id: row.id,
        date: iso.slice(0, 10),
        time: iso.slice(11, 16),
        currency: row.currency,
        event: row.title,
        impact: impactStringToNumber(row.impact),
        forecast: row.forecast,
        previous: row.previous,
        actual: row.actual,
        unit: "",
      };
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error("[api/calendar] falling back to mock data", err);
    return NextResponse.json(MOCK_EVENTS);
  }
}
