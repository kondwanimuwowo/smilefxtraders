import type { CSSProperties, ReactNode } from "react";

interface Cell {
  label: string;
  value: ReactNode;
  align?: "left" | "right";
}

interface ResponsiveRowProps {
  /** Desktop grid-template-columns — passed through unchanged so md:+ visuals stay pixel-identical. */
  gridTemplateColumns: string;
  cells: Cell[];
  /** Extra classes for the desktop grid row (e.g. "items-center px-5 py-3"). */
  className?: string;
  style?: CSSProperties;
}

// Renders the existing desktop grid row unchanged on md:+, and a stacked
// label:value card below md — used for record lists (one row = one entity)
// where a grid with fixed narrow columns becomes unreadable on a phone.
export function ResponsiveRow({ gridTemplateColumns, cells, className = "", style }: ResponsiveRowProps) {
  return (
    <>
      <div className={`hidden md:grid ${className}`} style={{ gridTemplateColumns, ...style }}>
        {cells.map((c, i) => (
          <div key={i} className={c.align === "right" ? "text-right" : undefined}>
            {c.value}
          </div>
        ))}
      </div>

      <div className="md:hidden flex flex-col gap-2 rounded-xl p-3.5 mb-2 bg-panel-2 shadow-sm">
        {cells.map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide shrink-0 text-ink-dim">
              {c.label}
            </span>
            <span className="text-right min-w-0">{c.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
