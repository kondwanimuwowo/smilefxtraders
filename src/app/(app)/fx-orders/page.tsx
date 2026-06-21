"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon, Skeleton } from "@/components/ui";
import { PAIRS_ORDER, PAIR_LABELS } from "@/types/fx-orders";
import type { FxDateSummary } from "@/types/fx-orders";
import { useStore } from "@/lib/store";

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile]     = useState<File | null>(null);
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg]       = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("loading");
    setMsg("");
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("date",  date);
      const res  = await fetch("/api/fx-orders/sync", { method: "PUT", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setMsg(`Saved ${json.saved} records for ${json.days?.join(", ") ?? date}`);
      setStatus("done");
      setTimeout(() => { onDone(); onClose(); }, 1800);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: "var(--panel)", border: "1px solid var(--line)", boxShadow: "0 24px 70px rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-[18px]" style={{ color: "var(--ink-strong)" }}>
              Upload FXO Image
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
              Parse a screenshot from InvestingLive with Claude Vision
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-xl w-8 h-8 transition-colors hover:bg-[var(--hover)]"
            style={{ color: "var(--ink-dim)" }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-2xl gap-2 py-8 transition-all border-2 border-dashed"
            style={{
              borderColor: file ? "var(--teal)" : "var(--line)",
              background:  file ? "rgba(8,174,170,0.04)" : "var(--panel-2)",
              color: "var(--ink-mid)",
            }}
          >
            <Icon name={file ? "check_circle" : "upload_file"} size={28} fill
              style={{ color: file ? "var(--teal)" : "var(--ink-dim)" }} />
            <span className="text-[13px] font-medium">
              {file ? file.name : "Click to select FXO image"}
            </span>
            {!file && (
              <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>
                JPG or PNG · the table screenshot from InvestingLive
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div>
            <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: "var(--ink-dim)" }}>
              Expiry date (auto-detected from filename otherwise)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
              style={{
                background: "var(--panel-2)",
                border: "1px solid var(--line)",
                color: "var(--ink-strong)",
              }}
            />
          </div>

          {msg && (
            <div
              className="rounded-xl px-3 py-2.5 text-[12.5px]"
              style={{
                background: status === "error" ? "rgba(234,82,61,0.07)" : "rgba(8,174,170,0.07)",
                border: `1px solid ${status === "error" ? "rgba(234,82,61,0.2)" : "rgba(8,174,170,0.2)"}`,
                color: status === "error" ? "var(--coral)" : "var(--teal)",
              }}
            >
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || status === "loading" || status === "done"}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "var(--teal)", color: "#fff" }}
          >
            {status === "loading" ? (
              <><Icon name="autorenew" size={16} className="animate-spin" /> Extracting with Claude Vision…</>
            ) : status === "done" ? (
              <><Icon name="check_circle" size={16} fill /> Saved!</>
            ) : (
              <><Icon name="auto_awesome" size={16} /> Extract & Save</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({
  icon, value, label, color,
}: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5 min-w-0"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
        style={{ background: color ? `${color}18` : "var(--panel-2)" }}
      >
        <Icon name={icon} size={18} fill style={{ color: color ?? "var(--ink-dim)" }} />
      </div>
      <div className="min-w-0">
        <div
          className="font-display font-bold tabular-nums leading-none"
          style={{ fontSize: 20, color: color ?? "var(--ink-strong)", fontFeatureSettings: '"tnum"' }}
        >
          {value}
        </div>
        <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--ink-dim)" }}>{label}</div>
      </div>
    </div>
  );
}

// ── Date card ─────────────────────────────────────────────────────────────────

function DateCard({ summary, isToday }: { summary: FxDateSummary; isToday: boolean }) {
  const parts = summary.date.split("-").map(Number);
  const dd    = String(parts[2]).padStart(2, "0");
  const mm    = String(parts[1]).padStart(2, "0");

  return (
    <Link
      href={`/fx-orders/${summary.date}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-150"
      style={{
        background: "var(--panel)",
        border: `1px solid ${isToday ? "rgba(8,174,170,0.45)" : "var(--line)"}`,
        boxShadow: isToday ? "0 0 0 1px rgba(8,174,170,0.12), 0 4px 20px rgba(8,174,170,0.06)" : "none",
      }}
    >
      {/* Top strip — date + day name */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ borderBottom: "1px solid var(--line)", background: isToday ? "rgba(8,174,170,0.03)" : "var(--panel-2)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className="font-display font-bold leading-none tabular-nums"
              style={{
                fontSize: 28,
                letterSpacing: "-0.03em",
                color: isToday ? "var(--teal-bright)" : "var(--ink-strong)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {dd}
              <span style={{ fontSize: 18, fontWeight: 400, color: isToday ? "var(--teal)" : "var(--ink-dim)", margin: "0 2px" }}>/</span>
              {mm}
            </div>
            <div
              className="text-[11.5px] font-semibold mt-1.5 uppercase tracking-wider"
              style={{ color: isToday ? "var(--teal)" : "var(--ink-dim)" }}
            >
              {isToday ? "Today" : summary.dayName}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isToday ? "var(--teal)" : "var(--ink-dim)" }}>
              {isToday ? "Today" : "NY Cut"}
            </span>
            <span
              className="tabular-nums text-[11px] mt-0.5"
              style={{ fontFamily: "var(--mono)", color: "var(--ink-dim)", fontFeatureSettings: '"tnum"' }}
            >
              10:00 AM
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-5 py-4 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon name="currency_exchange" size={14} style={{ color: "var(--ink-dim)" }} />
          <span
            className="font-display font-bold tabular-nums text-[18px]"
            style={{ color: "var(--ink-strong)", fontFeatureSettings: '"tnum"' }}
          >
            {summary.pairCount}
          </span>
          <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>pairs</span>
        </div>

        <div className="w-px h-4" style={{ background: "var(--line)" }} />

        <div className="flex items-center gap-1.5">
          <Icon name="format_list_bulleted" size={14} style={{ color: "var(--ink-dim)" }} />
          <span
            className="font-display font-bold tabular-nums text-[18px]"
            style={{ color: "var(--ink-strong)", fontFeatureSettings: '"tnum"' }}
          >
            {summary.levelCount}
          </span>
          <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>levels</span>
        </div>

        <div className="flex-1" />

        <Icon
          name="arrow_forward"
          size={16}
          style={{ color: isToday ? "var(--teal)" : "var(--ink-dim)" }}
          className="transition-transform group-hover:translate-x-0.5 shrink-0"
        />
      </div>

      {/* Pair chip row */}
      <div
        className="flex flex-wrap gap-1.5 px-5 pb-4 pt-3"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        {summary.pairs.map((pair) => (
          <span
            key={pair}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              color: "var(--ink-dim)",
              fontFamily: "var(--mono)",
              letterSpacing: "0.01em",
            }}
          >
            {PAIR_LABELS[pair] ?? pair}
          </span>
        ))}
      </div>
    </Link>
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
        <Skeleton h={28} r={6} />
        <div className="mt-2.5"><Skeleton h={11} r={4} style={{ width: "40%" }} /></div>
      </div>
      <div className="px-5 py-4"><Skeleton h={20} r={6} style={{ width: "55%" }} /></div>
      <div
        className="px-5 pb-4 pt-3 flex gap-1.5 flex-wrap"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} h={20} r={4} style={{ width: 50 }} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FxOrdersPage() {
  const user = useStore((s) => s.user);
  const isInstructor = user?.role === "instructor";

  const [summaries,  setSummaries]  = useState<FxDateSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [syncing,    setSyncing]    = useState(false);
  const [syncMsg,    setSyncMsg]    = useState("");
  const [syncErr,    setSyncErr]    = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function load() {
    const res  = await fetch("/api/fx-orders");
    const data = await res.json();
    setSummaries(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function syncToday() {
    setSyncing(true);
    setSyncMsg("");
    setSyncErr(false);
    try {
      const res  = await fetch("/api/fx-orders/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      setSyncMsg(`Synced ${json.saved} records`);
      await load();
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Sync failed");
      setSyncErr(true);
      // keep the error visible until dismissed — don't auto-clear
    } finally {
      setSyncing(false);
    }
  }

  const totalLevels = summaries.reduce((s, d) => s + d.levelCount, 0);
  const hasToday    = summaries.some((s) => s.date === today);

  return (
    <div className="view">
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onDone={load} />
      )}

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1
            className="font-display font-bold"
            style={{ fontSize: 26, letterSpacing: "-0.025em", color: "var(--ink-strong)" }}
          >
            FX Option Expiries
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--ink-dim)" }}>
            Daily 10am New York Cut · data sourced from InvestingLive
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {syncMsg && (
            <div
              className="flex items-start gap-2 text-[12px] font-medium px-3 py-2 rounded-xl max-w-sm"
              style={{
                background: syncErr ? "rgba(234,82,61,0.07)" : "rgba(8,174,170,0.07)",
                color:      syncErr ? "var(--coral)"         : "var(--teal)",
                border: `1px solid ${syncErr ? "rgba(234,82,61,0.2)" : "rgba(8,174,170,0.2)"}`,
              }}
            >
              <Icon name={syncErr ? "error" : "check_circle"} size={14} fill style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div>{syncMsg}</div>
                {syncErr && (
                  <button
                    type="button"
                    onClick={() => { setSyncMsg(""); setSyncErr(false); setShowUpload(true); }}
                    className="underline mt-0.5 font-semibold"
                    style={{ color: "var(--coral)" }}
                  >
                    Upload image manually instead →
                  </button>
                )}
              </div>
            </div>
          )}
          {isInstructor && (
            <>
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] hover:opacity-80"
                style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-mid)" }}
              >
                <Icon name="upload_file" size={15} />
                Upload Image
              </button>
              <button
                type="button"
                onClick={syncToday}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "var(--teal)", color: "#fff" }}
              >
                <Icon name={syncing ? "autorenew" : "sync"} size={15} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Syncing…" : "Sync Today"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stat strip ── */}
      {!loading && summaries.length > 0 && (
        <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          <StatChip icon="calendar_today"       value={summaries.length} label="dates in archive"    color="var(--teal)"      />
          <StatChip icon="format_list_bulleted" value={totalLevels}      label="total levels stored" color="var(--gold)"      />
          <StatChip icon="schedule"             value={hasToday ? "Yes" : "No"} label="today synced" color={hasToday ? "var(--teal)" : "var(--coral)"} />
          <StatChip icon="currency_exchange"    value={(PAIRS_ORDER as readonly string[]).length} label="pairs tracked" color="var(--ink-mid)" />
        </div>
      )}

      {/* ── Education callout ── */}
      <div
        className="rounded-2xl px-5 py-4 mb-7 flex items-start gap-3"
        style={{ background: "rgba(248,185,61,0.05)", border: "1px solid rgba(248,185,61,0.2)" }}
      >
        <Icon name="tips_and_updates" size={16} fill style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />
        <div>
          <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: "var(--gold)" }}>
            How to use these levels
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            Large notionals (≥$1bn) act as price magnets into the 10am NY Cut.
            Levels within <strong style={{ color: "var(--ink-mid)" }}>30–50 pips</strong> of spot
            can cause pinning, fading, or sharp reversals at expiry.
            Cross-reference with your HTF bias before trading.
          </p>
        </div>
      </div>

      {/* ── Date card grid ── */}
      {loading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : summaries.length === 0 ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{ background: "rgba(8,174,170,0.06)", border: "1px solid rgba(8,174,170,0.15)" }}
          >
            <Icon name="event_busy" size={32} style={{ color: "var(--teal)" }} />
          </div>
          <div>
            <div className="font-display font-bold text-[17px] mb-1.5" style={{ color: "var(--ink-strong)" }}>
              No data yet
            </div>
            <p className="text-[13px] leading-relaxed max-w-xs" style={{ color: "var(--ink-dim)" }}>
              {isInstructor
                ? <>Click <strong style={{ color: "var(--ink-mid)" }}>Sync Today</strong> to fetch option expiries, or <strong style={{ color: "var(--ink-mid)" }}>Upload Image</strong> to parse an existing screenshot.</>
                : "No option expiry data has been published yet. Check back after Kondwani posts the daily levels."
              }
            </p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] hover:opacity-80"
                style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-mid)" }}
              >
                <Icon name="upload_file" size={15} />
                Upload Image
              </button>
              <button
                type="button"
                onClick={syncToday}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "var(--teal)", color: "#fff" }}
              >
                <Icon name="sync" size={15} />
                Sync Today
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {summaries.map((s) => (
            <DateCard key={s.date} summary={s} isToday={s.date === today} />
          ))}
        </div>
      )}
    </div>
  );
}
