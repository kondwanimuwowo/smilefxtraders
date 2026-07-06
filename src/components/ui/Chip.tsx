import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipTone = "neutral" | "teal" | "coral" | "gold";

const TONES: Record<ChipTone, string> = {
  neutral: "bg-[rgba(154,208,206,0.10)] text-[var(--ink-mid)]",
  teal:    "bg-[rgba(8,174,170,0.16)] text-[var(--teal-bright)]",
  coral:   "bg-[rgba(234,82,61,0.16)] text-[var(--coral-bright)]",
  gold:    "bg-[rgba(248,185,61,0.16)] text-[var(--gold)]",
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
