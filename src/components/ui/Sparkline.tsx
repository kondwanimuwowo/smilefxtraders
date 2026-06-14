"use client";

import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeW?: number;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "var(--teal-bright)",
  fill = true,
  strokeW = 2,
}: SparklineProps) {
  const uid = useId();
  const gid = "spk-" + uid.replace(/:/g, "");

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;

  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / rng) * (height - 4) - 2,
  ]);

  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
