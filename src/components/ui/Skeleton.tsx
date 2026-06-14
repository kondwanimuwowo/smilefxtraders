import type { CSSProperties } from "react";

interface SkeletonProps {
  h?: number | string;
  w?: number | string;
  r?: number;
  style?: CSSProperties;
}

export function Skeleton({ h = 16, w = "100%", r = 7, style }: SkeletonProps) {
  return (
    <div
      className="animate-pulse"
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background: "var(--track)",
        ...style,
      }}
    />
  );
}
