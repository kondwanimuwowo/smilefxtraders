// Shared COT signal display config — the ONE copy used by the COT overview
// cards, the COT detail page, and the pair hub. Neutral is gold platform-wide
// ("no clear bias" tone), matching the verdict styling in the pair hub.

import type { CotSignal } from "@/lib/cot/types";

export interface SignalCfg {
  label:       string;
  shortLabel:  string;
  textCls:     string;
  bgCls:       string;
  borderCls:   string;
  icon:        string;
  // Raw var(--x) string for SVG stroke props (Ring/Sparkline) — not a className.
  strokeColor: string;
  // Bars filled (of 3) in the SignalBars icon — brightness-variant mapping.
  barCount:    1 | 2 | 3;
}

export const SIGNAL_CFG: Record<CotSignal, SignalCfg> = {
  strong_bull: { label: "Strong Bullish Setup", shortLabel: "S.Bull",  textCls: "text-teal-bright",  bgCls: "bg-[rgba(48,232,223,0.10)]", borderCls: "border-[rgba(48,232,223,0.22)]", icon: "trending_up",    strokeColor: "var(--teal-bright)",  barCount: 3 },
  bull:        { label: "Bullish Bias",          shortLabel: "Bull",    textCls: "text-teal",         bgCls: "bg-[rgba(8,174,170,0.08)]",  borderCls: "border-[rgba(8,174,170,0.20)]",  icon: "arrow_upward",   strokeColor: "var(--teal)",         barCount: 3 },
  neutral:     { label: "Neutral / Mixed",       shortLabel: "Neutral", textCls: "text-gold",         bgCls: "bg-[rgba(248,185,61,0.08)]", borderCls: "border-[rgba(248,185,61,0.20)]", icon: "remove",         strokeColor: "var(--gold)",         barCount: 2 },
  bear:        { label: "Bearish Bias",          shortLabel: "Bear",    textCls: "text-coral",        bgCls: "bg-[rgba(234,82,61,0.08)]",  borderCls: "border-[rgba(234,82,61,0.20)]",  icon: "arrow_downward", strokeColor: "var(--coral)",        barCount: 1 },
  strong_bear: { label: "Strong Bearish Setup",  shortLabel: "S.Bear",  textCls: "text-coral-bright", bgCls: "bg-[rgba(255,89,66,0.10)]",  borderCls: "border-[rgba(255,89,66,0.22)]",  icon: "trending_down",  strokeColor: "var(--coral-bright)", barCount: 1 },
};
