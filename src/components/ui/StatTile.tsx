import { Icon } from "./Icon";

type StatTone = "up" | "down" | "gold" | "neutral";

const TONE_COLORS: Record<StatTone, string> = {
  up:      "var(--teal-bright)",
  down:    "var(--coral-bright)",
  gold:    "var(--gold)",
  neutral: "var(--ink-strong)",
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
      className="rounded-2xl border p-4 transition-all"
      style={{ 
        background: "var(--panel)", 
        borderColor: tone === "gold" ? "var(--gold)" : "var(--line)",
        boxShadow: tone === "gold" ? "0 0 20px rgba(248, 185, 61, 0.15)" : "none"
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--ink-dim)" }}
        >
          {label}
        </div>
        {icon && <Icon name={icon} size={17} style={{ color: "var(--ink-dim)" }} />}
      </div>
      <div
        className="font-display font-bold mt-2"
        style={{ color: TONE_COLORS[tone], letterSpacing: "-0.02em", fontSize: "clamp(20px, 4vw, 26px)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: "var(--ink-dim)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
