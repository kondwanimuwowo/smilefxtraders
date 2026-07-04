"use client";

import { useStore } from "@/lib/store";
import { Icon } from "./Icon";

export function ToastHost() {
  const toasts = useStore((s) => s.toasts);

  return (
    <div className="fixed bottom-[calc(4.5rem+var(--safe-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[13.5px] font-medium animate-toast-in pointer-events-auto"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
            color: "var(--ink-strong)",
          }}
        >
          <Icon
            name={t.icon}
            size={18}
            fill
            style={{ color: `var(--${t.tone}-bright)`, flexShrink: 0 }}
          />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
