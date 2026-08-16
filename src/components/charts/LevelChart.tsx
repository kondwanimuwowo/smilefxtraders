"use client";

import { useMemo } from "react";
import { CandleChart, Icon, Skeleton, type PriceLine } from "@/components/ui";
import { useCandles, pricePrecision, type CandlePeriod } from "@/lib/hooks/useCandles";

/**
 * Real candles around a moment, annotated with that record's own levels.
 *
 * Shared by the trade chart and the alert chart because the two differ only in
 * where the numbers come from: both are "here is the price action around this
 * event, and here is where the levels sat". Keeping one implementation means
 * the journal and the alert feed cannot drift into disagreeing about what a
 * 50-pip move looked like.
 */
export interface LevelChartProps {
  pair:      string;
  direction: "long" | "short";
  /** The event the window is centred on — a trade's entry, an alert being posted. */
  at:        Date;
  /** Where the story ends, if it has: a trade's close. Defaults to a symmetric window. */
  until?:    Date | null;
  entry?:    number | null;
  stop?:     number | null;
  targets?:  Array<{ price: number; label: string }>;
  height?:   number;
  period?:   CandlePeriod;
  /** Off on cards, where panning is a nuisance rather than a feature. */
  interactive?: boolean;
}

/** Bars either side of the event, per period. Enough context to read structure, not so much it flattens. */
const CONTEXT_BARS = 60;
const PERIOD_MS: Record<CandlePeriod, number> = {
  M15: 900_000, M30: 1_800_000, H1: 3_600_000, H4: 14_400_000, D1: 86_400_000,
};

export function LevelChart({
  pair, direction, at, until, entry, stop, targets = [],
  height = 320, period = "H1", interactive = true,
}: LevelChartProps) {
  const span = PERIOD_MS[period] * CONTEXT_BARS;

  // Anchored to the end, not centred on the event. An alert posted minutes ago
  // was asking for 60 bars of future, so the chart came back with a dozen very
  // fat candles. Clamping the end to now and taking a fixed span backwards
  // gives every chart a consistent density, while still containing the event.
  const to = useMemo(
    () => new Date(Math.min((until ?? at).getTime() + span, Date.now())),
    [at, until, span],
  );
  const from = useMemo(() => new Date(to.getTime() - span * 2), [to, span]);

  const { data: candles, isPending, error } = useCandles({ pair, period, from, to });

  // Keyed on the values rather than the array, because callers build `targets`
  // inline — a new identity every render, which would rebuild the price lines
  // on the chart continuously.
  const targetKey = targets.map((t) => `${t.label}:${t.price}`).join("|");
  const lines = useMemo<PriceLine[]>(() => {
    const out: PriceLine[] = [];
    if (entry != null) out.push({ price: entry, label: "Entry", color: direction === "long" ? "--teal" : "--coral" });
    if (stop != null) out.push({ price: stop, label: "SL", color: "--coral-bright" });
    for (const pair of targetKey ? targetKey.split("|") : []) {
      const [label, price] = pair.split(":");
      out.push({ price: Number(price), label, color: "--teal-bright" });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, stop, targetKey, direction]);

  if (isPending) {
    return <Skeleton h={height} r={12} />;
  }

  // Never an empty chart: a blank price area is indistinguishable from a quiet
  // market, and the whole point of this rebuild is that a missing chart is
  // honest where an invented or ambiguous one is not.
  if (error || !candles || candles.length === 0) {
    return (
      <div
        className="rounded-xl flex flex-col items-center justify-center gap-1.5 bg-panel-2"
        style={{ height }}
      >
        <Icon name="show_chart" size={22} className="text-ink-dim" />
        <div className="text-[12px] text-ink-dim">
          {error ? "Chart data unavailable" : "No price data for this period"}
        </div>
      </div>
    );
  }

  return (
    <CandleChart
      candles={candles}
      lines={lines}
      height={height}
      precision={pricePrecision(pair)}
      crosshair={interactive}
    />
  );
}
