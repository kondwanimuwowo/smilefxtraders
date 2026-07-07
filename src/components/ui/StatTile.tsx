import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

type StatTone = "up" | "down" | "gold" | "neutral";

const TONE_TEXT_CLS: Record<StatTone, string> = {
  up:      "text-teal-bright",
  down:    "text-coral-bright",
  gold:    "text-gold",
  neutral: "text-ink-strong",
};

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: StatTone;
  icon?: string;
}

export function StatTile({ label, value, sub, tone = "neutral", icon }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all bg-panel",
        tone === "gold" ? "border-gold shadow-[0_0_20px_rgba(248,185,61,0.15)]" : "border-line shadow-none"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
          {label}
        </div>
        {icon && <Icon name={icon} size={17} className="text-ink-dim" />}
      </div>
      <div
        className={cn("font-display font-bold mt-2 tracking-[-0.02em] text-[clamp(20px,4vw,26px)]", TONE_TEXT_CLS[tone])}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-0.5 text-ink-dim">
          {sub}
        </div>
      )}
    </div>
  );
}
