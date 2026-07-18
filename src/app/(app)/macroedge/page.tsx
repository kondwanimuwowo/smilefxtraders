"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, Panel, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MacroScoresResponse } from "@/types/macro";

export default function MacroEdgeOverviewPage() {
  const [data, setData] = useState<MacroScoresResponse | null>(null);

  useEffect(() => {
    fetch("/api/macro/scores")
      .then((r) => r.json() as Promise<MacroScoresResponse>)
      .then(setData)
      .catch(() => setData({ scores: [], pairBiases: [] }));
  }, []);

  const loading = data === null;
  const scores = [...(data?.scores ?? [])].sort((a, b) => b.totalScore - a.totalScore);
  const pairBiases = data?.pairBiases ?? [];

  const maxAbsScore = Math.max(1, ...scores.map((s) => Math.abs(s.totalScore)));
  const maxAbsDiff = Math.max(1, ...pairBiases.map((b) => Math.abs(b.differential)));
  const strongest = scores[0];
  const weakest = scores[scores.length - 1];

  return (
    <div className="view">
      <div className="mb-5">
        <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">MacroEdge</h1>
        <p className="text-[13px] mt-0.5 text-ink-dim">
          Fundamental currency scores and pair bias, built from economic calendar releases plus FRED/World
          Bank indicator data. See a currency&apos;s full breakdown or a pair&apos;s bias from the tables below.
        </p>
      </div>

      {!loading && scores.length > 1 && (
        <div className="grid gap-3 grid-cols-2 mb-5">
          <Link
            href={`/macroedge/${strongest.currency}`}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-panel border border-line hover:border-teal-bright transition-colors"
          >
            <span className="flex items-center justify-center size-9 rounded-xl shrink-0 bg-[rgba(48,232,223,0.10)]">
              <Icon name="trending_up" size={17} className="text-teal-bright" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-ink-dim">Strongest</div>
              <div className="text-[15px] font-bold text-ink-strong">
                {strongest.currency} <span className="text-teal-bright tabular-nums">+{strongest.totalScore.toFixed(1)}</span>
              </div>
            </div>
          </Link>
          <Link
            href={`/macroedge/${weakest.currency}`}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-panel border border-line hover:border-coral-bright transition-colors"
          >
            <span className="flex items-center justify-center size-9 rounded-xl shrink-0 bg-[rgba(255,89,66,0.10)]">
              <Icon name="trending_down" size={17} className="text-coral-bright" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-ink-dim">Weakest</div>
              <div className="text-[15px] font-bold text-ink-strong">
                {weakest.currency} <span className="text-coral-bright tabular-nums">{weakest.totalScore.toFixed(1)}</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel pad={0}>
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[15px] font-semibold text-ink-strong">Currency Scoreboard</div>
            <div className="text-[12px] mt-0.5 text-ink-dim">Weighted fundamental score, highest first</div>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={48} r={8} />)}
            </div>
          ) : scores.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Icon name="analytics" size={28} className="text-ink-dim mx-auto mb-2" />
              <div className="text-[13px] text-ink-dim">No scores computed yet</div>
            </div>
          ) : (
            scores.map((s, i) => {
              const positive = s.totalScore > 0;
              const negative = s.totalScore < 0;
              const barPct = Math.max(4, (Math.abs(s.totalScore) / maxAbsScore) * 100);
              return (
                <Link
                  key={s.currency}
                  href={`/macroedge/${s.currency}`}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 hover:bg-panel-2 transition-colors",
                    i < scores.length - 1 && "border-b border-line"
                  )}
                >
                  <span className="text-[13px] font-bold text-ink-strong w-10 shrink-0">{s.currency}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-track overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", positive ? "bg-teal-bright" : negative ? "bg-coral-bright" : "bg-gold")}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-display font-bold tabular-nums text-[15px] shrink-0",
                      positive ? "text-teal-bright" : negative ? "text-coral-bright" : "text-gold"
                    )}
                  >
                    {s.totalScore > 0 ? "+" : ""}
                    {s.totalScore.toFixed(1)}
                  </span>
                  <Icon name="chevron_right" size={16} className="text-ink-dim shrink-0" />
                </Link>
              );
            })
          )}
        </Panel>

        <Panel pad={0}>
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[15px] font-semibold text-ink-strong">Pair Bias</div>
            <div className="text-[12px] mt-0.5 text-ink-dim">Base score minus quote score, thresholded into a bias label</div>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={48} r={8} />)}
            </div>
          ) : pairBiases.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Icon name="bar_chart" size={28} className="text-ink-dim mx-auto mb-2" />
              <div className="text-[13px] text-ink-dim">No pair biases computed yet</div>
            </div>
          ) : (
            pairBiases.map((b, i) => {
              const tone = b.biasLabel.includes("BUY") ? "teal-bright" : b.biasLabel.includes("SELL") ? "coral-bright" : "gold";
              const barPct = Math.max(4, (Math.abs(b.differential) / maxAbsDiff) * 100);
              return (
                <Link
                  key={b.pair}
                  href={`/pair/${b.pair.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 hover:bg-panel-2 transition-colors",
                    i < pairBiases.length - 1 && "border-b border-line"
                  )}
                >
                  <span className="text-[13px] font-semibold text-ink-strong w-20 shrink-0">{b.pair}</span>
                  <span
                    className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0",
                      `text-${tone}`,
                      tone === "teal-bright" && "bg-[rgba(48,232,223,0.10)]",
                      tone === "coral-bright" && "bg-[rgba(255,89,66,0.10)]",
                      tone === "gold" && "bg-[rgba(248,185,61,0.10)]"
                    )}
                  >
                    {b.biasLabel.replace("_", " ")}
                  </span>
                  <div className="hidden sm:block flex-1 h-1.5 rounded-full bg-track overflow-hidden">
                    <div className={cn("h-full rounded-full", `bg-${tone}`)} style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="text-[11.5px] text-ink-dim shrink-0 ml-auto sm:ml-0">
                    {b.differential > 0 ? "+" : ""}
                    {b.differential.toFixed(1)}
                  </span>
                  <Icon name="chevron_right" size={16} className="text-ink-dim shrink-0" />
                </Link>
              );
            })
          )}
        </Panel>
      </div>
    </div>
  );
}
