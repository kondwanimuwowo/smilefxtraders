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
        <div className="w-16 h-16 rounded-2xl grid place-items-center mb-4 bg-[radial-gradient(circle,rgba(8,174,170,0.10)_0%,transparent_70%)] shadow-sm">
          <Icon name={icon} size={28} className="text-ink-dim" />
        </div>
      </div>
      <div className="text-base font-semibold mb-1.5 text-ink-strong">
        {title}
      </div>
      <div className="text-[13.5px] max-w-xs leading-relaxed text-ink-dim">
        {body}
      </div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
