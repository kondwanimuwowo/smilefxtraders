"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

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
      className="fixed inset-0 z-50 flex justify-end"
      style={{
        background: open ? "rgba(7,33,46,0.45)" : "transparent",
        backdropFilter: open ? "blur(2px)" : "none",
        pointerEvents: open ? "auto" : "none",
        transition: "background 260ms var(--ease-app), backdrop-filter 260ms",
      }}
      onMouseDown={onClose}
    >
      <div
        className="flex flex-col h-full"
        style={{
          width,
          background: "var(--panel)",
          boxShadow: "-16px 0 50px rgba(0,0,0,0.3)",
          borderLeft: "1px solid var(--line)",
          transform: open ? "translateX(0)" : "translateX(calc(100% + 70px))",
          transition: "transform 260ms var(--ease-app)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--line)" }}>
          <div className="font-display text-[18px] font-semibold" style={{ color: "var(--ink-strong)" }}>
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors"
            style={{ color: "var(--ink-mid)" }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {open && children}
        </div>

        {/* Footer */}
        {footer && open && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: "var(--line)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
