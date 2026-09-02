"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EmptyState, Panel, Skeleton, Icon } from "@/components/ui";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import type { CalEvent } from "@/lib/calendar";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";
import { googleCalendarUrl, downloadIcs } from "@/lib/ics";

const CURRENCY_FILTERS = ["ALL", ...TRACKED_CURRENCIES] as const;
type CurrencyFilter = (typeof CURRENCY_FILTERS)[number];

const IMPACT_LEVELS = [1, 2, 3] as const;
const IMPACT_LABEL: Record<1 | 2 | 3, string> = { 1: "Low", 2: "Medium", 3: "High" };
const IMPACT_CLS: Record<number, string> = { 1: "bg-ink-dim", 2: "bg-gold", 3: "bg-coral" };

function ImpactDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5" title={`${IMPACT_LABEL[level]} impact`}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= level ? IMPACT_CLS[level] : "bg-track")} />
      ))}
    </div>
  );
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

// Handles the three states a not-yet-released event can be in. Ticks its own
// clock (60s resolution -- a calendar countdown doesn't need per-second
// precision) rather than requiring the page to re-fetch/re-render everything
// every minute.
function CountdownOrStatus({ eventTime, hasNumericExpectation }: { eventTime: Date; hasNumericExpectation: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const msRemaining = eventTime.getTime() - now;

  if (msRemaining > 0) {
    return (
      <span className="flex items-center gap-1 text-ink-dim">
        <Icon name="schedule" size={12} />
        {formatCountdown(msRemaining)}
      </span>
    );
  }

  // Event time has passed with no actual yet. A release TE/Finnhub hasn't
  // synced the actual for yet (has a forecast/previous) reads differently
  // from an event that will never have one (a speech -- no forecast or
  // previous ever existed for it), which was previously mislabeled
  // "Upcoming" forever once its time passed.
  if (hasNumericExpectation) {
    return <span className="text-ink-dim italic">Pending</span>;
  }
  return (
    <span title="Event occurred — nothing to report">
      <Icon name="check_circle" size={14} className="text-ink-dim" />
    </span>
  );
}

function EventResult({ ev }: { ev: CalEvent }) {
  if (ev.actual) {
    return (
      <>
        {ev.forecast && <span className="text-ink-dim">F: {ev.forecast}{ev.unit}</span>}
        {ev.previous && <span className="text-ink-dim">P: {ev.previous}{ev.unit}</span>}
        <span className="text-teal-deep font-semibold">{ev.actual}{ev.unit}</span>
      </>
    );
  }

  const eventTime = new Date(`${ev.date}T${ev.time}:00.000Z`);
  const hasNumericExpectation = Boolean(ev.forecast || ev.previous);

  return (
    <>
      {ev.forecast && <span className="text-ink-dim">F: {ev.forecast}{ev.unit}</span>}
      {ev.previous && <span className="text-ink-dim">P: {ev.previous}{ev.unit}</span>}
      <CountdownOrStatus eventTime={eventTime} hasNumericExpectation={hasNumericExpectation} />
    </>
  );
}

// ── Date helpers — all UTC, matching how eventTime/date are stored ──────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysUTC(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function mondayOfWeekUTC(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function fmtDayLabel(date: string): { weekday: string; day: string } {
  const d = new Date(`${date}T00:00:00.000Z`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" }),
  };
}

function fmtDateHeading(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

// ── Add to Calendar ──────────────────────────────────────────────────────────

function AddToCalendar({ event }: { event: CalEvent }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-hover transition-colors text-ink-dim hover:text-teal-deep"
        aria-label="Add to calendar"
        title="Add to calendar"
      >
        <Icon name="event" size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 flex flex-col gap-0.5 rounded-xl p-1.5 min-w-[180px] bg-panel shadow-md">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium text-ink-mid hover:bg-hover hover:text-ink-strong transition-colors"
          >
            <Icon name="calendar_month" size={15} />
            Add to Google Calendar
          </a>
          <button
            type="button"
            onClick={() => downloadIcs(event)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium text-left text-ink-mid hover:bg-hover hover:text-ink-strong transition-colors"
          >
            <Icon name="save" size={15} />
            Download .ics (Apple/Outlook)
          </button>
        </div>
      )}
    </div>
  );
}

export function Calendar() {
  const [activeDate, setActiveDate] = useState(todayUTC);
  const [weekStart, setWeekStart] = useState(() => mondayOfWeekUTC(todayUTC()));
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("ALL");
  const [impactFilter, setImpactFilter] = useState<Set<1 | 2 | 3>>(new Set(IMPACT_LEVELS));
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEvents(null);
    fetch(`/api/calendar?from=${activeDate}&to=${activeDate}`)
      .then((r) => r.json() as Promise<CalEvent[]>)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [activeDate]);

  const filtered = useMemo(() => {
    if (!events) return [];
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => currencyFilter === "ALL" || e.currency === currencyFilter)
      .filter((e) => impactFilter.has(e.impact))
      .filter((e) => !q || e.event.toLowerCase().includes(q))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [events, currencyFilter, impactFilter, search]);

  const loading = events === null;
  const today = todayUTC();

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysUTC(weekStart, i)), [weekStart]);

  function goToday() {
    const t = todayUTC();
    setActiveDate(t);
    setWeekStart(mondayOfWeekUTC(t));
  }

  function shiftWeek(dir: -1 | 1) {
    const next = addDaysUTC(weekStart, dir * 7);
    setWeekStart(next);
    setActiveDate(next);
  }

  function toggleImpact(level: 1 | 2 | 3) {
    setImpactFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next.size === 0 ? new Set(IMPACT_LEVELS) : next;
    });
  }

  const activeFilterCount = (currencyFilter !== "ALL" ? 1 : 0) + (impactFilter.size < 3 ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="view flex flex-col min-h-[calc(100vh-60px)]">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Economic Calendar
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            {TRACKED_CURRENCIES.join(", ")} · all times UTC
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold bg-panel shadow-sm text-ink-mid hover:text-ink-strong transition-colors"
        >
          <Icon name="tune" size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-teal-solid text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Day navigator ── */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="shrink-0 p-2 rounded-lg bg-panel shadow-sm text-ink-mid hover:text-ink-strong transition-colors"
          aria-label="Previous week"
        >
          <Icon name="chevron_left" size={18} />
        </button>

        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto snap-x">
          {weekDays.map((d) => {
            const active = d === activeDate;
            const isToday = d === today;
            const { weekday, day } = fmtDayLabel(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDate(d)}
                className={cn(
                  "shrink-0 snap-start flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-xl min-w-[56px] transition-colors",
                  active ? "bg-teal-solid text-white" : "bg-panel shadow-sm text-ink-mid hover:text-ink-strong"
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  {isToday ? "Today" : weekday}
                </span>
                <span className="text-[15px] font-bold tabular-nums">{day}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="shrink-0 p-2 rounded-lg bg-panel shadow-sm text-ink-mid hover:text-ink-strong transition-colors"
          aria-label="Next week"
        >
          <Icon name="chevron_right" size={18} />
        </button>

        {activeDate !== today && (
          <button
            type="button"
            onClick={goToday}
            className="shrink-0 px-3 py-2 rounded-lg text-[12px] font-semibold bg-panel shadow-sm text-teal-deep"
          >
            Today
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const input = dateInputRef.current;
            if (!input) return;
            // showPicker() opens the native picker without the input itself
            // ever needing to be visible on screen -- opacity:0 alone doesn't
            // reliably hide a date input's own chrome on every mobile browser
            // (its "dd/mm/yyyy" text bled through under the icon button), so
            // the input stays truly off-screen (sr-only) instead.
            if (typeof input.showPicker === "function") input.showPicker();
            else input.focus();
          }}
          className="shrink-0 relative p-2 rounded-lg bg-panel shadow-sm text-ink-mid hover:text-ink-strong transition-colors"
          aria-label="Jump to date"
        >
          <Icon name="event" size={18} />
          <input
            ref={dateInputRef}
            type="date"
            value={activeDate}
            onChange={(e) => {
              if (!e.target.value) return;
              setActiveDate(e.target.value);
              setWeekStart(mondayOfWeekUTC(e.target.value));
            }}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ── Filters drawer (all breakpoints) ── */}
      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2 text-ink-dim">Currency</div>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCY_FILTERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrencyFilter(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                    currencyFilter === c ? "bg-teal-solid text-white" : "bg-panel-2 text-ink-dim shadow-sm"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2 text-ink-dim">Impact</div>
            <div className="flex flex-col gap-1.5">
              {IMPACT_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleImpact(level)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all",
                    impactFilter.has(level) ? "bg-teal-solid text-white" : "bg-panel-2 text-ink-dim shadow-sm"
                  )}
                >
                  <ImpactDots level={level} />
                  {IMPACT_LABEL[level]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2 text-ink-dim">Search</div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-panel-2">
              <Icon name="search" size={15} className="text-ink-dim shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                className="flex-1 bg-transparent text-base outline-none text-ink-strong"
              />
            </div>
          </div>
        </div>
      </Drawer>

      {/* ── Event list ── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} h={52} r={12} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon="event_busy"
            title="No events"
            body={
              activeFilterCount > 0
                ? "Nothing matches your filters for this day. Try widening them."
                : "Nothing on the calendar for this day."
            }
          />
        </Panel>
      ) : (
        <Panel pad={0} className="overflow-hidden">
          <div className="px-5 py-3.5 bg-panel-2">
            <div className="text-[13px] font-semibold text-ink-strong">{fmtDateHeading(activeDate)}</div>
          </div>
          {filtered.map((ev, i) => (
            <div key={ev.id}>
              {/* Desktop row */}
              <div
                className={cn(
                  "hidden md:grid items-center gap-3 px-5 py-3",
                  i < filtered.length - 1 && "border-b border-line-soft",
                  ev.impact === 3 && "bg-coral-tint-soft"
                )}
                style={{ gridTemplateColumns: "64px 1fr 200px 32px" }}
              >
                <span className="text-[11.5px] tabular-nums text-ink-dim">{fmtTime(ev.time)}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <ImpactDots level={ev.impact} />
                  <Link
                    href={`/macroedge/${ev.currency}`}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg tracking-wide bg-panel-2 text-ink-mid hover:text-teal-deep hover:shadow-[0_0_0_1px_var(--teal-bright)] transition-colors shrink-0"
                  >
                    {ev.currency}
                  </Link>
                  <span className="text-[12.5px] font-medium truncate text-ink-strong">{ev.event}</span>
                </div>
                <div className="flex items-center justify-end gap-3 text-[11.5px]">
                  <EventResult ev={ev} />
                </div>
                <div className="flex justify-end">
                  <AddToCalendar event={ev} />
                </div>
              </div>

              {/* Mobile card — position conveys meaning instead of repeating a label per field */}
              <div
                className={cn(
                  "md:hidden flex items-center gap-3 px-4 py-3",
                  i < filtered.length - 1 && "border-b border-line-soft",
                  ev.impact === 3 && "bg-coral-tint-soft"
                )}
              >
                <div className="flex flex-col items-center gap-1 shrink-0 w-11">
                  <span className="text-[10.5px] tabular-nums text-ink-dim">{fmtTime(ev.time)}</span>
                  <ImpactDots level={ev.impact} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Link
                      href={`/macroedge/${ev.currency}`}
                      className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-md tracking-wide bg-panel text-ink-mid shrink-0"
                    >
                      {ev.currency}
                    </Link>
                    <span className="text-[12.5px] font-medium truncate text-ink-strong">{ev.event}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px]">
                    <EventResult ev={ev} />
                  </div>
                </div>
                <AddToCalendar event={ev} />
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
