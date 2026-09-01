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

// Was `orderBy: eventTime asc, take: 200` -- an oldest-first slice across
// every currency combined. As the table grew past 200 rows (worse after the
// 2026-08 expansion to 8 currencies and the 2026-09 tradingeconomics.com
// backfill), that permanently excluded both the newest releases and any
// upcoming event, since ascending-oldest-200 never reaches either end of a
// table that outgrew the cap (found 2026-09-01, via the MacroEdge USD page
// showing nothing past May and no upcoming events at all). Newest-first with
// a larger cap keeps recent/upcoming events in the result regardless of how
// large the table gets; old history simply falls off the tail instead.
const CALENDAR_EVENT_LIMIT = 400;

export interface CalendarRange {
  from: Date;
  to: Date;
}

// When `range` is given (the calendar page's day-tab/date-range queries), the
// query is bounded by real dates instead of a row-count cap -- a day or week
// window is always small, so no `take` is needed and nothing outside the
// requested range can be silently excluded the way the flat top-400 list
// eventually was. Callers that don't need a specific window (pair page,
// currency page, dashboard widget) keep the unfiltered newest-first behavior
// unchanged.
export async function loadCalendarEvents(range?: CalendarRange): Promise<CalEvent[]> {
  try {
    const rows = range
      ? await prisma.economicEvent.findMany({
          where: { eventTime: { gte: range.from, lte: range.to } },
          orderBy: { eventTime: "asc" },
        })
      : await prisma.economicEvent.findMany({
          orderBy: { eventTime: "desc" },
          take: CALENDAR_EVENT_LIMIT,
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
