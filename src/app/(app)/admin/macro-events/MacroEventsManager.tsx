"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

type MacroEvent = {
  id: string;
  currency: string;
  title: string;
  category: string | null;
  impact: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  eventTime: string;
};

const CURRENCIES = ["USD", "EUR", "GBP", "NZD", "JPY", "CHF", "CAD", "AUD"] as const;
const CATEGORIES = [
  "CPI", "GDP", "EMPLOYMENT", "RETAIL_SALES", "MANUFACTURING_PMI",
  "CONSUMER_CONFIDENCE", "TRADE_BALANCE", "BOND_YIELD_10Y", "INTEREST_RATE",
] as const;

const EMPTY_FORM = {
  currency: "GBP", title: "", category: "CPI" as string, impact: "high",
  actual: "", forecast: "", previous: "", eventTime: "",
};

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time, with no trailing Z.
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MacroEventsManager({ initial }: { initial: MacroEvent[] }) {
  const [events, setEvents]           = useState<MacroEvent[]>(initial);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editId, setEditId]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  function field(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(ev: MacroEvent) {
    setForm({
      currency: ev.currency,
      title:    ev.title,
      category: ev.category ?? "CPI",
      impact:   ev.impact,
      actual:   ev.actual ?? "",
      forecast: ev.forecast ?? "",
      previous: ev.previous ?? "",
      eventTime: toLocalInputValue(ev.eventTime),
    });
    setEditId(ev.id);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.title || !form.eventTime) {
      setError("Title and release date/time are required.");
      return;
    }
    startTransition(async () => {
      const payload = {
        currency:  form.currency,
        title:     form.title.trim(),
        category:  form.category || null,
        impact:    form.impact,
        actual:    form.actual.trim()   || null,
        forecast:  form.forecast.trim() || null,
        previous:  form.previous.trim() || null,
        eventTime: new Date(form.eventTime).toISOString(),
      };

      if (editId) {
        const res = await fetch("/api/admin/macro-events", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) { setError("Save failed."); return; }
        const updated: MacroEvent = await res.json();
        setEvents((prev) => prev.map((e) => e.id === editId ? updated : e));
      } else {
        const res = await fetch("/api/admin/macro-events", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { setError("Create failed."); return; }
        const created: MacroEvent = await res.json();
        setEvents((prev) => [created, ...prev]);
      }
      setShowForm(false);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this manual entry? This will also affect the currency's score on the next recompute.")) return;
    const res = await fetch(`/api/admin/macro-events?id=${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const sorted = [...events].sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());

  const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:ring-2 ring-teal transition-shadow bg-[var(--bg-input)] shadow-sm text-ink";
  const labelCls = "block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim";

  return (
    <div className="view">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-medium text-[24px] tracking-[-0.02em] text-ink-strong">
            Manual Macro Data
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Fills gaps no automated feed covers cleanly, currently GBP and NZD CPI. Entries with both an
            actual and a forecast feed MacroEdge&apos;s scoring the same way a real calendar release does.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-95 bg-teal-solid shadow-[0_4px_14px_rgba(8,174,170,0.28)]"
        >
          <Icon name="add" size={18} />
          Add entry
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden bg-panel shadow-md">
        <div className="grid grid-cols-[60px_1fr_90px_70px_70px_70px_130px_70px] gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest font-semibold text-ink-dim bg-panel-2">
          <span>Ccy</span>
          <span>Title</span>
          <span>Category</span>
          <span>Actual</span>
          <span>Forecast</span>
          <span>Previous</span>
          <span>Release</span>
          <span></span>
        </div>

        {sorted.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-ink-dim">
            No manual entries yet. Click &quot;Add entry&quot; to create one.
          </div>
        )}

        {sorted.map((ev, idx) => (
          <div
            key={ev.id}
            className={cn(
              "grid grid-cols-[60px_1fr_90px_70px_70px_70px_130px_70px] items-center gap-2 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors",
              idx < sorted.length - 1 && "border-b border-line"
            )}
          >
            <span className="font-semibold text-[13px] text-ink-strong">{ev.currency}</span>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-ink-strong truncate">{ev.title}</div>
              <div className="text-[11px] text-ink-dim">{ev.impact}</div>
            </div>
            <span className="text-[11.5px] text-ink-dim">{ev.category ?? "—"}</span>
            <span className="tabular-nums text-[12.5px] text-ink">{ev.actual ?? "—"}</span>
            <span className="tabular-nums text-[12.5px] text-ink-mid">{ev.forecast ?? "—"}</span>
            <span className="tabular-nums text-[12.5px] text-ink-dim">{ev.previous ?? "—"}</span>
            <span className="text-[11.5px] text-ink-dim">{new Date(ev.eventTime).toLocaleDateString()}</span>
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => openEdit(ev)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-soft)]"
                aria-label="Edit"
              >
                <Icon name="edit" size={16} className="text-ink-mid" />
              </button>
              <button
                onClick={() => handleDelete(ev.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-coral-tint"
                aria-label="Delete"
              >
                <Icon name="delete" size={16} className="text-coral-deep" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(8,42,59,0.6)] backdrop-blur-[6px]"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="w-full max-w-[520px] rounded-2xl p-6 shadow-lg overflow-y-auto max-h-[90vh] bg-panel">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-medium text-[18px] text-ink-strong">
                {editId ? "Edit entry" : "Add entry"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--bg-soft)]">
                <Icon name="close" size={20} className="text-ink-dim" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Currency *</label>
                <select className={inputCls} value={form.currency} onChange={field("currency")}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={form.category} onChange={field("category")}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Title *</label>
                <input
                  className={inputCls}
                  placeholder="UK CPI y/y" value={form.title}
                  onChange={field("title")}
                />
              </div>

              <div>
                <label className={labelCls}>Impact</label>
                <select className={inputCls} value={form.impact} onChange={field("impact")}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Release date/time *</label>
                <input
                  className={inputCls} type="datetime-local"
                  value={form.eventTime}
                  onChange={field("eventTime")}
                />
              </div>

              <div>
                <label className={labelCls}>Actual</label>
                <input className={inputCls} placeholder="3.2%" value={form.actual} onChange={field("actual")} />
              </div>

              <div>
                <label className={labelCls}>Forecast</label>
                <input className={inputCls} placeholder="3.1%" value={form.forecast} onChange={field("forecast")} />
              </div>

              <div>
                <label className={labelCls}>Previous</label>
                <input className={inputCls} placeholder="3.0%" value={form.previous} onChange={field("previous")} />
                <p className="text-[11px] mt-1 text-ink-dim">Set both actual and forecast to feed scoring.</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 px-3.5 py-2.5 rounded-xl text-[13px] bg-coral-tint text-coral-deep shadow-ring-coral">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-colors bg-[var(--bg-soft)] text-ink-mid"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60 bg-teal-solid shadow-[0_4px_14px_rgba(8,174,170,0.28)]"
              >
                {isPending ? "Saving…" : editId ? "Save changes" : "Add entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
