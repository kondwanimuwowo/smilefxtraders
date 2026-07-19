import type { HTMLAttributes, ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  pad?: number | string;
  children: ReactNode;
}

export function Panel({ pad = 20, children, style, className = "", ...rest }: PanelProps) {
  return (
    <div
      className={cn("rounded-2xl bg-panel shadow-md", className)}
      style={{ padding: pad, ...style }}
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
        {icon && <Icon name={icon} size={20} className="text-teal" />}
        <div className="min-w-0">
          <div className="text-[15px] font-semibold truncate text-ink-strong tracking-[0.01em]">
            {title}
          </div>
          {sub && <div className="text-xs mt-0.5 text-ink-dim">{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}
