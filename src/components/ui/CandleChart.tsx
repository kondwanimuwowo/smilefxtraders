"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  createChart, CrosshairMode, LineStyle,
  type Time, type IChartApi, type ISeriesApi, ColorType,
  CandlestickSeries,
} from "lightweight-charts";
import { ZonePrimitive, type ChartZone } from "./chart/ZonePrimitive";

/** One bar. `time` is epoch **seconds**, as the Spotware trendbar parser returns it. */
export interface Candle { time: number; o: number; h: number; l: number; c: number; }

/** A horizontal level with a right-edge label — entry, stop, target. */
export interface PriceLine { price: number; label: string; color: string; }

export interface Zone {
  from:  number;  // epoch seconds
  to:    number;
  price1: number;
  price2: number;
  dir:   "long" | "short";
  label?: string;
}

interface CandleChartProps {
  candles: Candle[];
  height?: number;
  lines?: PriceLine[];
  zones?: Zone[];
  /** Decimal places for the price scale; 5 for most FX, 3 for JPY, 2 for metals. */
  precision?: number;
  /** Off on small cards, where a crosshair is more clutter than information. */
  crosshair?: boolean;
}

// Deliberately quiet. The reference this was rebuilt against (TradingView's
// published ideas) puts the price action first and removes nearly everything
// else: no vertical grid, no scale borders, sparse time labels. The previous
// version drew a full grid in both directions plus four full-width lines per
// zone, which is what made our charts read as noisy next to theirs.
function themeColors(isDark: boolean) {
  return {
    text: isDark ? "rgba(160,175,195,0.55)" : "rgba(60,75,95,0.55)",
    grid: isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.045)",
  };
}

// Module-level so the defaults keep a stable identity. `lines = []` in the
// signature allocates a fresh array on every render, and both are effect
// dependencies — which would re-run the annotation effect continuously.
const NO_LINES: PriceLine[] = [];
const NO_ZONES: Zone[] = [];

export function CandleChart({
  candles, height = 320, lines = NO_LINES, zones = NO_ZONES, precision = 5, crosshair = true,
}: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const zoneRef = useRef<ZonePrimitive | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  // Create once. The old component rebuilt the entire chart whenever any prop
  // changed — including an `annotations` object literal that was new on every
  // render, so /journal/[id] tore down and recreated it continuously.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const c = themeColors(isDark);
    const chart = createChart(container, {
      height,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: c.text,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: c.grid },
      },
      crosshair: { mode: crosshair ? CrosshairMode.Normal : CrosshairMode.Hidden },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.12 } },
      timeScale: { borderVisible: false, timeVisible: false, secondsVisible: false },
      handleScale: crosshair,
      handleScroll: crosshair,
    });

    const style = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const up = token("--teal", "#08AEAA");
    const down = token("--coral", "#EA523D");

    const series = chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderVisible: false,
      wickUpColor: up,
      wickDownColor: down,
      priceFormat: { type: "price", precision, minMove: Math.pow(10, -precision) },
    });

    const zonePrimitive = new ZonePrimitive([]);
    series.attachPrimitive(zonePrimitive);

    chartRef.current = chart;
    seriesRef.current = series;
    zoneRef.current = zonePrimitive;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      zoneRef.current = null;
    };
  }, [height, isDark, crosshair, precision]);

  // Data and annotations update in place, without rebuilding the chart.
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    series.setData(
      candles.map((k) => ({ time: k.time as Time, open: k.o, high: k.h, low: k.l, close: k.c })),
    );

    const style = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;

    const created = lines.map((line) =>
      series.createPriceLine({
        price: line.price,
        color: token(line.color, "#F8B93D"),
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: line.label,
      }),
    );

    zoneRef.current?.setZones(
      zones.map((z): ChartZone => ({
        from: z.from as Time,
        to: z.to as Time,
        price1: z.price1,
        price2: z.price2,
        color: token(z.dir === "long" ? "--teal" : "--coral", z.dir === "long" ? "#08AEAA" : "#EA523D"),
        label: z.label,
      })),
    );

    chart.timeScale().fitContent();

    // Price lines are not data — they accumulate on re-run unless removed.
    return () => { for (const l of created) series.removePriceLine(l); };
  }, [candles, lines, zones]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
