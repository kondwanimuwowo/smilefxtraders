"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  createChart, CrosshairMode, LineStyle,
  type Time, type SeriesMarker, ColorType,
  CandlestickSeries, createSeriesMarkers,
} from "lightweight-charts";

export interface Candle { time?: number; o: number; h: number; l: number; c: number; }
export interface Zone { i0: number; i1: number; lo: number; hi: number; type: "fvg" | "ob"; dir: "long" | "short"; }
export interface PriceLine { price: number; label: string; color?: string; }
export interface Mark { i: number; price: number; label: string; type: "bos" | "choch"; }

interface CandleChartProps {
  candles: Candle[];
  height?: number;
  annotations?: { zones?: Zone[]; lines?: PriceLine[]; marks?: Mark[] };
  padPct?: number;
}

function themeColors(isDark: boolean) {
  return {
    text:     isDark ? "rgba(160,175,195,0.8)"  : "rgba(60,75,95,0.75)",
    grid:     isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
    border:   isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)",
    bg:       "transparent",
  };
}

export function CandleChart({ candles, height = 400, annotations = {} }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const c = themeColors(isDark);

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: c.bg },
        textColor:  c.text,
      },
      grid: {
        vertLines: { color: c.grid },
        horzLines: { color: c.grid },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: c.border },
      timeScale: {
        borderColor: c.border,
        timeVisible: true,
      },
    });

    const style    = getComputedStyle(document.documentElement);
    const upColor  = style.getPropertyValue("--teal").trim()  || "#08AEAA";
    const dnColor  = style.getPropertyValue("--coral").trim() || "#EA523D";

    const series = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor:    dnColor,
      borderVisible: false,
      wickUpColor:   upColor,
      wickDownColor: dnColor,
    });

    const baseTime = Math.floor(Date.now() / 1000) - candles.length * 86400;
    const data = candles.map((c, i) => ({
      time:  (c.time ?? (baseTime + i * 86400)) as Time,
      open:  c.o,
      high:  c.h,
      low:   c.l,
      close: c.c,
    }));

    series.setData(data);

    // Price lines (entry, SL, TP)
    annotations.lines?.forEach((line) => {
      series.createPriceLine({
        price:            line.price,
        color:            line.color ?? "#F8B93D",
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            line.label,
      });
    });

    // FVG / OB zones — rendered as top + bottom channel lines with a label on the top line
    annotations.zones?.forEach((zone) => {
      const color = zone.dir === "short" ? "#EA523D" : "#08AEAA";
      series.createPriceLine({
        price:            zone.hi,
        color,
        lineWidth:        1,
        lineStyle:        zone.type === "fvg" ? LineStyle.Dotted : LineStyle.Solid,
        axisLabelVisible: true,
        title:            zone.type.toUpperCase(),
      });
      series.createPriceLine({
        price:            zone.lo,
        color,
        lineWidth:        1,
        lineStyle:        zone.type === "fvg" ? LineStyle.Dotted : LineStyle.Solid,
        axisLabelVisible: false,
        title:            "",
      });
    });

    // BOS / CHoCH markers
    if (annotations.marks?.length) {
      const markers: SeriesMarker<Time>[] = annotations.marks.map((mark) => ({
        time:     data[Math.min(mark.i, data.length - 1)]?.time ?? data[0].time,
        position: "aboveBar" as const,
        color:    mark.type === "choch" ? "#F8B93D" : "#30E8DF",
        shape:    "circle" as const,
        text:     mark.label,
      }));
      createSeriesMarkers(series, markers);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles, height, annotations, isDark]);

  return <div ref={containerRef} className="w-full" />;
}
