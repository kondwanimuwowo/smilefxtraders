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
    const token    = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    const upColor  = token("--teal", "#08AEAA");
    const dnColor  = token("--coral", "#EA523D");
    // The annotation layers below used to hardcode these three. The body/wick
    // colors above already read from tokens, so a theme or direction-colour
    // tweak moved the candles but left the FVG/OB zones, price lines and
    // BOS/CHoCH markers on the old palette — see CLAUDE.md, which requires the
    // whole candle scheme stay tweakable.
    const goldColor   = token("--gold", "#F8B93D");
    const brightColor = token("--teal-bright", "#30E8DF");

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
        color:            line.color ?? goldColor,
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            line.label,
      });
    });

    // FVG / OB zones — rendered as top + bottom channel lines with a label on the top line
    annotations.zones?.forEach((zone) => {
      const color = zone.dir === "short" ? dnColor : upColor;
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
        color:    mark.type === "choch" ? goldColor : brightColor,
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
