"use client";

import { useRef, useEffect } from "react";

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Candle { o: number; h: number; l: number; c: number; }

function gen(seed: number, n: number, vol: number, drift: number): Candle[] {
  const r = rng(seed), out: Candle[] = [];
  let p = 100;
  for (let i = 0; i < n; i++) {
    const o = p, body = (r() - 0.5 + drift) * 2 * vol * (0.4 + r());
    const c = o + body, h = Math.max(o, c) + r() * vol * 0.9, l = Math.min(o, c) - r() * vol * 0.9;
    out.push({ o, h, l, c }); p = c;
  }
  return out;
}

interface ChartVizProps {
  seed?: number;
  n?: number;
  drift?: number;
  h?: number;
  annot?: boolean;
}

export function ChartViz({ seed = 7, n = 40, drift = 0.04, h = 300, annot = true }: ChartVizProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = el.clientWidth || 560;
    const candles = gen(seed, n, 1.4, drift);

    const padR = 4, padT = 10, padB = 10, plotW = W - padR;
    let lo = Math.min(...candles.map(c => c.l));
    let hi = Math.max(...candles.map(c => c.h));
    const pad = (hi - lo) * 0.14; lo -= pad; hi += pad;
    const step = plotW / n, bw = Math.max(2.5, step * 0.58);
    const x = (i: number) => i * step + step / 2;
    const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);

    const upBody = "#08AEAA", upLine = "#30E8DF", dnBody = "#EA523D", dnLine = "#FF5942";
    const gridC = "rgba(14,17,22,0.06)";

    let svg = `<svg viewBox="0 0 ${W} ${h}" width="100%" height="${h}" style="display:block" font-family="IBM Plex Mono,monospace">`;
    svg += `<rect x="0" y="0" width="${plotW}" height="${h}" rx="8" fill="#F6F8F5"/>`;
    for (let g = 0; g <= 4; g++) {
      const gy = padT + (g / 4) * (h - padT - padB);
      svg += `<line x1="0" y1="${gy}" x2="${plotW}" y2="${gy}" stroke="${gridC}"/>`;
    }

    if (annot) {
      const z0 = Math.floor(n * 0.5), z1 = Math.floor(n * 0.66);
      const zhi = candles[z0].h, zlo = candles[z1].l;
      svg += `<rect x="${x(z0) - bw}" y="${y(zhi)}" width="${plotW - x(z0) + bw}" height="${Math.max(3, y(zlo) - y(zhi))}" fill="rgba(8,174,170,0.10)" stroke="rgba(8,174,170,0.55)" stroke-width="1" stroke-dasharray="3 3"/>`;
      svg += `<text x="${x(z0) - bw + 5}" y="${y(zhi) + 13}" fill="#0B807C" font-size="10" font-weight="700" font-family="Space Grotesk,sans-serif">FVG</text>`;
      const liq = lo + (hi - lo) * 0.12;
      svg += `<line x1="0" y1="${y(liq)}" x2="${plotW}" y2="${y(liq)}" stroke="#FF5942" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.85"/>`;
      svg += `<text x="6" y="${y(liq) - 5}" fill="#EA523D" font-size="9.5" font-weight="700" font-family="Space Grotesk,sans-serif">LIQUIDITY SWEEP</text>`;
      const ci = Math.floor(n * 0.62);
      svg += `<circle cx="${x(ci)}" cy="${y(candles[ci].c)}" r="3.5" fill="#F8B93D" stroke="#fff" stroke-width="1.5"/>`;
      svg += `<text x="${x(ci) + 6}" y="${y(candles[ci].c) + 3}" fill="#D99A1E" font-size="10" font-weight="800" font-family="Space Grotesk,sans-serif">CHoCH</text>`;
    }

    candles.forEach((c, i) => {
      const up = c.c >= c.o, body = up ? upBody : dnBody, line = up ? upLine : dnLine;
      const top = y(Math.max(c.o, c.c)), bh = Math.max(1.2, Math.abs(y(c.o) - y(c.c)));
      svg += `<line x1="${x(i)}" y1="${y(c.h)}" x2="${x(i)}" y2="${y(c.l)}" stroke="${line}" stroke-width="1.1"/>`;
      svg += `<rect x="${x(i) - bw / 2}" y="${top}" width="${bw}" height="${bh}" fill="${body}" stroke="${line}" stroke-width="0.6" rx="0.5"/>`;
    });
    svg += `</svg>`;
    el.innerHTML = svg;
  }, [seed, n, drift, h, annot]);

  return <div ref={ref} />;
}

interface SparkVizProps {
  data: number[];
  h?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function SparkViz({ data, h = 40, color = "#08AEAA", style }: SparkVizProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !data.length) return;
    const W = el.clientWidth || 120;
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
    const pts = data.map((v, i) => [
      (i / (data.length - 1)) * W,
      h - ((v - min) / range) * (h - 6) - 3,
    ]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const gid = "sg" + Math.random().toString(36).slice(2, 7);
    el.innerHTML = `<svg viewBox="0 0 ${W} ${h}" width="100%" height="${h}" style="display:block;overflow:visible">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.26"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${d} L ${W} ${h} L 0 ${h} Z" fill="url(#${gid})"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }, [data, h, color]);

  return <div ref={ref} style={style} />;
}
