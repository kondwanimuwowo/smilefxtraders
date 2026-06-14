import type { ReactNode, CSSProperties } from "react";

type ChipTone = "neutral" | "teal" | "coral" | "gold";

const TONES: Record<ChipTone, { bg: string; fg: string }> = {
  neutral: { bg: "rgba(154,208,206,0.10)", fg: "var(--ink-mid)" },
  teal:    { bg: "rgba(8,174,170,0.16)",   fg: "var(--teal-bright)" },
  coral:   { bg: "rgba(234,82,61,0.16)",   fg: "var(--coral-bright)" },
  gold:    { bg: "rgba(248,185,61,0.16)",  fg: "var(--gold)" },
};

interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  style?: CSSProperties;
}

export function Chip({ children, tone = "neutral", style }: ChipProps) {
  const { bg, fg } = TONES[tone];
  return (
    <span
      className="inline-block whitespace-nowrap text-[11px] font-semibold rounded-[6px]"
      style={{ padding: "3px 9px", background: bg, color: fg, ...style }}
    >
      {children}
    </span>
  );
}
