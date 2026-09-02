import type { CalEvent } from "@/lib/calendar";
import { addMinutes, formatInTimeZone } from "@/lib/date";

// Client-safe: no Prisma import, so this can be pulled into the calendar
// page's client bundle directly. Builds a Google Calendar quick-add link and
// a minimal valid .ics file client-side -- both work from data already
// loaded on the page, no API round-trip needed.

function toDate(ev: CalEvent): Date {
  return new Date(`${ev.date}T${ev.time}:00.000Z`);
}

// "2026-09-01T13:45:00.000Z" -> "20260901T134500Z", the ICS basic UTC format.
function toIcsUtc(d: Date): string {
  return formatInTimeZone(d, "UTC", "yyyyMMdd'T'HHmmss'Z'");
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

export function googleCalendarUrl(ev: CalEvent): string {
  const start = toDate(ev);
  const end = addMinutes(start, DEFAULT_DURATION_MIN);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${ev.currency} ${ev.event}`,
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
    details: eventDescription(ev) || "Economic calendar release",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Opens the .ics content directly rather than forcing a file download (no
// `download` attribute on the link). On iOS/macOS Safari, navigating to a
// text/calendar resource triggers the native "Add to Calendar" sheet
// in-place -- forcing a download instead (the original implementation) just
// saves the file to Files/Downloads, leaving the user to import it manually.
// Desktop/Android browsers without that native handling still just open or
// save the file, which is the same outcome they'd get either way.
export function openIcsEvent(ev: CalEvent): void {
  const start = toDate(ev);
  const end = addMinutes(start, DEFAULT_DURATION_MIN);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smile FX Traders//Economic Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@smilefxtraders.com`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${ev.currency} ${ev.event}`,
    `DESCRIPTION:${eventDescription(ev) || "Economic calendar release"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // Popup blocked -- fall back to navigating the current tab, which still
    // triggers the same native handling.
    window.location.href = url;
  }
  // Revoke after a delay rather than immediately -- the browser needs time to
  // actually read the blob URL before it's invalidated, whether that's a new
  // tab loading it or the OS handing it to Calendar.app.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
