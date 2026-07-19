"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Panel, PanelHead, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MacroScoresResponse } from "@/types/macro";
import { GavoExplanation } from "./GavoExplanation";

function ScoreChip({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-panel-2 shadow-sm flex-1">
      <Link
        href={`/macroedge/${label}`}
        className="text-[11px] font-bold px-1.5 py-0.5 rounded-md tracking-wide bg-panel shadow-sm text-ink-mid hover:text-teal transition-colors shrink-0"
      >
        {label}
      </Link>
      <span
        className={cn(
          "font-display font-bold tabular-nums text-[16px] ml-auto",
          score > 0 ? "text-teal-bright" : score < 0 ? "text-coral-bright" : "text-gold"
        )}
      >
        {score > 0 ? "+" : ""}
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// Embedded in the pair hub (pair/[pair]/page.tsx) — Layer 3/4/6 of MacroEdge.
// Not a competing route, per the plan's folder-structure notes.
export function FundamentalsPanel({ pair }: { pair: string }) {
  const [data, setData] = useState<MacroScoresResponse | null>(null);

  useEffect(() => {
    fetch("/api/macro/scores")
      .then((r) => r.json() as Promise<MacroScoresResponse>)
      .then(setData)
      .catch(() => setData({ scores: [], pairBiases: [] }));
  }, []);

  const bias = useMemo(() => data?.pairBiases.find((b) => b.pair === pair) ?? null, [data, pair]);
  const loading = data === null;

  if (!loading && !bias) {
    return (
      <Panel>
        <PanelHead title="Fundamentals" icon="analytics" />
        <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-[12.5px] leading-relaxed bg-panel-2 shadow-sm text-ink-dim">
          <Icon name="info" size={15} className="text-ink-dim shrink-0 mt-px" />
          <span>
            MacroEdge doesn&apos;t compute a fundamental score for {pair} — its non-USD leg isn&apos;t one of the
            currencies this platform collects economic data for (USD, EUR, GBP, NZD).
          </span>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHead
        title="Fundamentals"
        icon="analytics"
        sub={bias ? `Bias: ${bias.biasLabel.replace("_", " ")} · differential ${bias.differential > 0 ? "+" : ""}${bias.differential.toFixed(1)}` : "Loading…"}
      />
      {loading ? (
        <div className="h-16 rounded-xl bg-panel-2 animate-pulse" />
      ) : bias ? (
        <>
          <div className="flex items-stretch gap-2 mb-4">
            <ScoreChip label={bias.baseCurrency} score={bias.baseScore} />
            <ScoreChip label={bias.quoteCurrency} score={bias.quoteScore} />
          </div>
          <GavoExplanation subjectType="PAIR" subjectKey={pair} />
        </>
      ) : null}
    </Panel>
  );
}
