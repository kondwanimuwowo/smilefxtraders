import type { ZmOperator } from "@/lib/mobile-money";

// External brand marks for Zambia's mobile-money networks. These use each
// operator's real brand colours (not app design tokens) so they read as the
// recognisable network logo. Drop-in real PNG/SVG logos later if brand assets
// become available — keep the same `op` → mark mapping.

const BRAND: Record<ZmOperator, { bgCls: string; fgCls: string; mark: string }> = {
  airtel: { bgCls: "bg-[#E40000]",   fgCls: "text-white",     mark: "airtel" },
  mtn:    { bgCls: "bg-[#FFCB05]",   fgCls: "text-[#1A1A1A]", mark: "MTN"    },
  zamtel: { bgCls: "bg-[#009A44]",   fgCls: "text-white",     mark: "zamtel" },
};

export function NetworkLogo({ op, size = 28 }: { op: ZmOperator; size?: number }) {
  const b = BRAND[op];
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-lg font-bold font-display shrink-0 select-none tracking-[-0.02em] ${b.bgCls} ${b.fgCls}`}
      style={{
        width:    size,
        height:   size,
        // MTN's wordmark is lowercase; Airtel/Zamtel render as compact lowercase too
        fontSize: op === "mtn" ? size * 0.32 : size * 0.26,
      }}
    >
      {b.mark}
    </span>
  );
}
