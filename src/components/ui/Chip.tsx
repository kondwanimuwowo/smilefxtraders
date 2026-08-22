import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipTone = "neutral" | "teal" | "coral" | "gold";

const TONES: Record<ChipTone, string> = {
  neutral: "bg-[rgba(154,208,206,0.10)] text-[var(--ink-mid)]",
  teal:    "bg-teal-tint text-[var(--teal-deep)]",
  coral:   "bg-coral-tint text-[var(--coral-deep)]",
  gold:    "bg-gold-tint text-[var(--gold-deep)]",
};

interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}

export function Chip({ children, tone = "neutral", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap text-[11px] font-semibold rounded-[6px] px-[9px] py-[3px]",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
