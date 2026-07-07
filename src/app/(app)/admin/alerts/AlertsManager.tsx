"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtMonthDay } from "@/lib/date";
import {
  PostAlertModal,
  useUpdateAlertStatus,
  useDeleteAlert,
} from "@/app/(app)/alerts/Alerts";
import type { InstructorAlert, AlertStatusApp } from "@/app/(app)/alerts/Alerts";

// ── Status config ──────────────────────────────────────────────────────────────

// Kept as raw var-string/rgba values (not converted to classes): color is
// consumed both directly via style and via `${color}33` alpha-suffix string
// concatenation below (status transition buttons), which only works with
// raw CSS values, not Tailwind class names.
const STATUS_STYLE: Record<AlertStatusApp, { bg: string; color: string; label: string }> = {
  active:    { bg: "rgba(8,174,170,0.12)",   color: "var(--teal)",        label: "Active"    },
  tp1:       { bg: "rgba(8,174,170,0.08)",   color: "var(--teal-bright)", label: "TP1 Hit"   },
  tp2:       { bg: "rgba(8,174,170,0.12)",   color: "var(--teal-bright)", label: "TP2 Hit"   },
  sl:        { bg: "rgba(234,82,61,0.1)",    color: "var(--coral)",       label: "SL Hit"    },
  cancelled: { bg: "rgba(154,154,154,0.08)", color: "var(--ink-dim)",     label: "Cancelled" },
  closed:    { bg: "rgba(154,154,154,0.08)", color: "var(--ink-dim)",     label: "Closed"    },
};

// Plain-consumption class equivalents for the two badge usages that don't
// need the alpha-suffix concatenation above.
const STATUS_BG_CLS: Record<AlertStatusApp, string> = {
  active:    "bg-[rgba(8,174,170,0.12)]",
  tp1:       "bg-[rgba(8,174,170,0.08)]",
  tp2:       "bg-[rgba(8,174,170,0.12)]",
  sl:        "bg-[rgba(234,82,61,0.1)]",
  cancelled: "bg-[rgba(154,154,154,0.08)]",
  closed:    "bg-[rgba(154,154,154,0.08)]",
};
const STATUS_TEXT_CLS: Record<AlertStatusApp, string> = {
  active:    "text-teal",
  tp1:       "text-teal-bright",
  tp2:       "text-teal-bright",
  sl:        "text-coral",
  cancelled: "text-ink-dim",
  closed:    "text-ink-dim",
};

const STATUS_TRANSITIONS: AlertStatusApp[] = ["active", "tp1", "tp2", "sl", "cancelled", "closed"];

// ── Data ───────────────────────────────────────────────────────────────────────

function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      let res: Response;
      try {
        res = await fetch("/api/alerts");
      } catch {
        throw new Error("Can't reach the server. Check your internet connection.");
      }
      if (res.status === 401) throw new Error("Session expired. Please sign in again.");
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Server error (${res.status})`);
      }
      return res.json() as Promise<InstructorAlert[]>;
    },
    staleTime: 30_000,
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AlertsManager() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const { data: alerts = [], isLoading }  = useAlerts();
  const { mutate: updateStatus }          = useUpdateAlertStatus();
  const { mutate: deleteAlert }           = useDeleteAlert();

  // Derived stats
  const total    = alerts.length;
  const active   = alerts.filter((a) => a.status === "active").length;
  const tpHits   = alerts.filter((a) => a.status === "tp1" || a.status === "tp2").length;
  const slHits   = alerts.filter((a) => a.status === "sl").length;
  const hitRate  = total > 0 ? Math.round((tpHits / total) * 100) : 0;

  return (
    <div className="view">
      {showPostModal && <PostAlertModal onClose={() => setShowPostModal(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ink-strong">
            Alerts Manager
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Post and manage setup alerts. Students receive them in real-time.
          </p>
        </div>
        <Button variant="primary" icon="add_alert" onClick={() => setShowPostModal(true)}>
          Post Alert
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",    value: total,   colorCls: "text-ink-strong", sub: null },
          { label: "Active",   value: active,  colorCls: "text-teal",       sub: null },
          { label: "TP Hit",   value: tpHits,  colorCls: "text-teal-bright", sub: total > 0 ? `${hitRate}% hit rate` : null },
          { label: "SL Hit",   value: slHits,  colorCls: "text-coral",      sub: null },
          { label: "Win rate", value: total > 0 ? `${hitRate}%` : "—", colorCls: hitRate >= 50 ? "text-teal" : "text-coral", sub: "tp hits / total" },
        ].map(({ label, value, colorCls, sub }) => (
          <div key={label} className="rounded-2xl p-4 bg-panel border border-line">
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-ink-dim">{label}</div>
            <div className={cn("font-display font-bold tabular-nums text-[24px] tracking-[-0.03em]", colorCls)}>{value}</div>
            {sub && <div className="text-[11px] mt-0.5 text-ink-dim">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Alerts list */}
      <div className="rounded-2xl overflow-hidden bg-panel border border-line">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[80px_44px_1fr_90px_80px_60px_80px_40px] px-5 py-2.5 text-[11px] uppercase tracking-wide font-semibold border-b border-line text-ink-dim bg-panel-2">
          <span>Pair</span><span>Dir</span><span>Model</span>
          <span>Status</span><span className="text-right">Entry</span>
          <span className="text-right">R:R</span><span className="text-right">Posted</span>
          <span />
        </div>

        {isLoading ? (
          <div className="divide-y divide-line">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex gap-3">
                <div className="h-4 w-16 rounded bg-track" />
                <div className="h-4 flex-1 rounded bg-track" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="text-[13px] text-ink-dim">
              No alerts posted yet.
            </div>
            <button
              type="button"
              onClick={() => setShowPostModal(true)}
              className="mt-3 text-[13px] font-semibold text-teal"
            >
              Post your first setup →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {alerts.map((a) => {
              const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.closed;
              const isExpanded = expandedId === a.id;
              const postedDate = fmtMonthDay(a.timePosted);

              return (
                <div key={a.id}>
                  {/* Main row */}
                  <div
                    className={cn("hidden sm:grid grid-cols-[80px_44px_1fr_90px_80px_60px_80px_40px] items-center px-5 py-3", a.status === "active" && "bg-[rgba(8,174,170,0.02)]")}
                  >
                    <span className="font-semibold text-[13px] text-ink-strong">
                      {a.pair}
                    </span>
                    <span
                      className={cn(
                        "text-[10.5px] font-bold uppercase px-1.5 py-0.5 rounded-full w-fit",
                        a.dir === "long" ? "bg-[rgba(8,174,170,0.12)] text-teal" : "bg-[rgba(234,82,61,0.1)] text-coral"
                      )}
                    >
                      {a.dir === "long" ? "L" : "S"}
                    </span>
                    <span className="text-[12px] truncate pr-2 text-ink-mid">{a.model}</span>
                    <span
                      className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit", STATUS_BG_CLS[a.status] ?? STATUS_BG_CLS.closed, STATUS_TEXT_CLS[a.status] ?? STATUS_TEXT_CLS.closed)}
                    >
                      {s.label}
                    </span>
                    <span className="text-right tabular-nums text-[12px] text-ink-mid">
                      {a.entry}
                    </span>
                    <span className="text-right tabular-nums text-[12.5px] font-semibold text-gold">
                      {a.rr}R
                    </span>
                    <span className="text-right text-[11.5px] text-ink-dim">
                      {postedDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      className="flex items-center justify-center rounded-lg p-1 transition-colors hover:bg-hover text-ink-dim"
                    >
                      <Icon name={isExpanded ? "expand_less" : "expand_more"} size={16} />
                    </button>
                  </div>

                  {/* Mobile row */}
                  <div
                    className="sm:hidden flex items-center gap-3 px-4 py-3"
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-[13px] text-ink-strong">{a.pair}</span>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                            a.dir === "long" ? "bg-[rgba(8,174,170,0.12)] text-teal" : "bg-[rgba(234,82,61,0.1)] text-coral"
                          )}
                        >
                          {a.dir}
                        </span>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", STATUS_BG_CLS[a.status] ?? STATUS_BG_CLS.closed, STATUS_TEXT_CLS[a.status] ?? STATUS_TEXT_CLS.closed)}>
                          {s.label}
                        </span>
                      </div>
                      <div className="text-[11.5px] truncate text-ink-dim">{a.model}</div>
                    </div>
                    <Icon name={isExpanded ? "expand_less" : "expand_more"} size={16} className="text-ink-dim" />
                  </div>

                  {/* Expanded controls */}
                  {isExpanded && (
                    <div className="px-5 py-4 flex flex-col gap-3 border-t border-line bg-panel-2">
                      {/* Level summary */}
                      <div className="flex flex-wrap gap-4 text-[12px] text-ink-mid">
                        <span>Entry <strong className="text-ink-strong">{a.entry}</strong></span>
                        <span>SL <strong className="text-coral-bright">{a.sl}</strong></span>
                        <span>TP1 <strong className="text-teal-bright">{a.tp1}</strong></span>
                        {a.tp2 && <span>TP2 <strong className="text-teal-bright">{a.tp2}</strong></span>}
                        <span>R:R <strong className="text-gold">{a.rr}R</strong></span>
                        <span>Session <strong className="text-ink-strong">{a.session}</strong></span>
                      </div>
                      {a.note && (
                        <p className="text-[12.5px] leading-relaxed text-ink-dim">{a.note}</p>
                      )}

                      {/* Status controls */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
                          Update status:
                        </span>
                        {STATUS_TRANSITIONS.filter((s) => s !== a.status).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStatus({ id: a.id, status })}
                            className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition-all hover:opacity-80"
                            style={{
                              background: STATUS_STYLE[status].bg,
                              color: STATUS_STYLE[status].color,
                              border: `1px solid ${STATUS_STYLE[status].color}33`,
                            }}
                          >
                            {STATUS_STYLE[status].label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { if (confirm("Delete this alert permanently?")) deleteAlert(a.id); }}
                          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition-all hover:opacity-80 bg-[rgba(234,82,61,0.08)] text-coral border border-[rgba(234,82,61,0.2)]"
                        >
                          <Icon name="delete" size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
