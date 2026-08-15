import { NextResponse } from "next/server";
import { loadCalendarEvents } from "@/lib/calendar";
import { handleApiError } from "@/lib/api-error";

// GET /api/calendar — full event list (the client filters for its own view).
// Query and mock fallback live in lib/calendar.ts, shared with the dashboard's
// server prefetch.

export async function GET() {
  try {
    return NextResponse.json(await loadCalendarEvents());
  } catch (err) {
    return handleApiError("api/calendar", err);
  }
}
