"use client";

import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { macroDirection, reconcileBias, type Direction, type ReconcileKind } from "@/lib/bias-reconcile";
import type { MacroScoresResponse } from "@/types/macro";

const TONE: Record<ReconcileKind, { icon: string; iconCls: string }> = {
  agree:      { icon: "check_circle", iconCls: "text-teal-deep" },
  conflict:   { icon: "warning",      iconCls: "text-gold-deep" },
  macro_only: { icon: "info",         iconCls: "text-ink-dim" },
  tech_only:  { icon: "info",         iconCls: "text-ink-dim" },
  none:       { icon: "remove",       iconCls: "text-ink-dim" },
};

/** Reads the technical verdict and the MacroEdge pair bias together. Renders nothing for pairs MacroEdge does not score. */
export function BiasReconcile({ pair, techTotal }: { pair: string; techTotal: number }) {
  const { data } = useQuery({
    queryKey: ["macro-scores"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const res = await fetch("/api/macro/scores");
      if (!res.ok) throw new Error(`macro/scores responded ${res.status}`);
      return res.json() as Promise<MacroScoresResponse>;
    },
  });
  const bias = data?.pairBiases.find((b) => b.pair === pair);
  if (!bias) return null;

  const tech: Direction = techTotal > 0 ? 1 : techTotal < 0 ? -1 : 0;
  const r = reconcileBias(tech, macroDirection(bias.biasLabel));
  const tone = TONE[r.kind];

  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 bg-panel shadow-sm">
      <Icon name={tone.icon} size={17} className={cn("shrink-0 mt-px", tone.iconCls)} />
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink-strong">{r.title}</div>
        <p className="text-[12.5px] leading-relaxed text-ink-mid mt-0.5">{r.body}</p>
      </div>
    </div>
  );
}
