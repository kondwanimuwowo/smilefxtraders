"use client";

// Compact weekly COT bias panel for the dashboard's right column — one row
// per instrument with the signal badge and 3-yr index, so the weekly HTF
// filter reaches traders without opening the full COT page. FREE plans get
// an upgrade tease (the /api/cot route itself is Pro/Funded-gated).

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelHead, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { SIGNAL_CFG } from "@/components/cot/signalCfg";
import type { CotEntry } from "@/lib/cot/types";

interface CotBiasData {
  entries: CotEntry[];
  locked:  boolean;
}

function useCotBias() {
  return useQuery<CotBiasData>({
    queryKey: ["cot-bias"],
    queryFn: async () => {
      const res = await fetch("/api/cot");
      if (res.status === 403) return { entries: [], locked: true };
      if (!res.ok) throw new Error(`COT ${res.status}`);
      const entries = (await res.json()) as CotEntry[];
      return { entries: entries.filter((e) => e.totalWeeks > 0), locked: false };
    },
    staleTime: 5 * 60_000, // weekly data — no need to refetch aggressively
  });
}

export function CotBiasPanel() {
  const { data, isLoading, isError } = useCotBias();

  // A dashboard widget shouldn't surface its own error state — the COT page does.
  if (isError) return null;

  const reportDate = data?.entries[0]?.reportDate;

  return (
    <Panel>
      <PanelHead
        title="COT positioning"
        icon="bar_chart"
        action={
          <Link href="/cot" className="text-[12px] font-medium text-teal">
            COT →
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 rounded animate-pulse bg-track" />
          ))}
        </div>
      ) : data?.locked ? (
        <div className="py-3 text-center">
          <Icon name="lock" size={18} className="text-gold mb-1.5" />
          <div className="text-[12.5px] mb-2 text-ink-dim">
            Weekly institutional positioning is a Pro feature.
          </div>
          <Link href="/pricing" className="text-[12px] font-semibold text-teal">
            Upgrade to unlock →
          </Link>
        </div>
      ) : !data || data.entries.length === 0 ? (
        <div className="py-4 text-center text-[12.5px] text-ink-dim">
          No COT data yet.
        </div>
      ) : (
        <>
          {reportDate && (
            <div className="text-[10.5px] mb-2 text-ink-dim">
              Report of {reportDate}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {data.entries.map((e) => {
              const cfg = SIGNAL_CFG[e.signal];
              return (
                <Link
                  key={e.pair}
                  href={`/cot/${e.pair}`}
                  className="flex items-center gap-2 group"
                >
                  <span className="text-[12px] font-semibold shrink-0 text-ink-strong w-[60px] group-hover:text-teal transition-colors">
                    {e.pair}
                  </span>
                  {/* Index position track — thumb at the 3-yr percentile */}
                  <div className="relative flex-1 h-[5px] rounded-full bg-track">
                    <span
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-[9px] rounded-full border-2 border-panel"
                      style={{ left: `${e.cotIndex}%`, background: cfg.strokeColor }}
                    />
                  </div>
                  <span className="text-[10.5px] tabular-nums shrink-0 text-ink-dim w-[24px] text-right">
                    {e.cotIndex}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-[3px] rounded-md border shrink-0 w-[58px] text-center leading-none",
                      cfg.textCls, cfg.bgCls, cfg.borderCls
                    )}
                  >
                    {cfg.shortLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}
