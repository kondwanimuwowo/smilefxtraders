"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, CSSProperties } from "react";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { clampPosition } from "@/lib/hooks/useClampedPosition";
import { cn } from "@/lib/cn";

// ─── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: ReactNode;
  hint?: string;
  half?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Field({ label, hint, half, children, style }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", half ? "col-span-1" : "col-[1/-1]")} style={style}>
      <span className="text-[12.5px] font-semibold text-ink-mid">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-ink-dim">{hint}</span>}
    </label>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────

// text-base (16px) on the actual <input>/<textarea> elements — anything smaller
// triggers iOS Safari's auto-zoom-on-focus, a real mobile UX bug. Buttons/labels
// elsewhere in this file are unaffected since only focusable text fields zoom.
const inputCls =
  "w-full rounded-[9px] border px-3 py-2.5 text-base sm:text-[13.5px] outline-none transition-colors placeholder:text-[var(--ink-dim)] focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)] bg-panel-2 border-line text-ink-strong";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />;
}

export function MonoInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${inputCls} tabular-nums`}
      inputMode="decimal"
      style={{ fontFeatureSettings: '"tnum"' }}
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={inputCls} {...props} />;
}

// ─── Select ────────────────────────────────────────────────────────────────────

type SelectOption = string | { v: string; l: string } | { header: string };

interface SelectProps {
  value:        string;
  onChange:     (v: string) => void;
  options:      SelectOption[];
  disabled?:    boolean;
  compact?:     boolean;
  borderless?:  boolean;
  placeholder?: string;
}

export function Select({ value, onChange, options, disabled, compact, borderless, placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef      = useRef<HTMLButtonElement>(null);
  const listRef         = useRef<HTMLDivElement>(null);

  const items = options.map((o) => {
    if (typeof o === "string") return { v: o, l: o };
    return o;
  });
  const selected = items.find((o) => "v" in o && o.v === value) as { v: string; l: string } | undefined;

  function toggle() {
    if (disabled) return;
    if (!open) setRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      ) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
    };
  }, [open]);

  const triggerCls = compact
    ? "w-full rounded-lg border px-2.5 py-1.5 text-[12px] flex items-center justify-between gap-1.5 outline-none transition-colors"
    : "w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] flex items-center justify-between gap-2 outline-none transition-colors";

  const displayLabel = selected?.l ?? placeholder ?? "—";
  const isPlaceholder = !selected;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={cn(
          triggerCls,
          "bg-panel-2 disabled:opacity-50",
          borderless ? "border-transparent" : open ? "border-teal" : "border-line",
          isPlaceholder ? "text-ink-dim" : "text-ink-strong",
          open && !borderless && "shadow-[0_0_0_3px_rgba(8,174,170,0.18)]"
        )}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <span
          className={cn(
            "material-symbols-rounded shrink-0 text-ink-dim transition-transform duration-200 ease-app",
            compact ? "text-[14px]" : "text-[18px]",
            open ? "rotate-180" : "rotate-0"
          )}
        >
          expand_more
        </span>
      </button>

      {open && rect && typeof window !== "undefined" &&
        createPortal(
          <div
            ref={listRef}
            className="bg-panel border border-line rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.22)] overflow-hidden max-h-[300px] overflow-y-auto"
            style={{
              position:     "fixed",
              ...clampPosition({ triggerRect: rect, width: compact ? 160 : (rect.width ?? 200), estimatedHeight: 300 }),
              minWidth:     compact ? 160 : (rect?.width ?? 200),
              zIndex:       9999,
            }}
          >
            {items.map((o, idx) => {
              if ("header" in o) {
                return (
                  <div
                    key={`h-${idx}`}
                    className="px-3.5 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-widest text-ink-dim"
                  >
                    {o.header}
                  </div>
                );
              }
              const active = o.v === value;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => { onChange(o.v); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3.5 py-2 text-[13px] flex items-center justify-between gap-2 transition-colors",
                    active
                      ? "bg-[rgba(8,174,170,0.10)] text-teal-bright"
                      : "bg-transparent text-ink-strong hover:bg-hover"
                  )}
                >
                  <span className="font-medium text-[13px]">{o.l}</span>
                  {active && (
                    <span className="material-symbols-rounded ic-fill text-teal text-[15px]">
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

// ─── SegRow ────────────────────────────────────────────────────────────────────

interface SegRowProps {
  value: string;
  onChange: (v: string) => void;
  options: (string | { v: string; l: string })[];
}

export function SegRow({ value, onChange, options }: SegRowProps) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.v;
        const l = typeof o === "string" ? o : o.l;
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 py-2 text-[12.5px] font-semibold rounded-[8px] border transition-colors",
              active
                ? "bg-[rgba(8,174,170,0.12)] border-[rgba(8,174,170,0.4)] text-teal-bright"
                : "bg-panel-2 border-line text-ink-mid"
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ─── ImageDrop ─────────────────────────────────────────────────────────────────

interface ImageDropProps {
  value?: string;
  onChange: (base64: string) => void;
  label?: string;
}

export function ImageDrop({ value, onChange, label = "Drop a chart screenshot" }: ImageDropProps) {
  const ref = useRef<HTMLInputElement>(null);

  const read = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2"); }}
      onDragLeave={(e) => e.currentTarget.classList.remove("ring-2")}
      onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("ring-2"); read(e.dataTransfer.files[0]); }}
      className="rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-teal border-line"
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => read(e.target.files?.[0] ?? null)}
      />
      {value ? (
        <img src={value} alt="chart" className="w-full rounded-xl block" />
      ) : (
        <div className="flex flex-col items-center py-7 text-center text-ink-dim">
          <Icon name="add_photo_alternate" size={26} />
          <div className="text-[12.5px] mt-1.5">{label}</div>
        </div>
      )}
    </div>
  );
}
