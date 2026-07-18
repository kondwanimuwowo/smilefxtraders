"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Panel, DirPill, Chip, Icon, Button, CandleChart, Select, Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useAddTrade } from "@/lib/hooks/useTrades";
import type { Candle, Zone, PriceLine, Mark } from "@/components/ui";
import { useInstrumentSymbols } from "@/lib/hooks/useInstruments";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertStatusApp = "active" | "tp1" | "tp2" | "sl" | "cancelled" | "closed";

export interface InstructorAlert {
  id:         string;
  pair:       string;
  dir:        "long" | "short";
  model:      string;
  session:    string;
  rr:         string;
  entry:      string;
  sl:         string;
  tp1:        string;
  tp2?:       string;
  tags:       string[];
  note:       string;
  status:     AlertStatusApp;
  timePosted: string;
  authorId?:  string | null;
  reactions?: number;
  taken?:     number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

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
    refetchInterval: 60_000,
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();
  const toast = useStore((s) => s.toast);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AlertStatusApp }) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      return res.json() as Promise<InstructorAlert>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<InstructorAlert[]>(["alerts"], (old) =>
        (old ?? []).map((a) => (a.id === updated.id ? updated : a))
      );
      toast("Alert status updated", "teal", "check_circle");
    },
    onError: () => toast("Failed to update alert status", "coral", "error"),
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  const toast = useStore((s) => s.toast);
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<InstructorAlert[]>(["alerts"], (old) =>
        (old ?? []).filter((a) => a.id !== id)
      );
      toast("Alert deleted", "gold", "delete");
    },
    onError: () => toast("Failed to delete alert", "coral", "error"),
  });
}

function usePostAlert() {
  const queryClient = useQueryClient();
  const toast = useStore((s) => s.toast);
  return useMutation({
    mutationFn: async (data: Omit<InstructorAlert, "id" | "timePosted" | "status">) => {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair:    data.pair,
          dir:     data.dir,
          model:   data.model,
          session: data.session,
          entry:   parseFloat(data.entry.replace(/,/g, "")),
          sl:      parseFloat(data.sl.replace(/,/g, "")),
          tp1:     parseFloat(data.tp1.replace(/,/g, "")),
          tp2:     data.tp2 ? parseFloat(data.tp2.replace(/,/g, "")) : undefined,
          rr:      data.rr,
          tags:    data.tags,
          note:    data.note,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Server error ${res.status}`);
      }
      return res.json() as Promise<InstructorAlert>;
    },
    onSuccess: (newAlert) => {
      queryClient.setQueryData<InstructorAlert[]>(["alerts"], (old) =>
        [newAlert, ...(old ?? [])]
      );
      toast(`${newAlert.pair} alert posted`, "teal", "notifications_active");
    },
    onError: (err: Error) => toast(err.message || "Failed to post alert", "coral", "error"),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

import { fmtRelative } from "@/lib/date";
function timeAgo(iso: string): string { return fmtRelative(iso); }

const STATUS_CONFIG: Record<AlertStatusApp, { label: string; textCls: string; bgCls: string; icon: string }> = {
  active:    { label: "Active",    textCls: "text-teal",        bgCls: "bg-[rgba(8,174,170,0.12)]",  icon: "radio_button_checked" },
  tp1:       { label: "TP1 Hit",   textCls: "text-teal-bright",  bgCls: "bg-[rgba(48,232,223,0.12)]", icon: "done_all" },
  tp2:       { label: "TP2 Hit",   textCls: "text-teal-bright",  bgCls: "bg-[rgba(48,232,223,0.16)]", icon: "verified" },
  sl:        { label: "Stop Loss", textCls: "text-coral",       bgCls: "bg-[rgba(234,82,61,0.12)]",  icon: "cancel" },
  cancelled: { label: "Cancelled", textCls: "text-ink-dim",     bgCls: "bg-[rgba(0,0,0,0.06)]",       icon: "block" },
  closed:    { label: "Closed",    textCls: "text-ink-dim",     bgCls: "bg-[rgba(0,0,0,0.06)]",       icon: "lock" },
};

const STATUS_TRANSITIONS: AlertStatusApp[] = ["active", "tp1", "tp2", "sl", "cancelled"];

// ── Seeded chart helpers ──────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const PAIR_START: Record<string, number> = { EURUSD: 1.085, GBPUSD: 1.27, USDJPY: 155.4, USDCHF: 0.905, AUDUSD: 0.648, NZDUSD: 0.608, USDCAD: 1.376, XAUUSD: 2328, NAS100: 19800 };
const PAIR_VOL:   Record<string, number> = { EURUSD: 0.0008, GBPUSD: 0.001, USDJPY: 0.15, USDCHF: 0.0008, AUDUSD: 0.0008, NZDUSD: 0.0007, USDCAD: 0.0008, XAUUSD: 4, NAS100: 60 };

function buildChart(alert: InstructorAlert): { candles: Candle[]; annotations: { zones: Zone[]; lines: PriceLine[]; marks: Mark[] } } {
  const rng   = mulberry32(strHash(alert.id));
  const start = PAIR_START[alert.pair] ?? 1.1;
  const vol   = PAIR_VOL[alert.pair]   ?? 0.001;
  const drift = alert.dir === "long" ? 0.8 : -0.8;

  const candles: Candle[] = [];
  let price = start;
  for (let i = 0; i < 55; i++) {
    const d = (rng() - 0.5 + drift * 0.08) * vol;
    const o = price;
    const c = price + d;
    const h = Math.max(o, c) + rng() * vol * 0.35;
    const l = Math.min(o, c) - rng() * vol * 0.35;
    candles.push({ o, h, l, c });
    price = c;
  }

  const zones: Zone[] = [{
    i0: 24, i1: 29,
    lo: Math.min(candles[24].l, candles[25].l, candles[26].l),
    hi: Math.max(candles[24].h, candles[25].h, candles[26].h),
    type: "fvg", dir: alert.dir,
  }];
  const lines: PriceLine[] = [{
    price: candles[29].o,
    label: "Entry",
    color: alert.dir === "long" ? "var(--teal)" : "var(--coral)",
  }];
  const marks: Mark[] = [{
    i: 42, price: alert.dir === "long" ? candles[42].h : candles[42].l,
    label: "BOS", type: "bos",
  }];

  return { candles, annotations: { zones, lines, marks } };
}

// ── Post Alert Modal ──────────────────────────────────────────────────────────

const SESSIONS = ["London", "New York", "Asia"];
const MODELS   = [
  "Liquidity Sweep → FVG", "OB + BOS", "Liquidity → CHoCH",
  "SMT + OB", "OB + FVG", "Turtle Soup", "BOS + retrace",
];

export function PostAlertModal({ onClose }: { onClose: () => void }) {
  const { mutate: postAlert, isPending } = usePostAlert();
  const pairs = useInstrumentSymbols();
  const [form, setForm] = useState({
    pair: "XAUUSD", dir: "long" as "long" | "short",
    model: MODELS[0], session: "London",
    entry: "", sl: "", tp1: "", tp2: "",
    rr: "", tagInput: "", tags: [] as string[], note: "",
  });

  const set = (k: string, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  function addTag() {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    set("tagInput", "");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    postAlert({
      pair: form.pair, dir: form.dir, model: form.model,
      session: form.session, rr: form.rr,
      entry: form.entry, sl: form.sl, tp1: form.tp1,
      tp2: form.tp2 || undefined, tags: form.tags, note: form.note,
    }, { onSuccess: onClose });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
    >
      <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto bg-panel border border-line shadow-[0_10px_26px_rgba(0,0,0,0.38)] max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-medium text-[18px] text-ink-strong">Post Alert</h2>
          <button type="button" onClick={onClose} className="text-ink-dim">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Pair + Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Pair</label>
              <Select value={form.pair} onChange={(v) => set("pair", v)} options={pairs.length ? pairs : ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"]} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Direction</label>
              <div className="flex rounded-xl overflow-hidden border border-line">
                {(["long", "short"] as const).map((d) => (
                  <button
                    key={d} type="button" onClick={() => set("dir", d)}
                    className={`flex-1 py-2 text-[12.5px] font-semibold capitalize transition-all ${
                      form.dir === d
                        ? d === "long" ? "bg-teal text-white" : "bg-coral text-white"
                        : "bg-panel-2 text-ink-mid"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model + Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Model</label>
              <Select value={form.model} onChange={(v) => set("model", v)} options={MODELS} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Session</label>
              <Select value={form.session} onChange={(v) => set("session", v)} options={SESSIONS} />
            </div>
          </div>

          {/* Entry / SL / TP1 / TP2 / RR */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Entry", key: "entry" }, { label: "Stop Loss", key: "sl" },
              { label: "TP1",   key: "tp1" },   { label: "TP2 (opt)", key: "tp2" },
              { label: "R:R",   key: "rr" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">{label}</label>
                <input
                  type="text" value={(form as unknown as Record<string, string>)[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={label}
                  className="w-full px-3 py-2 rounded-xl text-[13px] bg-panel-2 border border-line text-ink-strong"
                />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Tags</label>
            <div className="flex gap-2">
              <input
                type="text" value={form.tagInput} onChange={(e) => set("tagInput", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag, press Enter"
                className="flex-1 px-3 py-2 rounded-xl text-[13px] bg-panel-2 border border-line text-ink-strong"
              />
              <button type="button" onClick={addTag} className="px-3 rounded-xl bg-panel-2 border border-line text-ink-mid">
                <Icon name="add" size={16} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((t) => (
                  <button key={t} type="button" onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(8,174,170,0.1)] text-teal border border-[rgba(8,174,170,0.2)]"
                  >
                    {t} <Icon name="close" size={10} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Analysis Note</label>
            <textarea
              value={form.note} onChange={(e) => set("note", e.target.value)}
              rows={4} placeholder="HTF bias, entry rationale, key levels..."
              className="w-full px-3 py-2 rounded-xl text-[13px] resize-none bg-panel-2 border border-line text-ink-strong"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" icon="notifications_active" className="flex-1" disabled={isPending}>
              {isPending ? "Posting…" : "Post Alert"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert, onCopy, copied, isInstructor,
}: {
  alert: InstructorAlert;
  onCopy: () => void;
  copied: boolean;
  isInstructor: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: updateStatus } = useUpdateAlertStatus();
  const { mutate: deleteAlert }  = useDeleteAlert();
  const statusCfg = STATUS_CONFIG[alert.status];
  const chart     = useMemo(() => buildChart(alert), [alert]);

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden bg-panel border",
        alert.status === "active" ? "border-[rgba(8,174,170,0.25)]" : "border-line",
        (alert.status === "sl" || alert.status === "cancelled" || alert.status === "closed") && "opacity-75"
      )}
    >
      {/* Card header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-display font-bold text-[22px] tracking-[-0.02em] text-ink-strong">
                {alert.pair}
              </span>
              <DirPill dir={alert.dir} />
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.bgCls} ${statusCfg.textCls}`}
              >
                <Icon name={statusCfg.icon} size={12} />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12.5px] text-ink-dim">{alert.model}</span>
              <span className="text-[12px] text-ink-dim">·</span>
              <span className="text-[12.5px] text-ink-dim">{alert.session} KZ</span>
              <span className="text-[12px] text-ink-dim">·</span>
              <span className="text-[12.5px] text-ink-dim">{timeAgo(alert.timePosted)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display font-bold tabular-nums text-2xl tracking-[-0.02em] text-gold">
              {alert.rr}R
            </div>
            <div className="text-[11px] font-semibold text-ink-dim">Planned R:R</div>
          </div>
        </div>
      </div>

      {/* Levels grid */}
      <div className="mx-5 mb-3 grid grid-cols-2 sm:grid-cols-4 rounded-xl overflow-hidden border border-line">
        {[
          { label: "Entry", value: alert.entry, colorCls: alert.dir === "long" ? "text-teal" : "text-coral", icon: "login" },
          { label: "Stop",  value: alert.sl,    colorCls: "text-coral-bright", icon: "stop_circle" },
          { label: "TP 1",  value: alert.tp1,   colorCls: "text-teal-bright",  icon: "flag" },
          { label: "TP 2",  value: alert.tp2 ?? "—", colorCls: alert.tp2 ? "text-teal-bright" : "text-ink-dim", icon: "flag_2" },
        ].map(({ label, value, colorCls, icon }, i) => (
          <div
            key={label}
            className={cn("flex flex-col items-center py-2.5 px-2 bg-panel-2", i > 0 && "border-l border-line")}
          >
            <Icon name={icon} size={13} className={cn("mb-0.5", colorCls)} />
            <span className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-ink-dim">{label}</span>
            <span className={cn("font-display font-bold tabular-nums text-[13px] tracking-[-0.01em]", colorCls)}>{value}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="mx-5 mb-3 rounded-xl overflow-hidden cursor-pointer border border-line transition-[height] duration-300 ease-app"
        style={{ height: expanded ? 180 : 100 }}
        onClick={() => setExpanded((e) => !e)}
        title={expanded ? "Collapse chart" : "Expand chart"}
      >
        <CandleChart candles={chart.candles} annotations={chart.annotations} height={expanded ? 180 : 100} />
      </div>

      {/* Tags + note */}
      <div className="px-5 pb-2">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {alert.tags.map((tag) => <Chip key={tag} tone="teal">{tag}</Chip>)}
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-dim">{alert.note}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-t flex-wrap border-line">
        <div className="flex items-center gap-2">
          <Avatar
            seed={alert.authorId ? alert.authorId.charCodeAt(0) + (alert.authorId.charCodeAt(1) ?? 0) : 186}
            name="Kondwani"
            size={26}
          />
          <span className="text-[12px] font-medium text-ink-mid">Kondwani · Instructor</span>
          {(alert.taken ?? 0) > 0 && (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[rgba(8,174,170,0.1)] text-teal">
              {alert.taken} taken
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Instructor status controls */}
        {isInstructor && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_TRANSITIONS.filter((s) => s !== alert.status).map((s) => (
              <button
                key={s} type="button"
                onClick={() => updateStatus({ id: alert.id, status: s })}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all bg-panel-2 border border-line text-ink-mid"
              >
                → {STATUS_CONFIG[s].label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { if (confirm("Delete this alert?")) deleteAlert(alert.id); }}
              className="p-1 rounded-lg text-coral"
            >
              <Icon name="delete" size={14} />
            </button>
          </div>
        )}

        {/* Student copy-to-journal */}
        {!isInstructor && alert.status === "active" && (
          copied ? (
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-teal">
              <Icon name="check_circle" size={16} fill />
              In your journal
            </span>
          ) : (
            <Button type="button" variant="primary" icon="add_task" onClick={onCopy}>
              Copy to journal
            </Button>
          )
        )}
        {!isInstructor && alert.status !== "active" && (
          <span className="text-[12px] text-ink-dim">Trade closed · {statusCfg.label}</span>
        )}
      </div>
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { v: "all",    l: "All" },
  { v: "active", l: "Active" },
  { v: "closed", l: "Closed" },
] as const;

// ── Alerts page ───────────────────────────────────────────────────────────────

export function Alerts() {
  const { journaledAlerts, addJournaledAlert, toast, user } = useStore();
  const { mutate: addTrade } = useAddTrade();
  const { data: alerts = [], isLoading } = useAlerts();
  const [showPostModal, setShowPostModal] = useState(false);
  const instrumentSymbols = useInstrumentSymbols();
  const pairFilters = ["All", ...(instrumentSymbols.length ? instrumentSymbols : ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"])];

  const isInstructor = user?.role === "instructor";

  const handleCopyAlert = (alert: InstructorAlert) => {
    if (journaledAlerts.has(alert.id)) { toast("Already in your journal", "gold", "info"); return; }
    addTrade({
      date:       new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      pair:       alert.pair,
      dir:        alert.dir,
      model:      alert.model,
      session:    alert.session,
      rr:         parseFloat(alert.rr),
      result:     "open",
      pnlR:       0,
      tags:       alert.tags,
      note:       `From Kondwani's alert · Entry ${alert.entry} / SL ${alert.sl} / TP ${alert.tp1}`,
      fromAlert:  alert.id,
      discipline: true,
    });
    addJournaledAlert(alert.id);
    toast(`${alert.pair} setup copied to journal`, "teal", "add_task");
  };

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [pairFilter, setPairFilter]     = useState("All");

  const filtered = useMemo(() => {
    let list = alerts;
    if (statusFilter === "active") list = list.filter((a) => a.status === "active");
    if (statusFilter === "closed") list = list.filter((a) => a.status !== "active");
    if (pairFilter !== "All")      list = list.filter((a) => a.pair === pairFilter);
    return list;
  }, [alerts, statusFilter, pairFilter]);

  const activeCount  = alerts.filter((a) => a.status === "active").length;
  const tpCount      = alerts.filter((a) => a.status === "tp1" || a.status === "tp2").length;
  const slCount      = alerts.filter((a) => a.status === "sl").length;

  return (
    <div className="view">
      {showPostModal && <PostAlertModal onClose={() => setShowPostModal(false)} />}

      {/* Free-plan delay warning */}
      {user?.plan === "free" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-[13px] bg-[rgba(248,185,61,0.08)] border border-[rgba(248,185,61,0.25)] text-gold">
          <Icon name="schedule" size={16} className="text-gold shrink-0" />
          <span>
            <strong>Free plan</strong>: alerts are shown with a 4-hour delay.{" "}
            <a href="/membership" className="underline font-semibold text-gold">Upgrade to Pro</a>{" "}
            for live calls.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Setup Alerts
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Live calls from Kondwani, reviewed against the SMC rulebook before posting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[rgba(8,174,170,0.1)] border border-[rgba(8,174,170,0.3)]">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-teal" />
                <span className="relative inline-flex rounded-full size-2 bg-teal" />
              </span>
              <span className="text-[12.5px] font-semibold text-teal">
                {activeCount} active {activeCount === 1 ? "alert" : "alerts"}
              </span>
            </div>
          )}
          {isInstructor && (
            <Button type="button" variant="primary" icon="add_alert" onClick={() => setShowPostModal(true)}>
              Post Alert
            </Button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total alerts", value: alerts.length,  icon: "notifications",        colorCls: "text-ink-strong" },
            { label: "Active",       value: activeCount,    icon: "radio_button_checked", colorCls: "text-teal"       },
            { label: "TP hit",       value: tpCount,        icon: "done_all",             colorCls: "text-teal-bright"},
            { label: "Stop loss",    value: slCount,        icon: "cancel",               colorCls: "text-coral"      },
          ].map(({ label, value, icon, colorCls }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-panel border border-line">
              <Icon name={icon} size={18} className={cn("shrink-0", colorCls)} />
              <div>
                <div className={cn("font-display font-bold text-[20px] tabular-nums leading-none", colorCls)}>{value}</div>
                <div className="text-[10.5px] font-medium mt-0.5 text-ink-dim">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center rounded-xl p-0.5 bg-panel-2 border border-line">
          {STATUS_FILTERS.map(({ v, l }) => (
            <button
              key={v} type="button" onClick={() => setStatusFilter(v)}
              className={`px-3.5 py-1.5 rounded-[10px] text-[12.5px] font-semibold transition-all ${
                statusFilter === v ? "bg-panel text-ink-strong shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-ink-dim"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {pairFilters.map((p) => (
            <button
              key={p} type="button" onClick={() => setPairFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                pairFilter === p ? "bg-teal text-white" : "bg-panel-2 text-ink-dim border border-line"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Alert grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-64 animate-pulse bg-panel border border-line" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel>
          <div className="flex flex-col items-center py-14 text-center">
            <Icon
              name={alerts.length === 0 ? "notifications_active" : "filter_list_off"}
              size={32}
              className="text-ink-dim mb-3"
            />
            <div className="font-semibold text-[15px] mb-1 text-ink-strong">
              {alerts.length === 0 ? "No alerts posted yet" : "No alerts match"}
            </div>
            <div className="text-[13px] text-ink-dim">
              {alerts.length === 0
                ? isInstructor
                  ? "Post your first trade setup using the button above."
                  : "Kondwani hasn't posted any alerts yet. Check back soon."
                : "Try a different pair or status filter."}
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              copied={journaledAlerts.has(alert.id)}
              onCopy={() => handleCopyAlert(alert)}
              isInstructor={isInstructor}
            />
          ))}
        </div>
      )}

      {/* Pro plan note — students only */}
      {!isInstructor && (
        <div className="mt-6 rounded-2xl px-5 py-4 flex items-start gap-3 bg-[rgba(248,185,61,0.06)] border border-[rgba(248,185,61,0.2)]">
          <Icon name="workspace_premium" size={17} fill className="text-gold shrink-0 mt-px" />
          <p className="text-[12.5px] leading-relaxed text-ink-mid">
            <strong className="text-ink-strong">Edge & Pro traders</strong> receive alerts in real time via this feed and push notifications. Free plan members see alerts with a 4-hour delay. Upgrade in{" "}
            <a href="/membership" className="text-gold no-underline">Membership</a>.
          </p>
        </div>
      )}
    </div>
  );
}
