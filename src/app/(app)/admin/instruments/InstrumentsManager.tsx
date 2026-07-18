"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

type Instrument = {
  id: string;
  symbol: string;
  label: string;
  category: string;
  tier: string;
  pipSize: number;
  pipValue: number;
  tdSymbol: string | null;
  cotCode: string | null;
  cotInverted: boolean;
  fxoTracked: boolean;
  active: boolean;
  displayOrder: number;
};

const EMPTY_FORM = {
  symbol: "", label: "", category: "forex", tier: "major",
  pipSize: "0.0001", pipValue: "10",
  tdSymbol: "", cotCode: "",
  cotInverted: false, fxoTracked: false, active: true,
};

const CATEGORY_COLORS: Record<string, string> = {
  forex:     "rgba(8,174,170,0.14)",
  commodity: "rgba(248,185,61,0.14)",
  index:     "rgba(22,114,161,0.16)",
};
// forex/commodity reference --teal-dark/--gold-dark, which are scoped to
// .marketing-theme in globals.css and not present on admin pages — left as
// raw var strings (not converted) since they're silently no-ops here,
// matching this project's precedent for other pre-existing broken-token configs.
const CATEGORY_TEXT: Record<string, string> = {
  forex:     "var(--teal-dark)",
  commodity: "var(--gold-dark)",
  index:     "var(--navy)",
};

export function InstrumentsManager({ initial }: { initial: Instrument[] }) {
  const [instruments, setInstruments] = useState<Instrument[]>(initial);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editId, setEditId]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  function field(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(inst: Instrument) {
    setForm({
      symbol:      inst.symbol,
      label:       inst.label,
      category:    inst.category,
      tier:        inst.tier,
      pipSize:     String(inst.pipSize),
      pipValue:    String(inst.pipValue),
      tdSymbol:    inst.tdSymbol ?? "",
      cotCode:     inst.cotCode  ?? "",
      cotInverted: inst.cotInverted,
      fxoTracked:  inst.fxoTracked,
      active:      inst.active,
    });
    setEditId(inst.id);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.symbol || !form.label || !form.category) {
      setError("Symbol, label, and category are required.");
      return;
    }
    startTransition(async () => {
      const payload = {
        symbol:      form.symbol.toUpperCase().trim(),
        label:       form.label.trim(),
        category:    form.category,
        tier:        form.tier,
        pipSize:     Number(form.pipSize),
        pipValue:    Number(form.pipValue),
        tdSymbol:    form.tdSymbol.trim() || null,
        cotCode:     form.cotCode.trim()  || null,
        cotInverted: form.cotInverted,
        fxoTracked:  form.fxoTracked,
        active:      form.active,
      };

      if (editId) {
        const res = await fetch("/api/admin/instruments", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) { setError("Save failed."); return; }
        const updated: Instrument = await res.json();
        setInstruments((prev) => prev.map((i) => i.id === editId ? updated : i));
      } else {
        const res = await fetch("/api/admin/instruments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { setError("Create failed. The symbol may already exist."); return; }
        const created: Instrument = await res.json();
        setInstruments((prev) => [...prev, created]);
      }
      setShowForm(false);
    });
  }

  async function toggleActive(inst: Instrument) {
    const res = await fetch("/api/admin/instruments", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inst.id, active: !inst.active }),
    });
    if (!res.ok) return;
    const updated: Instrument = await res.json();
    setInstruments((prev) => prev.map((i) => i.id === inst.id ? updated : i));
  }

  async function moveOrder(inst: Instrument, dir: -1 | 1) {
    const sorted = [...instruments].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((i) => i.id === inst.id);
    const swap = sorted[idx + dir];
    if (!swap) return;

    await Promise.all([
      fetch("/api/admin/instruments", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inst.id, displayOrder: swap.displayOrder }),
      }),
      fetch("/api/admin/instruments", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: swap.id, displayOrder: inst.displayOrder }),
      }),
    ]);

    setInstruments((prev) => prev.map((i) => {
      if (i.id === inst.id) return { ...i, displayOrder: swap.displayOrder };
      if (i.id === swap.id) return { ...i, displayOrder: inst.displayOrder };
      return i;
    }));
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this instrument? This will hide it from all dropdowns.")) return;
    const res = await fetch(`/api/admin/instruments?id=${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setInstruments((prev) => prev.filter((i) => i.id !== id));
  }

  const sorted = [...instruments].sort((a, b) => a.displayOrder - b.displayOrder);

  // --bg-input is not defined anywhere in the codebase; bg-[var(--bg-input)]
  // preserves that pre-existing no-op exactly instead of "fixing" it.
  const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:ring-2 ring-teal transition-shadow bg-[var(--bg-input)] border border-line text-ink";
  const labelCls = "block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim";

  return (
    <div className="view">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-medium text-[24px] tracking-[-0.02em] text-ink-strong">
            Instruments
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Manage tradeable pairs. Changes propagate to all dropdowns instantly.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-95 bg-teal shadow-[0_4px_14px_rgba(8,174,170,0.28)]"
        >
          <Icon name="add" size={18} />
          Add instrument
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-panel border border-line">
        {/* Column headers */}
        <div className="grid grid-cols-[36px_1fr_90px_60px_60px_60px_80px_80px_80px_80px] gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest font-semibold border-b text-ink-dim border-line">
          <span>Ord</span>
          <span>Pair</span>
          <span>Category</span>
          <span>Pip sz</span>
          <span>Pip $</span>
          <span>TD sym</span>
          <span>COT code</span>
          <span>FX opt</span>
          <span>Active</span>
          <span></span>
        </div>

        {sorted.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-ink-dim">
            No instruments yet. Click &quot;Add instrument&quot; to create one.
          </div>
        )}

        {sorted.map((inst, idx) => (
          <div
            key={inst.id}
            className="grid grid-cols-[36px_1fr_90px_60px_60px_60px_80px_80px_80px_80px] items-center gap-2 px-4 py-3 border-b last:border-0 border-line hover:bg-[var(--bg-hover)] transition-colors"
          >
            {/* Order arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveOrder(inst, -1)}
                disabled={idx === 0}
                className="w-[18px] h-[18px] rounded flex items-center justify-center transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-20"
                aria-label="Move up"
              >
                <Icon name="arrow_drop_up" size={14} className="text-ink-mid" />
              </button>
              <button
                onClick={() => moveOrder(inst, 1)}
                disabled={idx === sorted.length - 1}
                className="w-[18px] h-[18px] rounded flex items-center justify-center transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-20"
                aria-label="Move down"
              >
                <Icon name="arrow_drop_down" size={14} className="text-ink-mid" />
              </button>
            </div>

            {/* Symbol + label */}
            <div>
              <div className="font-semibold tabular-nums text-[13.5px] tracking-[0.01em] text-ink-strong">
                {inst.symbol}
              </div>
              <div className="text-[11.5px] text-ink-dim">{inst.label}</div>
            </div>

            {/* Category chip */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold w-fit"
              style={{ background: CATEGORY_COLORS[inst.category] ?? "var(--bg-soft)", color: CATEGORY_TEXT[inst.category] ?? "var(--ink-mid)" }}
            >
              {inst.category}
            </span>

            {/* Pip size */}
            <span className="tabular-nums text-[12.5px] text-ink-mid">{inst.pipSize}</span>

            {/* Pip value */}
            <span className="tabular-nums text-[12.5px] text-ink-mid">${inst.pipValue}</span>

            {/* TD symbol */}
            <span className={cn("text-[11.5px] truncate", inst.tdSymbol ? "text-ink" : "text-ink-dim")}>
              {inst.tdSymbol ?? "—"}
            </span>

            {/* COT code */}
            <span className={cn("tabular-nums text-[11.5px]", inst.cotCode ? "text-ink" : "text-ink-dim")}>
              {inst.cotCode ?? "—"}
            </span>

            {/* FX options toggle */}
            <button
              onClick={() => fetch("/api/admin/instruments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: inst.id, fxoTracked: !inst.fxoTracked }) }).then((r) => r.json()).then((u: Instrument) => setInstruments((prev) => prev.map((i) => i.id === inst.id ? u : i)))}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
              style={{ color: inst.fxoTracked ? "var(--teal-dark)" : "var(--ink-dim)" }}
            >
              <Icon
                name={inst.fxoTracked ? "check_circle" : "radio_button_unchecked"}
                size={16}
                className={inst.fxoTracked ? "text-teal" : "text-ink-dim"}
              />
              {inst.fxoTracked ? "Yes" : "No"}
            </button>

            {/* Active toggle */}
            <button
              onClick={() => toggleActive(inst)}
              className={cn("flex items-center gap-1.5 text-[12px] font-medium transition-colors", inst.active ? undefined : "text-coral")}
              style={{ color: inst.active ? "var(--teal-dark)" : undefined }}
            >
              <span className={cn("w-9 h-5 rounded-full relative transition-colors flex-shrink-0", inst.active ? "bg-teal" : "bg-track")}>
                <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", inst.active ? "translate-x-4" : "translate-x-0")} />
              </span>
              {inst.active ? "Live" : "Off"}
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => openEdit(inst)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-soft)]"
                aria-label="Edit"
              >
                <Icon name="edit" size={16} className="text-ink-mid" />
              </button>
              <button
                onClick={() => handleDelete(inst.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(234,82,61,0.1)]"
                aria-label="Delete"
              >
                <Icon name="delete" size={16} className="text-coral" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(8,42,59,0.6)] backdrop-blur-[6px]"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div
            className="w-full max-w-[520px] rounded-2xl p-6 shadow-lg overflow-y-auto max-h-[90vh] bg-panel border border-line"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-medium text-[18px] text-ink-strong">
                {editId ? "Edit instrument" : "Add instrument"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--bg-soft)]">
                <Icon name="close" size={20} className="text-ink-dim" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Symbol */}
              <div>
                <label className={labelCls}>Symbol *</label>
                <input
                  className={inputCls}
                  placeholder="EURUSD" value={form.symbol}
                  onChange={field("symbol")}
                  disabled={!!editId}
                />
              </div>

              {/* Label */}
              <div>
                <label className={labelCls}>Label *</label>
                <input
                  className={inputCls}
                  placeholder="EUR/USD" value={form.label}
                  onChange={field("label")}
                />
              </div>

              {/* Category */}
              <div>
                <label className={labelCls}>Category *</label>
                <select className={inputCls} value={form.category} onChange={field("category")}>
                  <option value="forex">Forex</option>
                  <option value="commodity">Commodity</option>
                  <option value="index">Index</option>
                </select>
              </div>

              {/* Tier */}
              <div>
                <label className={labelCls}>Tier</label>
                <select className={inputCls} value={form.tier} onChange={field("tier")}>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                  <option value="exotic">Exotic</option>
                </select>
              </div>

              {/* Pip size */}
              <div>
                <label className={labelCls}>Pip size</label>
                <input
                  className={inputCls} type="number" step="0.00001"
                  placeholder="0.0001" value={form.pipSize}
                  onChange={field("pipSize")}
                />
              </div>

              {/* Pip value (USD) */}
              <div>
                <label className={labelCls}>Pip value (USD)</label>
                <input
                  className={inputCls} type="number" step="0.01"
                  placeholder="10" value={form.pipValue}
                  onChange={field("pipValue")}
                />
                <p className="text-[11px] mt-1 text-ink-dim">Per pip per standard lot</p>
              </div>

              {/* TD symbol */}
              <div>
                <label className={labelCls}>Twelve Data symbol</label>
                <input
                  className={inputCls}
                  placeholder="EUR/USD" value={form.tdSymbol}
                  onChange={field("tdSymbol")}
                />
                <p className="text-[11px] mt-1 text-ink-dim">For live price feed (leave blank to exclude)</p>
              </div>

              {/* COT code */}
              <div className="col-span-2">
                <label className={labelCls}>COT contract code (CFTC)</label>
                <input
                  className={inputCls}
                  placeholder="099741" value={form.cotCode}
                  onChange={field("cotCode")}
                />
                <p className="text-[11px] mt-1 text-ink-dim">6-digit CFTC Socrata code. Leave blank to exclude from COT reports.</p>
              </div>

              {/* Toggles */}
              <div className="col-span-2 flex flex-col gap-3 pt-1">
                {(
                  [
                    { key: "cotInverted" as const, label: "COT inverted", desc: "Tick for USD-base pairs (USDJPY, USDCHF, USDCAD…)" },
                    { key: "fxoTracked"  as const, label: "FX option expiries", desc: "Include in the FX option expiries feed" },
                    { key: "active"      as const, label: "Active / visible", desc: "Uncheck to hide from all user-facing dropdowns" },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={form[key] as boolean}
                      onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                      className={cn("mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors border border-line", (form[key] as boolean) ? "bg-teal" : "bg-track")}
                    >
                      {(form[key] as boolean) && <Icon name="check" size={14} className="text-white" />}
                    </button>
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink">{label}</div>
                      <div className="text-[11.5px] text-ink-dim">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 px-3.5 py-2.5 rounded-xl text-[13px] bg-[rgba(234,82,61,0.1)] text-coral border border-[rgba(234,82,61,0.2)]">
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
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60 bg-teal shadow-[0_4px_14px_rgba(8,174,170,0.28)]"
              >
                {isPending ? "Saving…" : editId ? "Save changes" : "Add instrument"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
