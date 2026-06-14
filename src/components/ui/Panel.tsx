import type { HTMLAttributes, ReactNode, CSSProperties } from "react";
import { Icon } from "./Icon";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  pad?: number | string;
  children: ReactNode;
}

export function Panel({ pad = 20, children, style, className = "", ...rest }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{
        background: "var(--panel)",
        borderColor: "var(--line)",
        padding: pad,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

interface PanelHeadProps {
  title: string;
  icon?: string;
  sub?: string;
  action?: ReactNode;
  style?: CSSProperties;
}

export function PanelHead({ title, icon, sub, action, style }: PanelHeadProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4" style={style}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <Icon name={icon} size={20} style={{ color: "var(--teal)" }} />}
        <div className="min-w-0">
          <div
            className="text-[15px] font-semibold truncate"
            style={{ color: "var(--ink-strong)", letterSpacing: "0.01em" }}
          >
            {title}
          </div>
          {sub && (
            <div className="text-xs mt-0.5" style={{ color: "var(--ink-dim)" }}>
              {sub}
            </div>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
