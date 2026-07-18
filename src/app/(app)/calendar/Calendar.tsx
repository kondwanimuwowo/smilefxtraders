"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon, Panel, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CalEvent } from "@/app/api/calendar/route";

const CURRENCY_FILTERS = ["ALL", "USD", "EUR", "GBP", "NZD"] as const;
type CurrencyFilter = (typeof CURRENCY_FILTERS)[number];

const IMPACT_CLS: Record<number, string> = { 1: "bg-ink-dim", 2: "bg-gold", 3: "bg-coral" };

function ImpactDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5" title={level === 3 ? "High impact" : level === 2 ? "Medium impact" : "Low impact"}>
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

function fmtDateHeading(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

function groupByDate(events: CalEvent[]): Array<[string, CalEvent[]]> {
  const map = new Map<string, CalEvent[]>();
  for (const ev of events) {
    const list = map.get(ev.date) ?? [];
    list.push(ev);
    map.set(ev.date, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function Calendar() {
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [filter, setFilter] = useState<CurrencyFilter>("ALL");

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json() as Promise<CalEvent[]>)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const filtered = useMemo(() => {
    if (!events) return [];
    return filter === "ALL" ? events : events.filter((e) => e.currency === filter);
  }, [events, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const loading = events === null;

  return (
    <div className="view flex flex-col min-h-[calc(100vh-60px)]">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Economic Calendar
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            High-impact events that move the pairs: USD, EUR, GBP, NZD. All times UTC.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {CURRENCY_FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={cn(
                "text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                filter === c
                  ? "bg-teal text-navy-deep border-teal"
                  : "bg-panel-2 text-ink-dim border-line hover:text-ink-strong"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} h={52} r={12} />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <Panel>
          <div className="py-10 text-center">
            <Icon name="event_busy" size={28} className="text-ink-dim mx-auto mb-2" />
            <div className="text-[13px] text-ink-dim">No events match this filter.</div>
          </div>
        </Panel>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(([date, dayEvents]) => (
            <Panel key={date} pad={0}>
              <div className="px-5 py-3.5 border-b border-line">
                <div className="text-[13px] font-semibold text-ink-strong">{fmtDateHeading(date)}</div>
              </div>
              {dayEvents.map((ev, i) => (
                <div
                  key={ev.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3",
                    i < dayEvents.length - 1 && "border-b border-line",
                    ev.impact === 3 && "bg-[rgba(234,82,61,0.025)]"
                  )}
                >
                  <div className="text-[11.5px] tabular-nums text-ink-dim w-16 shrink-0">
                    {fmtTime(ev.time)}
                  </div>
                  <ImpactDots level={ev.impact} />
                  <Link
                    href={`/macroedge/${ev.currency}`}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg tracking-wide bg-panel-2 text-ink-mid border border-line hover:text-teal hover:border-teal/40 transition-colors shrink-0"
                  >
                    {ev.currency}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium truncate text-ink-strong">{ev.event}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11.5px]">
                    {ev.forecast && <span className="text-ink-dim">F: {ev.forecast}{ev.unit}</span>}
                    {ev.previous && <span className="text-ink-dim">P: {ev.previous}{ev.unit}</span>}
                    {ev.actual && (
                      <span className="text-teal-bright font-semibold">{ev.actual}{ev.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
