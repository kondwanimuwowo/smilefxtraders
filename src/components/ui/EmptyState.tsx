import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="float">
        <div
          className="w-16 h-16 rounded-2xl grid place-items-center mb-4"
          style={{ background: "radial-gradient(circle, rgba(8,174,170,0.10) 0%, transparent 70%)", border: "1px solid rgba(8,174,170,0.15)" }}
        >
          <Icon name={icon} size={28} style={{ color: "var(--ink-dim)" }} />
        </div>
      </div>
      <div className="text-base font-semibold mb-1.5" style={{ color: "var(--ink-strong)" }}>
        {title}
      </div>
      <div className="text-[13.5px] max-w-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        {body}
      </div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
