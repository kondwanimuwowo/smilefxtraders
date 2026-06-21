// Shared date helpers — all date formatting goes through date-fns / date-fns-tz.
// Import from here rather than calling date-fns directly so formats stay consistent.

import {
  format,
  formatDistanceToNow,
  parseISO,
  getHours,
  getMinutes,
  startOfMonth,
  subDays,
  addMonths,
  differenceInMilliseconds,
  isToday,
  isSameDay,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export {
  format,
  formatDistanceToNow,
  parseISO,
  getHours,
  getMinutes,
  startOfMonth,
  subDays,
  addMonths,
  differenceInMilliseconds,
  isToday,
  isSameDay,
  formatInTimeZone,
};

// UTC helpers — date-fns doesn't wrap these; use native Date
export const getUTCHours   = (d: Date) => d.getUTCHours();
export const getUTCMinutes = (d: Date) => d.getUTCMinutes();

// ── Forex market hours ────────────────────────────────────────────────────────
// Forex trades ~24/5. It closes Friday 22:00 UTC (New York close) and reopens
// Sunday 22:00 UTC (Sydney open). Sessions should never show as "open" in that
// window — markets are closed over the weekend.

/** True if the forex market is closed at the given instant (weekend). */
export const isForexClosed = (d: Date = new Date()): boolean => {
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const h   = d.getUTCHours();
  if (day === 6) return true;            // all of Saturday
  if (day === 0 && h < 22) return true;  // Sunday before the Sydney reopen
  if (day === 5 && h >= 22) return true; // Friday after the New York close
  return false;
};

/** Hours until forex reopens at Sunday 22:00 UTC (only meaningful while closed). */
export const hoursUntilForexReopen = (d: Date = new Date()): number => {
  const reopen = new Date(d);
  reopen.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7)); // forward to Sunday
  reopen.setUTCHours(22, 0, 0, 0);
  if (reopen <= d) reopen.setUTCDate(reopen.getUTCDate() + 7);
  return (reopen.getTime() - d.getTime()) / 3_600_000;
};

// ── Convenience formatters ────────────────────────────────────────────────────

/** "14 Jun" */
export const fmtDayMonth = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "d MMM");

/** "Jun 14" */
export const fmtMonthDay = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "MMM d");

/** "Jun 14, 2026" */
export const fmtFull = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "MMM d, yyyy");

/** "Mon, Jun 14" */
export const fmtWeekdayShort = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "EEE, MMM d");

/** "Monday" */
export const fmtWeekdayLong = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "EEEE");

/** "14:30" (24h) */
export const fmtTime = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "HH:mm");

/** "2026-06-14" (ISO date) */
export const fmtISODate = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "yyyy-MM-dd");

/** "3 minutes ago" / "2 hours ago" */
export const fmtRelative = (d: Date | string) =>
  formatDistanceToNow(typeof d === "string" ? parseISO(d) : d, { addSuffix: true });

/** "Mon, Jun 14, 14:30" */
export const fmtDateTime = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "EEE, MMM d, HH:mm");

/** "Jun 14, '26" */
export const fmtCompact = (d: Date | string) =>
  format(typeof d === "string" ? parseISO(d) : d, "MMM d, ''yy");

// ── Timezone-aware helpers (for city clocks) ──────────────────────────────────

/** HH:mm in a given IANA timezone */
export const fmtCityTime = (d: Date, tz: string) =>
  formatInTimeZone(d, tz, "HH:mm");

/** Uppercase 3-letter weekday in a given IANA timezone: "MON" */
export const fmtCityDay = (d: Date, tz: string) =>
  formatInTimeZone(d, tz, "EEE").toUpperCase();
