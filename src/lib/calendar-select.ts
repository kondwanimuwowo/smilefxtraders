import type { CalEvent } from "@/lib/calendar";

/**
 * The dashboard's "today's events" view: medium-and-high impact only,
 * chronological.
 *
 * Isomorphic and pure — no Prisma, no server imports — precisely so both the
 * client's queryFn and the page's server prefetch can call it. That is the
 * point of this file existing separately from lib/calendar.ts: importing the
 * loader would drag Prisma into the client bundle.
 *
 * Previously this filter lived inline in Dashboard.tsx's queryFn, which is
 * why ["calendar", "today"] could not be prefetched without writing the same
 * filter a second time on the server. Two copies of a rule like "impact >= 2"
 * drift the first time someone tunes it.
 *
 * `today` is injectable so the caller decides the clock — the server and the
 * browser can disagree about the date near midnight, and the caller knows
 * which one it means.
 */
export function selectTodayEvents(all: CalEvent[], today: string): CalEvent[] {
  return all
    .filter((e) => e.date === today && e.impact >= 2)
    .sort((a, b) => a.time.localeCompare(b.time));
}
