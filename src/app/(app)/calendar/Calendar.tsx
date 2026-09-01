"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, Panel, Skeleton, Icon } from "@/components/ui";
import { Drawer } from "@/components/ui/Drawer";
import { ResponsiveRow } from "@/components/ui/ResponsiveRow";
import { cn } from "@/lib/cn";
import type { CalEvent } from "@/lib/calendar";
import type { MacroScoresResponse } from "@/types/macro";
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
        <Icon name="event_available" size={16} />
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
            <Icon name="download" size={15} />
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
  const [scores, setScores] = useState<MacroScoresResponse["scores"] | null>(null);

  useEffect(() => {
    setEvents(null);
    fetch(`/api/calendar?from=${activeDate}&to=${activeDate}`)
      .then((r) => r.json() as Promise<CalEvent[]>)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [activeDate]);

  useEffect(() => {
    fetch("/api/macro/scores")
      .then((r) => r.json() as Promise<MacroScoresResponse>)
      .then((d) => setScores(d.scores))
      .catch(() => setScores([]));
  }, []);

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

  const sortedScores = useMemo(
    () => (scores ? [...scores].sort((a, b) => b.totalScore - a.totalScore) : null),
    [scores]
  );

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
          className="md:hidden flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold bg-panel shadow-sm text-ink-mid"
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

      {/* ── Score strip ── */}
      {sortedScores === null ? (
        <div className="flex gap-2 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1">
              <Skeleton h={54} r={12} />
            </div>
          ))}
        </div>
      ) : sortedScores.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {sortedScores.map((s) => {
            const positive = s.totalScore > 0;
            const negative = s.totalScore < 0;
            return (
              <Link
                key={s.currency}
                href={`/macroedge/${s.currency}`}
                className="flex-1 min-w-[72px] flex flex-col gap-1 px-3.5 py-2.5 rounded-xl bg-panel shadow-sm hover:ring-2 ring-teal-deep transition-shadow"
              >
                <span className="text-[11px] font-bold tracking-wide text-ink-dim">{s.currency}</span>
                <span
                  className={cn(
                    "font-display font-bold tabular-nums text-[16px]",
                    positive ? "text-teal-deep" : negative ? "text-coral-deep" : "text-gold-deep"
                  )}
                >
                  {positive ? "+" : ""}
                  {s.totalScore.toFixed(1)}
                </span>
              </Link>
            );
          })}
        </div>
      )}

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

        <label className="shrink-0 relative p-2 rounded-lg bg-panel shadow-sm text-ink-mid hover:text-ink-strong transition-colors cursor-pointer">
          <Icon name="event" size={18} />
          <input
            type="date"
            value={activeDate}
            onChange={(e) => {
              if (!e.target.value) return;
              setActiveDate(e.target.value);
              setWeekStart(mondayOfWeekUTC(e.target.value));
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Jump to date"
          />
        </label>
      </div>

      {/* ── Desktop filters ── */}
      <div className="hidden md:flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {CURRENCY_FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrencyFilter(c)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                currencyFilter === c ? "bg-teal-solid text-white" : "bg-panel-2 text-ink-dim shadow-sm"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {IMPACT_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => toggleImpact(level)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                impactFilter.has(level) ? "bg-teal-solid text-white" : "bg-panel-2 text-ink-dim shadow-sm"
              )}
            >
              <ImpactDots level={level} />
              {IMPACT_LABEL[level]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full flex-1 min-w-[200px] max-w-xs bg-panel shadow-sm">
          <Icon name="search" size={15} className="text-ink-dim shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="flex-1 bg-transparent text-[12.5px] leading-5 outline-none text-ink-strong"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-ink-dim">
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile filters drawer ── */}
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
            <div
              key={ev.id}
              className={cn(
                "md:px-5 md:py-3 px-3 pt-3",
                i < filtered.length - 1 && "md:border-b md:border-line-soft",
                ev.impact === 3 && "md:bg-coral-tint-soft"
              )}
            >
              <ResponsiveRow
                gridTemplateColumns="64px 1fr 200px 32px"
                className="items-center gap-3"
                cells={[
                  {
                    label: "Time",
                    value: <span className="text-[11.5px] tabular-nums text-ink-dim">{fmtTime(ev.time)}</span>,
                  },
                  {
                    label: "Event",
                    value: (
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
                    ),
                  },
                  {
                    label: "Result",
                    align: "right",
                    value: (
                      <div className="flex items-center justify-end gap-3 text-[11.5px]">
                        {ev.forecast && <span className="text-ink-dim">F: {ev.forecast}{ev.unit}</span>}
                        {ev.previous && <span className="text-ink-dim">P: {ev.previous}{ev.unit}</span>}
                        {ev.actual ? (
                          <span className="text-teal-deep font-semibold">{ev.actual}{ev.unit}</span>
                        ) : (
                          <span className="text-ink-dim italic">Upcoming</span>
                        )}
                      </div>
                    ),
                  },
                  { label: "Calendar", align: "right", value: <AddToCalendar event={ev} /> },
                ]}
              />
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
