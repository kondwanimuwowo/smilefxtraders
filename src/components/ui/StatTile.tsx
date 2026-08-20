import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

type StatTone = "up" | "down" | "gold" | "neutral";

const TONE_TEXT_CLS: Record<StatTone, string> = {
  up:      "text-teal-deep",
  down:    "text-coral-deep",
  gold:    "text-gold-deep",
  neutral: "text-ink-strong",
};

// The sub-label is a tinted pill rather than loose grey text, matching the
// design prototype's stat tile. It carries the tile's own tone, so the colour
// that means something sits on a surface instead of on 11px type -- which is
// also how it stays readable: --gold on a light panel is 1.75:1 as text, while
// --gold-deep on --gold-tint is 5.12:1.
const TONE_PILL_CLS: Record<StatTone, string> = {
  up:      "bg-teal-tint text-teal-deep",
  down:    "bg-coral-tint text-coral-deep",
  gold:    "bg-gold-tint text-gold-deep",
  neutral: "bg-panel-2 text-ink-mid",
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
    // One shadow for every tone. The gold tile used to ring itself in a 2px
    // gold outline plus a glow; with a gold sub-pill it already reads as the
    // odd one out, and the ring was doing the same job twice and louder.
    <div className="rounded-2xl p-4 transition-all bg-panel shadow-sm">
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
        <div
          className={cn(
            "inline-flex items-center mt-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold",
            TONE_PILL_CLS[tone],
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
