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

  return (
    <div className="view">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em] text-ink-strong">MacroEdge</h1>
        <p className="text-[13px] mt-0.5 text-ink-dim">
          Fundamental currency scores and pair bias, built from economic calendar releases plus FRED/World
          Bank indicator data. See a currency&apos;s full breakdown or a pair&apos;s bias from the tables below.
        </p>
      </div>

      <div className="grid gap-5 grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
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
            scores.map((s, i) => (
              <Link
                key={s.currency}
                href={`/macroedge/${s.currency}`}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 hover:bg-panel-2 transition-colors",
                  i < scores.length - 1 && "border-b border-line"
                )}
              >
                <span className="text-[13px] font-bold text-ink-strong w-10 shrink-0">{s.currency}</span>
                <span
                  className={cn(
                    "font-display font-bold tabular-nums text-[18px] ml-auto",
                    s.totalScore > 0 ? "text-teal-bright" : s.totalScore < 0 ? "text-coral-bright" : "text-gold"
                  )}
                >
                  {s.totalScore > 0 ? "+" : ""}
                  {s.totalScore.toFixed(1)}
                </span>
                <Icon name="chevron_right" size={16} className="text-ink-dim shrink-0" />
              </Link>
            ))
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
            pairBiases.map((b, i) => (
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
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}
