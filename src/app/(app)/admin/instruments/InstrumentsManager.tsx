"use client";

import { useState, useTransition } from "react";

type Instrument = {
  id: string;
  symbol: string;
  label: string;
  category: string;
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
  symbol: "", label: "", category: "forex",
  pipSize: "0.0001", pipValue: "10",
  tdSymbol: "", cotCode: "",
  cotInverted: false, fxoTracked: false, active: true,
};

const CATEGORY_COLORS: Record<string, string> = {
  forex:     "rgba(8,174,170,0.14)",
  commodity: "rgba(248,185,61,0.14)",
  index:     "rgba(22,114,161,0.16)",
};
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

  const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:ring-2 ring-[var(--teal)] transition-shadow";
  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--line)", color: "var(--ink)" };
  const labelCls = "block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5";

  return (
    <div className="view">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
            Instruments
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            Manage tradeable pairs. Changes propagate to all dropdowns instantly.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-95"
          style={{ background: "var(--teal)", boxShadow: "0 4px 14px rgba(8,174,170,0.28)" }}
        >
          <span className="material-symbols-rounded text-[18px]">add</span>
          Add instrument
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
        {/* Column headers */}
        <div
          className="grid gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest font-semibold border-b"
          style={{ gridTemplateColumns: "36px 1fr 90px 60px 60px 60px 80px 80px 80px 80px", color: "var(--ink-dim)", borderColor: "var(--line)" }}
        >
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
          <div className="px-5 py-12 text-center text-[13px]" style={{ color: "var(--ink-dim)" }}>
            No instruments yet. Click &quot;Add instrument&quot; to create one.
          </div>
        )}

        {sorted.map((inst, idx) => (
          <div
            key={inst.id}
            className="grid items-center gap-2 px-4 py-3 border-b last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
            style={{ gridTemplateColumns: "36px 1fr 90px 60px 60px 60px 80px 80px 80px 80px", borderColor: "var(--line)" }}
          >
            {/* Order arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveOrder(inst, -1)}
                disabled={idx === 0}
                className="w-[18px] h-[18px] rounded flex items-center justify-center transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-20"
                aria-label="Move up"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: "var(--ink-mid)" }}>arrow_drop_up</span>
              </button>
              <button
                onClick={() => moveOrder(inst, 1)}
                disabled={idx === sorted.length - 1}
                className="w-[18px] h-[18px] rounded flex items-center justify-center transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-20"
                aria-label="Move down"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: "var(--ink-mid)" }}>arrow_drop_down</span>
              </button>
            </div>

            {/* Symbol + label */}
            <div>
              <div className="font-semibold tabular-nums text-[13.5px]" style={{ color: "var(--ink-strong)", letterSpacing: "0.01em" }}>
                {inst.symbol}
              </div>
              <div className="text-[11.5px]" style={{ color: "var(--ink-dim)" }}>{inst.label}</div>
            </div>

            {/* Category chip */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold w-fit"
              style={{ background: CATEGORY_COLORS[inst.category] ?? "var(--bg-soft)", color: CATEGORY_TEXT[inst.category] ?? "var(--ink-mid)" }}
            >
              {inst.category}
            </span>

            {/* Pip size */}
            <span className="tabular-nums text-[12.5px]" style={{ color: "var(--ink-mid)" }}>{inst.pipSize}</span>

            {/* Pip value */}
            <span className="tabular-nums text-[12.5px]" style={{ color: "var(--ink-mid)" }}>${inst.pipValue}</span>

            {/* TD symbol */}
            <span className="text-[11.5px] truncate" style={{ color: inst.tdSymbol ? "var(--ink)" : "var(--ink-dim)" }}>
              {inst.tdSymbol ?? "—"}
            </span>

            {/* COT code */}
            <span className="tabular-nums text-[11.5px]" style={{ color: inst.cotCode ? "var(--ink)" : "var(--ink-dim)" }}>
              {inst.cotCode ?? "—"}
            </span>

            {/* FX options toggle */}
            <button
              onClick={() => fetch("/api/admin/instruments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: inst.id, fxoTracked: !inst.fxoTracked }) }).then((r) => r.json()).then((u: Instrument) => setInstruments((prev) => prev.map((i) => i.id === inst.id ? u : i)))}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
              style={{ color: inst.fxoTracked ? "var(--teal-dark)" : "var(--ink-dim)" }}
            >
              <span className={`material-symbols-rounded ${inst.fxoTracked ? "ic-fill" : ""}`} style={{ fontSize: 16, color: inst.fxoTracked ? "var(--teal)" : "var(--ink-dim)" }}>
                {inst.fxoTracked ? "check_circle" : "radio_button_unchecked"}
              </span>
              {inst.fxoTracked ? "Yes" : "No"}
            </button>

            {/* Active toggle */}
            <button
              onClick={() => toggleActive(inst)}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
              style={{ color: inst.active ? "var(--teal-dark)" : "var(--coral)" }}
            >
              <span
                className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: inst.active ? "var(--teal)" : "var(--track)" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: inst.active ? "translateX(16px)" : "translateX(0)" }}
                />
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
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--ink-mid)" }}>edit</span>
              </button>
              <button
                onClick={() => handleDelete(inst.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(234,82,61,0.1)]"
                aria-label="Delete"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--coral)" }}>delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,42,59,0.6)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div
            className="w-full max-w-[520px] rounded-2xl p-6 shadow-2xl overflow-y-auto"
            style={{ background: "var(--modal-bg, var(--panel))", border: "1px solid var(--line)", maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-[18px]" style={{ color: "var(--ink-strong)" }}>
                {editId ? "Edit instrument" : "Add instrument"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--bg-soft)]">
                <span className="material-symbols-rounded text-[20px]" style={{ color: "var(--ink-dim)" }}>close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Symbol */}
              <div>
                <label className={labelCls} style={{ color: "var(--ink-dim)" }}>Symbol *</label>
                <input
                  className={inputCls} style={inputStyle}
                  placeholder="EURUSD" value={form.symbol}
                  onChange={field("symbol")}
                  disabled={!!editId}
                />
              </div>

              {/* Label */}
              <div>
                <label className={labelCls} style={{ color: "var(--ink-dim)" }}>Label *</label>
                <input
                  className={inputCls} style={inputStyle}
                  placeholder="EUR/USD" value={form.label}
                  onChange={field("label")}
                />
              </div>

              {/* Category */}
              <div>
                <label className={labelCls} style={{ color: "var(--ink-dim)" }}>Category *</label>
                <select className={inputCls} style={inputStyle} value={form.category} onChange={field("category")}>
                  <option value="forex">Forex</option>
                  <option value="commodity">Commodity</option>
                  <option value="index">Index</option>
                </select>
              </div>

              {/* Pip size */}
              <div>
                <label className={labelCls} style={{ color: "var(--ink-dim)" }}>Pip size</label>
                <input
                  className={inputCls} style={inputStyle} type="number" step="0.00001"
                  placeholder="0.0001" value={form.pipSize}
                  onChange={field("pipSize")}
                />
              </div>

              {/* Pip value (USD) */}
              <div>
                <label className={labelCls} style={{ color: "var(--ink-dim)" }}>Pip value (USD)</label>
                <input
                  className={inputCls} style={inputStyle} type="number" step="0.01"
                  placeholder="10" value={form.pipValue}
                  onChange={field("pipValue")}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--ink-dim)" }}>Per pip per standard lot</p>
              </div>

              {/* TD symbol */}
              <div>
                <label className={labelCls} style={{ color: "var(--ink-dim)" }}>Twelve Data symbol</label>
                <input
                  className={inputCls} style={inputStyle}
                  placeholder="EUR/USD" value={form.tdSymbol}
                  onChange={field("tdSymbol")}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--ink-dim)" }}>For live price feed (leave blank to exclude)</p>
              </div>

              {/* COT code */}
              <div className="col-span-2">
                <label className={labelCls} style={{ color: "var(--ink-dim)" }}>COT contract code (CFTC)</label>
                <input
                  className={inputCls} style={inputStyle}
                  placeholder="099741" value={form.cotCode}
                  onChange={field("cotCode")}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--ink-dim)" }}>6-digit CFTC Socrata code. Leave blank to exclude from COT reports.</p>
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
                      className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: (form[key] as boolean) ? "var(--teal)" : "var(--track)", border: "1px solid var(--line)" }}
                    >
                      {(form[key] as boolean) && <span className="material-symbols-rounded ic-fill text-white" style={{ fontSize: 14 }}>check</span>}
                    </button>
                    <div>
                      <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{label}</div>
                      <div className="text-[11.5px]" style={{ color: "var(--ink-dim)" }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 px-3.5 py-2.5 rounded-xl text-[13px]" style={{ background: "rgba(234,82,61,0.1)", color: "var(--coral)", border: "1px solid rgba(234,82,61,0.2)" }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-colors"
                style={{ background: "var(--bg-soft)", color: "var(--ink-mid)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: "var(--teal)", boxShadow: "0 4px 14px rgba(8,174,170,0.28)" }}
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
