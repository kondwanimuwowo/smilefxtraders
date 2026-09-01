import type { CalEvent } from "@/lib/calendar";

// Client-safe: no Prisma import, so this can be pulled into the calendar
// page's client bundle directly. Builds a Google Calendar quick-add link and
// a minimal valid .ics file client-side -- both work from data already
// loaded on the page, no API round-trip needed.

function toIcsUtc(date: string, time: string): string {
  // "2026-09-01", "13:45" (both already UTC) -> "20260901T134500Z"
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00Z`;
}

function eventDescription(ev: CalEvent): string {
  const parts: string[] = [];
  if (ev.forecast) parts.push(`Forecast: ${ev.forecast}${ev.unit}`);
  if (ev.previous) parts.push(`Previous: ${ev.previous}${ev.unit}`);
  if (ev.actual) parts.push(`Actual: ${ev.actual}${ev.unit}`);
  return parts.join("\\n");
}

// Releases don't carry a duration -- 30 minutes is a reasonable default block
// so the event is visible on an hourly calendar grid without overlapping the
// next release.
const DEFAULT_DURATION_MIN = 30;

function addMinutes(date: string, time: string, minutes: number): { date: string; time: string } {
  const d = new Date(`${date}T${time}:00.000Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
}

export function googleCalendarUrl(ev: CalEvent): string {
  const end = addMinutes(ev.date, ev.time, DEFAULT_DURATION_MIN);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${ev.currency} ${ev.event}`,
    dates: `${toIcsUtc(ev.date, ev.time)}/${toIcsUtc(end.date, end.time)}`,
    details: eventDescription(ev) || "Economic calendar release",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(ev: CalEvent): void {
  const end = addMinutes(ev.date, ev.time, DEFAULT_DURATION_MIN);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smile FX Traders//Economic Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@smilefxtraders.com`,
    `DTSTAMP:${toIcsUtc(ev.date, ev.time)}`,
    `DTSTART:${toIcsUtc(ev.date, ev.time)}`,
    `DTEND:${toIcsUtc(end.date, end.time)}`,
    `SUMMARY:${ev.currency} ${ev.event}`,
    `DESCRIPTION:${eventDescription(ev) || "Economic calendar release"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.currency}-${ev.event.replace(/[^a-z0-9]+/gi, "-")}-${ev.date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
