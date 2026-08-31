import { prisma } from "@/lib/prisma";

// ── Economic calendar data ───────────────────────────────────────────────────
//
// Server-only. Moved out of app/api/calendar/route.ts so the dashboard's
// server prefetch and the route load events through one implementation.
// The pure `selectTodayEvents` filter lives in lib/calendar-select.ts instead,
// because the client imports it too and must not pull Prisma into its bundle.

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

function impactStringToNumber(impact: string): 1 | 2 | 3 {
  const lower = impact.toLowerCase();
  if (lower === "high") return 3;
  if (lower === "medium") return 2;
  return 1;
}

export async function loadCalendarEvents(): Promise<CalEvent[]> {
  try {
    const rows = await prisma.economicEvent.findMany({
      orderBy: { eventTime: "asc" },
      take: 200,
    });

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

    return events;
  } catch (err) {
    console.error("[api/calendar] failed to load events", err);
    return [];
  }
}
