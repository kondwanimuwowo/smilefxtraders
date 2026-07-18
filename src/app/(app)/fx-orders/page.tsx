"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.55)] backdrop-blur-[4px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-2xl p-6 w-full max-w-md bg-panel border border-line shadow-[0_10px_26px_rgba(0,0,0,0.38)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-medium text-[18px] text-ink-strong">
              Upload FXO Image
            </h2>
            <p className="text-[12px] mt-0.5 text-ink-dim">
              Parse a screenshot from InvestingLive with Claude Vision
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-xl w-8 h-8 transition-colors hover:bg-hover text-ink-dim"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl gap-2 py-8 transition-all border-2 border-dashed text-ink-mid",
              file ? "border-teal bg-[rgba(8,174,170,0.04)]" : "border-line bg-panel-2"
            )}
          >
            <Icon name={file ? "check_circle" : "upload_file"} size={28} fill
              className={file ? "text-teal" : "text-ink-dim"} />
            <span className="text-[13px] font-medium">
              {file ? file.name : "Click to select FXO image"}
            </span>
            {!file && (
              <span className="text-[11px] text-ink-dim">
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
            <label className="block text-[11.5px] font-semibold mb-1.5 text-ink-dim">
              Expiry date (auto-detected from filename otherwise)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none bg-panel-2 border border-line text-ink-strong"
            />
          </div>

          {msg && (
            <div
              className={cn(
                "rounded-xl px-3 py-2.5 text-[12.5px] border",
                status === "error" ? "bg-[rgba(234,82,61,0.07)] border-[rgba(234,82,61,0.2)] text-coral" : "bg-[rgba(8,174,170,0.07)] border-[rgba(8,174,170,0.2)] text-teal"
              )}
            >
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || status === "loading" || status === "done"}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50 bg-teal text-white"
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
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 min-w-0 bg-panel border border-line">
      {/* background/icon/value color come from a caller-supplied var(--x) string — genuinely per-instance, not enumerable */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
        style={{ background: color ? `${color}18` : "var(--panel-2)" }}
      >
        <Icon name={icon} size={18} fill style={{ color: color ?? "var(--ink-dim)" }} />
      </div>
      <div className="min-w-0">
        <div
          className="font-display font-bold tabular-nums leading-none text-[20px]"
          style={{ color: color ?? "var(--ink-strong)" }}
        >
          {value}
        </div>
        <div className="text-[11px] mt-0.5 truncate text-ink-dim">{label}</div>
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
      className={cn(
        "group flex flex-col rounded-2xl overflow-hidden transition-all duration-150 bg-panel border",
        isToday ? "border-[rgba(8,174,170,0.45)] shadow-[0_0_0_1px_rgba(8,174,170,0.12),0_4px_20px_rgba(8,174,170,0.06)]" : "border-line shadow-none"
      )}
    >
      {/* Top strip — date + day name */}
      <div className={cn("px-5 pt-5 pb-4 border-b border-line", isToday ? "bg-[rgba(8,174,170,0.03)]" : "bg-panel-2")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className={cn("font-display font-bold leading-none tabular-nums text-[28px] tracking-[-0.03em]", isToday ? "text-teal-bright" : "text-ink-strong")}
            >
              {dd}
              <span className={cn("text-[18px] font-normal mx-0.5", isToday ? "text-teal" : "text-ink-dim")}>/</span>
              {mm}
            </div>
            <div
              className={cn("text-[11.5px] font-semibold mt-1.5 uppercase tracking-wider", isToday ? "text-teal" : "text-ink-dim")}
            >
              {isToday ? "Today" : summary.dayName}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", isToday ? "text-teal" : "text-ink-dim")}>
              {isToday ? "Today" : "NY Cut"}
            </span>
            <span className="tabular-nums text-[11px] mt-0.5 text-ink-dim">
              10:00 AM
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-5 py-4 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon name="currency_exchange" size={14} className="text-ink-dim" />
          <span className="font-display font-bold tabular-nums text-[18px] text-ink-strong">
            {summary.pairCount}
          </span>
          <span className="text-[11px] text-ink-dim">pairs</span>
        </div>

        <div className="w-px h-4 bg-line" />

        <div className="flex items-center gap-1.5">
          <Icon name="format_list_bulleted" size={14} className="text-ink-dim" />
          <span className="font-display font-bold tabular-nums text-[18px] text-ink-strong">
            {summary.levelCount}
          </span>
          <span className="text-[11px] text-ink-dim">levels</span>
        </div>

        <div className="flex-1" />

        <Icon
          name="arrow_forward"
          size={16}
          className={cn("transition-transform group-hover:translate-x-0.5 shrink-0", isToday ? "text-teal" : "text-ink-dim")}
        />
      </div>

      {/* Pair chip row */}
      <div className="flex flex-wrap gap-1.5 px-5 pb-4 pt-3 border-t border-line">
        {summary.pairs.map((pair) => (
          <span
            key={pair}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-panel-2 border border-line text-ink-dim tracking-[0.01em]"
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
    <div className="rounded-2xl overflow-hidden bg-panel border border-line">
      <div className="px-5 pt-5 pb-4 border-b border-line bg-panel-2">
        <Skeleton h={28} r={6} />
        <div className="mt-2.5"><Skeleton h={11} r={4} style={{ width: "40%" }} /></div>
      </div>
      <div className="px-5 py-4"><Skeleton h={20} r={6} style={{ width: "55%" }} /></div>
      <div className="px-5 pb-4 pt-3 flex gap-1.5 flex-wrap border-t border-line">
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
      setSyncMsg(json.skipped ? (json.reason ?? "Nothing to sync") : `Synced ${json.saved} records`);
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
          <h1 className="font-display font-medium text-[26px] tracking-[-0.025em] text-ink-strong">
            FX Option Expiries
          </h1>
          <p className="text-[13px] mt-1 text-ink-dim">
            Daily 10am New York Cut · data sourced from InvestingLive
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {syncMsg && (
            <div
              className={cn(
                "flex items-start gap-2 text-[12px] font-medium px-3 py-2 rounded-xl max-w-sm border",
                syncErr ? "bg-[rgba(234,82,61,0.07)] text-coral border-[rgba(234,82,61,0.2)]" : "bg-[rgba(8,174,170,0.07)] text-teal border-[rgba(8,174,170,0.2)]"
              )}
            >
              <Icon name={syncErr ? "error" : "check_circle"} size={14} fill className="shrink-0 mt-px" />
              <div>
                <div>{syncMsg}</div>
                {syncErr && (
                  <button
                    type="button"
                    onClick={() => { setSyncMsg(""); setSyncErr(false); setShowUpload(true); }}
                    className="underline mt-0.5 font-semibold text-coral"
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
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] hover:opacity-80 bg-panel-2 border border-line text-ink-mid"
              >
                <Icon name="upload_file" size={15} />
                Upload Image
              </button>
              <button
                type="button"
                onClick={syncToday}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60 bg-teal text-white"
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
        <div className="grid gap-3 mb-6 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          <StatChip icon="calendar_today"       value={summaries.length} label="dates in archive"    color="var(--teal)"      />
          <StatChip icon="format_list_bulleted" value={totalLevels}      label="total levels stored" color="var(--gold)"      />
          <StatChip icon="schedule"             value={hasToday ? "Yes" : "No"} label="today synced" color={hasToday ? "var(--teal)" : "var(--coral)"} />
          <StatChip icon="currency_exchange"    value={(PAIRS_ORDER as readonly string[]).length} label="pairs tracked" color="var(--ink-mid)" />
        </div>
      )}

      {/* ── Education callout ── */}
      <div className="rounded-2xl px-5 py-4 mb-7 flex items-start gap-3 bg-[rgba(248,185,61,0.05)] border border-[rgba(248,185,61,0.2)]">
        <Icon name="tips_and_updates" size={16} fill className="text-gold shrink-0 mt-px" />
        <div>
          <div className="text-[12.5px] font-semibold mb-0.5 text-gold">
            How to use these levels
          </div>
          <p className="text-[12px] leading-relaxed text-ink-dim">
            Large notionals (≥$1bn) act as price magnets into the 10am NY Cut.
            Levels within <strong className="text-ink-mid">30–50 pips</strong> of spot
            can cause pinning, fading, or sharp reversals at expiry.
            Cross-reference with your HTF bias before trading.
          </p>
        </div>
      </div>

      {/* ── Date card grid ── */}
      {loading ? (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center bg-panel border border-line">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[rgba(8,174,170,0.06)] border border-[rgba(8,174,170,0.15)]">
            <Icon name="event_busy" size={32} className="text-teal" />
          </div>
          <div>
            <div className="font-display font-bold text-[17px] mb-1.5 text-ink-strong">
              No data yet
            </div>
            <p className="text-[13px] leading-relaxed max-w-xs text-ink-dim">
              {isInstructor
                ? <>Click <strong className="text-ink-mid">Sync Today</strong> to fetch option expiries, or <strong className="text-ink-mid">Upload Image</strong> to parse an existing screenshot.</>
                : "No option expiry data has been published yet. Check back after Kondwani posts the daily levels."
              }
            </p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] hover:opacity-80 bg-panel-2 border border-line text-ink-mid"
              >
                <Icon name="upload_file" size={15} />
                Upload Image
              </button>
              <button
                type="button"
                onClick={syncToday}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60 bg-teal text-white"
              >
                <Icon name="sync" size={15} />
                Sync Today
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {summaries.map((s) => (
            <DateCard key={s.date} summary={s} isToday={s.date === today} />
          ))}
        </div>
      )}
    </div>
  );
}
