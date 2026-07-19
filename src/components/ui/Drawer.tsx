"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, width = 460, footer, children }: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end",
        open ? "bg-[rgba(7,33,46,0.45)] backdrop-blur-[2px] pointer-events-auto" : "bg-transparent backdrop-blur-none pointer-events-none"
      )}
      style={{ transition: "background 260ms var(--ease-app), backdrop-filter 260ms" }}
      onMouseDown={onClose}
    >
      <div
        className={cn(
          "flex flex-col h-full w-full bg-panel shadow-[-10px_0_26px_rgba(0,0,0,0.3)] transition-transform duration-[260ms] ease-app",
          open ? "translate-x-0" : "translate-x-[calc(100%+70px)]"
        )}
        style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pb-4 shrink-0 pt-[calc(1rem+var(--safe-top))]">
          <div className="font-display text-[18px] font-semibold text-ink-strong">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors text-ink-mid"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          className={cn("flex-1 overflow-y-auto px-6 pt-5", !footer ? "pb-[calc(1.25rem+var(--safe-bottom))]" : "pb-5")}
        >
          {open && children}
        </div>

        {/* Footer */}
        {footer && open && (
          <div className="flex items-center justify-end gap-3 px-6 pt-4 bg-panel-2 shrink-0 pb-[calc(1rem+var(--safe-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
