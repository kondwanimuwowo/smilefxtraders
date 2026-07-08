"use client";

import { useStore, type ToastTone } from "@/lib/store";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

// gold has no "-bright" variant registered (only teal-bright/coral-bright
// exist) — var(--gold-bright) was already a silent no-op pre-migration;
// kept as an arbitrary-value class referencing the same undefined token
// rather than "fixed" to a real color.
const TONE_TEXT_CLS: Record<ToastTone, string> = {
  teal:  "text-[var(--teal-bright)]",
  gold:  "text-[var(--gold-bright)]",
  coral: "text-[var(--coral-bright)]",
};

export function ToastHost() {
  const toasts = useStore((s) => s.toasts);

  return (
    <div className="fixed bottom-[calc(4.5rem+var(--safe-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[13.5px] font-medium animate-toast-in pointer-events-auto bg-panel border border-line shadow-[0_6px_18px_rgba(0,0,0,0.32)] text-ink-strong"
        >
          <Icon
            name={t.icon}
            size={18}
            fill
            className={cn("shrink-0", TONE_TEXT_CLS[t.tone])}
          />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
