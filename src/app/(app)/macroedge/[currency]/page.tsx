"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, Panel, PanelHead, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CalEvent } from "@/app/api/calendar/route";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";
import type { MacroScoresResponse } from "@/types/macro";
import { GavoExplanation } from "@/components/macro/GavoExplanation";
import { NewsFeed } from "@/components/macro/NewsFeed";

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
  const [macroData, setMacroData] = useState<MacroScoresResponse | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json() as Promise<CalEvent[]>)
      .then(setEvents)
      .catch(() => setEvents([]));
    fetch("/api/macro/scores")
      .then((r) => r.json() as Promise<MacroScoresResponse>)
      .then(setMacroData)
      .catch(() => setMacroData({ scores: [], pairBiases: [] }));
  }, []);

  const score = useMemo(() => macroData?.scores.find((s) => s.currency === C) ?? null, [macroData, C]);
  const relatedPairBiases = useMemo(
    () => (macroData?.pairBiases ?? []).filter((b) => b.baseCurrency === C || b.quoteCurrency === C),
    [macroData, C]
  );
  const scoresLoading = macroData === null;

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
        Economic calendar and fundamental score for {C}. Pair-bias confluence and Gavo
        narration are coming in a later phase.
      </p>

      {/* Currency Score */}
      <Panel className="mb-5">
        <PanelHead
          title="Fundamental Score"
          icon="analytics"
          sub={score ? `Updated ${new Date(score.computedAt).toLocaleString()}` : scoresLoading ? "Loading…" : "Not yet computed"}
        />
        {scoresLoading ? (
          <Skeleton h={80} r={12} />
        ) : !score ? (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-[12.5px] leading-relaxed bg-[rgba(248,185,61,0.05)] border border-[rgba(248,185,61,0.18)] text-ink-mid">
            <Icon name="info" size={15} fill className="text-gold shrink-0 mt-px" />
            <span>
              No score computed yet for {C}. Scores are built from calendar releases (surprise vs.
              forecast) and FRED/World Bank indicator levels. Run the indicators and scores sync
              jobs to populate this.
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-4">
              <span
                className={cn(
                  "font-display font-bold tabular-nums text-[32px] tracking-[-0.02em]",
                  score.totalScore > 0 ? "text-teal-bright" : score.totalScore < 0 ? "text-coral-bright" : "text-gold"
                )}
              >
                {score.totalScore > 0 ? "+" : ""}
                {score.totalScore.toFixed(1)}
              </span>
              <span className="text-[12px] text-ink-dim">weighted score</span>
            </div>
            <div className="flex flex-col gap-2">
              {score.breakdown.map((b) => (
                <div
                  key={b.indicatorType}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-panel-2 border border-line"
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold tabular-nums w-9 text-center shrink-0 rounded-md py-0.5",
                      b.weightedContribution > 0
                        ? "text-teal-bright bg-[rgba(48,232,223,0.10)]"
                        : b.weightedContribution < 0
                          ? "text-coral-bright bg-[rgba(255,89,66,0.10)]"
                          : "text-ink-dim bg-track"
                    )}
                  >
                    {b.weightedContribution > 0 ? "+" : ""}
                    {b.weightedContribution.toFixed(1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
                      {b.indicatorType.replaceAll("_", " ")} · weight {b.weight}
                    </div>
                    <div className="text-[12px] text-ink-mid truncate">{b.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      {score && (
        <div className="mb-5">
          <GavoExplanation subjectType="CURRENCY" subjectKey={C} />
        </div>
      )}

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
              <Icon name="schedule" size={28} className="text-ink-dim mx-auto mb-2" />
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

      {relatedPairBiases.length > 0 && (
        <Panel className="mt-5" pad={0}>
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[15px] font-semibold text-ink-strong">Pair Bias</div>
            <div className="text-[12px] mt-0.5 text-ink-dim">Pairs involving {C}, base score minus quote score</div>
          </div>
          {relatedPairBiases.map((b, i) => (
            <Link
              key={b.pair}
              href={`/pair/${b.pair.toLowerCase()}`}
              className={cn(
                "flex items-center gap-3 px-5 py-3 hover:bg-panel-2 transition-colors",
                i < relatedPairBiases.length - 1 && "border-b border-line"
              )}
            >
              <span className="text-[12.5px] font-semibold text-ink-strong w-20 shrink-0">{b.pair}</span>
              <span
                className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0",
                  b.biasLabel.includes("BUY")
                    ? "text-teal-bright bg-[rgba(48,232,223,0.10)]"
                    : b.biasLabel.includes("SELL")
                      ? "text-coral-bright bg-[rgba(255,89,66,0.10)]"
                      : "text-gold bg-[rgba(248,185,61,0.10)]"
                )}
              >
                {b.biasLabel.replace("_", " ")}
              </span>
              <span className="text-[11.5px] text-ink-dim ml-auto">
                differential {b.differential > 0 ? "+" : ""}
                {b.differential.toFixed(1)}
              </span>
              <Icon name="chevron_right" size={16} className="text-ink-dim shrink-0" />
            </Link>
          ))}
        </Panel>
      )}

      <div className="mt-5">
        <NewsFeed currency={C} />
      </div>
    </div>
  );
}
