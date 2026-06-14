"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, CSSProperties } from "react";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

// ─── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint?: string;
  half?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Field({ label, hint, half, children, style }: FieldProps) {
  return (
    <label
      className="flex flex-col gap-1.5"
      style={{ gridColumn: half ? "span 1" : "1 / -1", ...style }}
    >
      <span className="text-[12.5px] font-semibold" style={{ color: "var(--ink-mid)" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[11.5px]" style={{ color: "var(--ink-dim)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none transition-colors placeholder:text-[var(--ink-dim)] focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)]";

const inputStyle = {
  background: "var(--panel-2)",
  borderColor: "var(--line)",
  color: "var(--ink-strong)",
};

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} style={inputStyle} {...props} />;
}

export function MonoInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${inputCls} tabular-nums`}
      inputMode="decimal"
      style={{ ...inputStyle, fontFeatureSettings: '"tnum"' }}
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={inputCls}
      style={inputStyle}
      {...props}
    />
  );
}

// ─── Select ────────────────────────────────────────────────────────────────────

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: (string | { v: string; l: string })[];
  disabled?: boolean;
}

export function Select({ value, onChange, options, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef      = useRef<HTMLButtonElement>(null);
  const listRef         = useRef<HTMLDivElement>(null);

  const normalised = options.map((o) => (typeof o === "string" ? { v: o, l: o } : o));
  const selected   = normalised.find((o) => o.v === value);

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

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] flex items-center justify-between gap-2 outline-none transition-colors"
        style={{
          background:  "var(--panel-2)",
          borderColor: open ? "var(--teal)" : "var(--line)",
          color:       "var(--ink-strong)",
          opacity:     disabled ? 0.5 : 1,
          cursor:      disabled ? "not-allowed" : "pointer",
          boxShadow:   open ? "0 0 0 3px rgba(8,174,170,0.18)" : undefined,
        }}
      >
        <span className="truncate text-left">{selected?.l ?? "—"}</span>
        <span
          className="material-symbols-rounded shrink-0"
          style={{
            fontSize:   18,
            color:      "var(--ink-dim)",
            transition: "transform 200ms var(--ease-app)",
            transform:  open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          expand_more
        </span>
      </button>

      {open && typeof window !== "undefined" &&
        createPortal(
          <div
            ref={listRef}
            style={{
              position:     "fixed",
              top:          (rect?.bottom ?? 0) + 5,
              left:         rect?.left ?? 0,
              width:        rect?.width ?? 200,
              zIndex:       9999,
              background:   "var(--panel)",
              border:       "1px solid var(--line)",
              borderRadius: 10,
              boxShadow:    "0 8px 32px rgba(0,0,0,0.22)",
              overflow:     "hidden",
              maxHeight:    280,
              overflowY:    "auto",
            }}
          >
            {normalised.map((o) => {
              const active = o.v === value;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => { onChange(o.v); setOpen(false); }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "var(--hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] flex items-center justify-between gap-2 transition-colors"
                  style={{
                    background: active ? "rgba(8,174,170,0.10)" : "transparent",
                    color:      active ? "var(--teal-bright)" : "var(--ink-strong)",
                    cursor:     "pointer",
                  }}
                >
                  <span>{o.l}</span>
                  {active && (
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 15, color: "var(--teal)", fontVariationSettings: "'FILL' 1" }}
                    >
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
            className="flex-1 py-2 text-[12.5px] font-semibold rounded-[8px] border transition-colors"
            style={
              active
                ? {
                    background: "rgba(8,174,170,0.12)",
                    borderColor: "rgba(8,174,170,0.4)",
                    color: "var(--teal-bright)",
                    cursor: "pointer",
                  }
                : {
                    background: "var(--panel-2)",
                    borderColor: "var(--line)",
                    color: "var(--ink-mid)",
                    cursor: "pointer",
                  }
            }
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
      className="rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--teal)]"
      style={{ borderColor: "var(--line)" }}
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
        <div className="flex flex-col items-center py-7 text-center" style={{ color: "var(--ink-dim)" }}>
          <Icon name="add_photo_alternate" size={26} />
          <div className="text-[12.5px] mt-1.5">{label}</div>
        </div>
      )}
    </div>
  );
}
