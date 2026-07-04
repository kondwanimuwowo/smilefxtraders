"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ open, onClose, title, sub, width = 560, footer, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7,33,46,0.55)", backdropFilter: "blur(4px)" }}
      onMouseDown={onClose}
    >
      <div
        className="relative w-full rounded-[18px] flex flex-col animate-modal-pop"
        style={{
          maxWidth: width,
          background: "var(--panel)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
          border: "1px solid var(--line)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="min-w-0">
            <div className="font-display text-[19px] font-semibold" style={{ color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
              {title}
            </div>
            {sub && <div className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>{sub}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors mt-0.5"
            style={{ color: "var(--ink-mid)" }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 px-6 pt-4 border-t"
            style={{ borderColor: "var(--line)", paddingBottom: "calc(1rem + var(--safe-bottom))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
