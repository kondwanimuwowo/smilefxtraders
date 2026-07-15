// Standalone 3-bar signal icon — NOT an ICON_REGISTRY entry. Bar count and
// color resolve from the single shared SIGNAL_CFG (signalCfg.ts); this
// component holds no color/label logic of its own.

import type { CotSignal } from "@/lib/cot/types";
import { cn } from "@/lib/cn";
import { SIGNAL_CFG } from "./signalCfg";

export interface SignalBarsProps {
  signal:    CotSignal;
  size?:     "sm" | "md" | "lg" | "xl";
  // Renders the signal's label (e.g. "Bullish Bias") next to the icon.
  showLabel?: boolean;
  className?: string;
}

const SIZE_PX: Record<NonNullable<SignalBarsProps["size"]>, number> = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 44,
};

// Three bars, ascending height left→right, equal width/gap, laid out in a
// fixed 16×16 viewBox (the rendered pixel size is controlled by `size`).
const BAR_WIDTH = 3;
const BARS = [
  { x: 1.5,  y: 9, height: 6  },
  { x: 6.5,  y: 5, height: 10 },
  { x: 11.5, y: 1, height: 14 },
] as const;

export function SignalBars({ signal, size = "md", showLabel = false, className }: SignalBarsProps) {
  const cfg = SIGNAL_CFG[signal];
  const px  = SIZE_PX[size];

  const svg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 16 16"
      role="img"
      aria-label={cfg.label}
      className={showLabel ? undefined : className}
    >
      {BARS.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={bar.y}
          width={BAR_WIDTH}
          height={bar.height}
          rx={1}
          fill={i < cfg.barCount ? cfg.strokeColor : "var(--track)"}
        />
      ))}
    </svg>
  );

  if (!showLabel) return svg;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      {svg}
      <span className={cn("text-center font-semibold leading-tight px-2 py-0.5 rounded text-[12.5px]", cfg.bgCls, cfg.textCls)}>
        {cfg.label}
      </span>
    </div>
  );
}
