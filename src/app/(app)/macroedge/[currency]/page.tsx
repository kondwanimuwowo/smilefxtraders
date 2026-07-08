"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, Panel, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CalEvent } from "@/app/api/calendar/route";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";

const IMPACT_CLS: Record<number, string> = { 1: "bg-ink-dim", 2: "bg-gold", 3: "bg-coral" };

function ImpactDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= level ? IMPACT_CLS[level] : "bg-track")} />
      ))}
    </div>
  );
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"} UTC`;
}

// This page is deliberately bare-bones for Phase 1 — it validates the
// calendar-event → currency cross-link cheaply. Layer 2/3 scoring
// (indicator breakdown, currency score) lands in Phase 2; the Gavo
// narration and pair-bias confluence in Phase 3. See the MacroEdge plan.
export default function CurrencyProfilePage() {
  const { currency } = useParams<{ currency: string }>();
  const router = useRouter();
  const C = currency.toUpperCase();
  const tracked = TRACKED_CURRENCIES.includes(C as (typeof TRACKED_CURRENCIES)[number]);

  const [events, setEvents] = useState<CalEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json() as Promise<CalEvent[]>)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const currencyEvents = useMemo(
    () => (events ?? []).filter((e) => e.currency === C),
    [events, C]
  );
  const upcoming = currencyEvents.filter((e) => e.actual === null);
  const released = currencyEvents.filter((e) => e.actual !== null);
  const loading = events === null;

  if (!tracked) {
    return (
      <div className="view">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold hover:opacity-75 text-ink-dim">
          <Icon name="arrow_back" size={16} /> Back
        </button>
        <div className="rounded-2xl px-5 py-4 text-[13px] bg-[rgba(234,82,61,0.07)] border border-[rgba(234,82,61,0.2)] text-coral">
          MacroEdge doesn&apos;t track a calendar/currency profile for {C}.
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold hover:opacity-75 active:scale-95 transition-all text-ink-dim"
      >
        <Icon name="arrow_back" size={16} />
        Back
      </button>

      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg tracking-wide bg-panel-2 text-ink-mid border border-line">
          {C}
        </span>
        <h1 className="font-display font-bold text-[28px] tracking-[-0.025em] text-ink-strong">
          MacroEdge — {C}
        </h1>
      </div>
      <p className="text-[13px] mb-6 text-ink-dim">
        Economic calendar and fundamental context for {C}. Currency scoring and Gavo
        narration are coming in a later phase.
      </p>

      <div className="grid gap-5 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel pad={0}>
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[15px] font-semibold text-ink-strong">Upcoming Events</div>
            <div className="text-[12px] mt-0.5 text-ink-dim">Not yet released</div>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2 p-5">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={42} r={6} />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Icon name="event_busy" size={28} className="text-ink-dim mx-auto mb-2" />
              <div className="text-[13px] text-ink-dim">No upcoming {C} events</div>
            </div>
          ) : (
            upcoming.map((ev, i) => (
              <div
                key={ev.id}
                className={cn("flex items-center gap-3 px-5 py-3", i < upcoming.length - 1 && "border-b border-line")}
              >
                <ImpactDots level={ev.impact} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate text-ink-strong">{ev.event}</div>
                  <div className="text-[11px] text-ink-dim">{ev.date} · {fmtTime(ev.time)}</div>
                </div>
                {ev.forecast && <span className="text-[11.5px] text-ink-dim shrink-0">F: {ev.forecast}{ev.unit}</span>}
              </div>
            ))
          )}
        </Panel>

        <Panel pad={0}>
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[15px] font-semibold text-ink-strong">Recent Releases</div>
            <div className="text-[12px] mt-0.5 text-ink-dim">Actual values reported</div>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2 p-5">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={42} r={6} />)}
            </div>
          ) : released.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Icon name="pending" size={28} className="text-ink-dim mx-auto mb-2" />
              <div className="text-[13px] text-ink-dim">No recent {C} releases</div>
            </div>
          ) : (
            released.map((ev, i) => (
              <div
                key={ev.id}
                className={cn("flex items-center gap-3 px-5 py-3", i < released.length - 1 && "border-b border-line")}
              >
                <ImpactDots level={ev.impact} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate text-ink-strong">{ev.event}</div>
                  <div className="text-[11px] text-ink-dim">{ev.date} · {fmtTime(ev.time)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[11.5px]">
                  {ev.forecast && <span className="text-ink-dim">F: {ev.forecast}{ev.unit}</span>}
                  <span className="text-teal-bright font-semibold">{ev.actual}{ev.unit}</span>
                </div>
              </div>
            ))
          )}
        </Panel>
      </div>

      <div className="mt-5 rounded-xl px-4 py-3 flex items-center gap-2.5 text-[12px] bg-[rgba(248,185,61,0.05)] border border-[rgba(248,185,61,0.15)] text-gold">
        <Icon name="construction" size={14} />
        Currency score, indicator breakdown, and Gavo narration land in Phase 2/3 of MacroEdge.
      </div>
    </div>
  );
}
