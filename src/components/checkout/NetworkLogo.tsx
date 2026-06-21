import type { ZmOperator } from "@/lib/mobile-money";

// External brand marks for Zambia's mobile-money networks. These use each
// operator's real brand colours (not app design tokens) so they read as the
// recognisable network logo. Drop-in real PNG/SVG logos later if brand assets
// become available — keep the same `op` → mark mapping.

const BRAND: Record<ZmOperator, { bg: string; fg: string; mark: string }> = {
  airtel: { bg: "#E40000", fg: "#FFFFFF", mark: "airtel" },
  mtn:    { bg: "#FFCB05", fg: "#1A1A1A", mark: "MTN"    },
  zamtel: { bg: "#009A44", fg: "#FFFFFF", mark: "zamtel" },
};

export function NetworkLogo({ op, size = 28 }: { op: ZmOperator; size?: number }) {
  const b = BRAND[op];
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-lg font-bold shrink-0 select-none"
      style={{
        width:        size,
        height:       size,
        background:   b.bg,
        color:        b.fg,
        // MTN's wordmark is lowercase; Airtel/Zamtel render as compact lowercase too
        fontSize:     op === "mtn" ? size * 0.32 : size * 0.26,
        letterSpacing: "-0.02em",
        fontFamily:   "var(--font-display)",
      }}
    >
      {b.mark}
    </span>
  );
}
