import { NextRequest, NextResponse } from "next/server";
import { loadCalendarEvents } from "@/lib/calendar";
import { handleApiError } from "@/lib/api-error";

// GET /api/calendar — optionally windowed by ?from=YYYY-MM-DD&to=YYYY-MM-DD
// (the calendar page's day-tab/date-range navigation); with no params,
// returns the existing unfiltered newest-first list other callers rely on.
// Query and mock fallback live in lib/calendar.ts, shared with the dashboard's
// server prefetch.

function parseUtcDay(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  try {
    const from = parseUtcDay(req.nextUrl.searchParams.get("from"));
    const toDay = parseUtcDay(req.nextUrl.searchParams.get("to"));
    const to = toDay ? new Date(toDay.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

    const range = from && to ? { from, to } : undefined;
    return NextResponse.json(await loadCalendarEvents(range));
  } catch (err) {
    return handleApiError("api/calendar", err);
  }
}
