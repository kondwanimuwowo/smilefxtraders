"use client";

import { useState, useMemo } from "react";
import { Panel, Icon, Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtDateTime, fmtDayMonth } from "@/lib/date";
import { useInstrumentSymbols } from "@/lib/hooks/useInstruments";
import { useStore } from "@/lib/store";
import type { TrendMatrixData, TrendCell } from "@/lib/trend-matrix";
import type { TrendBias, TrendTf } from "@/lib/trend/structure";

// ── Types ─────────────────────────────────────────────────────────────────────

type Bias  = TrendBias;
type Notes = Record<string, string>;
/** Unsaved instructor edits, keyed "PAIR:TF". null clears the override. */
type Pending = Record<string, Bias | null>;

const PAIRS_FALLBACK = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"];
const TFS: readonly TrendTf[] = ["MN", "W", "D", "H4", "H1"];

// ── Bias config ───────────────────────────────────────────────────────────────

/** Instructor click cycle. "auto" hands the cell back to the computed read. */
type Choice = Bias | "auto";
const CYCLE: Record<Choice, Choice> = { auto: "bullish", bullish: "bearish", bearish: "ranging", ranging: "auto" };

const BIAS_CONFIG: Record<Bias, { icon: string; textCls: string; bgCls: string; barBgCls: string }> = {
  bullish: { icon: "trending_up",   textCls: "text-teal-deep",  bgCls: "bg-teal-tint",  barBgCls: "bg-teal"  },
  bearish: { icon: "trending_down", textCls: "text-coral-deep", bgCls: "bg-coral-tint", barBgCls: "bg-coral" },
  ranging: { icon: "trending_flat", textCls: "text-gold-deep",  bgCls: "bg-gold-tint",  barBgCls: "bg-gold"  },
};

const key = (pair: string, tf: TrendTf) => `${pair}:${tf}`;

// ── Confluence helpers ────────────────────────────────────────────────────────

interface Confluence {
  bias:      Bias | "mixed";
  strength:  number;
  label:     string;
  colorCls:  string;
}

function getConfluence(row: Partial<Record<TrendTf, Bias>>): Confluence {
  const counts = { bullish: 0, bearish: 0, ranging: 0 };
  TFS.forEach((tf) => { const b = row[tf]; if (b) counts[b]++; });

  const dominant = counts.bullish > counts.bearish ? "bullish" : counts.bearish > counts.bullish ? "bearish" : null;
  const strength = dominant ? counts[dominant] : 0;

  if (!dominant || strength <= 2) {
    return { bias: "mixed", strength: 0, label: "Mixed: no clear bias", colorCls: "text-ink-dim" };
  }

  const cfg = BIAS_CONFIG[dominant];
  return {
    bias: dominant,
    strength,
    label: `${strength}/5 ${dominant.charAt(0).toUpperCase() + dominant.slice(1)}`,
    colorCls: cfg.textCls,
  };
}

function describeCell(cell: TrendCell | undefined, pending: boolean): string {
  if (pending) return "Unsaved change";
  if (!cell) return "No current read";
  if (cell.source === "instructor") {
    const auto = cell.autoBias ? ` Structure reads ${cell.autoBias}.` : "";
    return `Kondwani's call until ${fmtDayMonth(cell.expiresAt!)}.${auto}`;
  }
  const brk = cell.lastBreak
    ? `${cell.lastBreak.type} ${cell.lastBreak.dir === "bullish" ? "up" : "down"} through ${cell.lastBreak.price} on ${fmtDayMonth(cell.lastBreak.at)}. `
    : "";
  return `${brk}Computed ${fmtDateTime(cell.asOf)}.`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BiasCell({ bias, instructor, pending, title, onClick, readonly, pair, tf }: {
  bias: Bias | null; instructor: boolean; pending: boolean; title: string;
  onClick: () => void; readonly: boolean; pair: string; tf: string;
}) {
  const cfg = bias ? BIAS_CONFIG[bias] : null;
  return (
    <button
      type="button"
      onClick={readonly ? undefined : onClick}
      title={title}
      // The icon alone conveys the bias, so a screen reader otherwise reads
      // this whole grid as a wall of unlabelled buttons.
      aria-label={`${pair} ${tf}: ${bias ?? "no read"}${instructor ? ", instructor override" : ""}${readonly ? "" : ". Click to change"}`}
      disabled={readonly}
      className={cn(
        "relative flex items-center justify-center rounded-xl transition-all w-14 h-11 shrink-0",
        cfg ? cfg.bgCls : "bg-panel-2",
        pending && "ring-2 ring-gold-deep",
        readonly ? "cursor-default" : "cursor-pointer",
      )}
    >
      {cfg ? <Icon name={cfg.icon} size={20} className={cfg.textCls} /> : <Icon name="remove" size={18} className="text-ink-dim" />}
      {instructor && (
        <span className="absolute top-0.5 right-1 text-[9px] font-bold text-gold-deep">K</span>
      )}
    </button>
  );
}

function ConfluenceBar({ conf }: { conf: Confluence }) {
  if (conf.bias === "mixed") {
    return <div className="flex items-center gap-2 min-w-[140px]"><span className="text-[12px] text-ink-dim">Mixed</span></div>;
  }
  const pct = (conf.strength / 5) * 100;
  const cfg = BIAS_CONFIG[conf.bias];
  return (
    <div className="flex items-center gap-2.5 min-w-[160px]">
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden bg-track">
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", cfg.barBgCls)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[12px] font-semibold tabular-nums whitespace-nowrap", conf.colorCls)}>
        {conf.label}
      </span>
    </div>
  );
}

function NoteRow({ value, onChange, readonly }: { value: string; onChange: (v: string) => void; readonly: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  if (readonly) {
    return value ? (
      <p className="text-[11.5px] mt-0.5 leading-relaxed max-w-[300px] truncate text-ink-dim">{value}</p>
    ) : null;
  }

  if (!editing && !value) {
    return (
      <button
        type="button"
        className="text-[11.5px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 text-ink-dim"
        onClick={() => { setDraft(""); setEditing(true); }}
      >
        <Icon name="add" size={13} /> Add analysis note
      </button>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter")  { onChange(draft); setEditing(false); }
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          onBlur={() => { onChange(draft); setEditing(false); }}
          className="flex-1 bg-transparent text-[12px] outline-none border-b border-teal text-ink-strong"
          placeholder="Your HTF analysis…"
        />
        <button type="button" onClick={() => { onChange(draft); setEditing(false); }}>
          <Icon name="check" size={14} className="text-teal-deep" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="text-left text-[11.5px] mt-0.5 leading-relaxed cursor-text max-w-[300px] truncate text-ink-dim"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </button>
  );
}

function SummaryRow({ matrix, pairs }: { matrix: TrendMatrixData["matrix"]; pairs: string[] }) {
  const tfBias = TFS.map((tf) => {
    const counts = { bullish: 0, bearish: 0, ranging: 0 };
    pairs.forEach((p) => { const b = matrix[p]?.[tf]; if (b) counts[b]++; });
    const dom: Bias = counts.bullish > counts.bearish ? "bullish" : counts.bearish > counts.bullish ? "bearish" : "ranging";
    return { tf, dom, counts };
  });

  return (
    <tr className="bg-panel-2">
      <td className="px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
          TF consensus
        </span>
      </td>
      {tfBias.map(({ tf, dom, counts }) => {
        const cfg = BIAS_CONFIG[dom];
        return (
          <td key={tf} className="px-2 py-3 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <Icon name={cfg.icon} size={16} className={cfg.textCls} />
              <span className="text-[10px] text-ink-dim">
                {counts.bullish}↑ {counts.bearish}↓
              </span>
            </div>
          </td>
        );
      })}
      <td />
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrendMatrix({ initial }: { initial: TrendMatrixData | null }) {
  const isInstructor = useStore((s) => s.user?.role === "instructor");
  const instrumentSymbols = useInstrumentSymbols();
  const PAIRS = instrumentSymbols.length ? instrumentSymbols : PAIRS_FALLBACK;

  // Seeded from the server render (see page.tsx) rather than React Query: the
  // instructor edits overrides and notes locally, then publishes them.
  const [data, setData]           = useState<TrendMatrixData | null>(initial);
  const [notes, setNotes]         = useState<Notes>(initial?.notes ?? {});
  const [pending, setPending]     = useState<Pending>({});
  const [notesDirty, setNotesDirty] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = notesDirty || Object.keys(pending).length > 0;
  const pairsKey = PAIRS.join(",");

  // The matrix as it will look once pending edits are published.
  const effective = useMemo(() => {
    const out: TrendMatrixData["matrix"] = {};
    for (const pair of PAIRS) {
      const row: Partial<Record<TrendTf, Bias>> = {};
      for (const tf of TFS) {
        const k = key(pair, tf);
        const cell = data?.cells[pair]?.[tf];
        if (k in pending) {
          const p = pending[k];
          const auto = cell?.source === "auto" ? cell.bias : cell?.autoBias ?? undefined;
          const b = p ?? auto;
          if (b) row[tf] = b;
        } else if (cell) {
          row[tf] = cell.bias;
        }
      }
      out[pair] = row;
    }
    return out;
    // PAIRS is a fresh array each render; its joined value is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pending, pairsKey]);

  const confluenceMap = useMemo(
    () => Object.fromEntries(PAIRS.map((p) => [p, getConfluence(effective[p] ?? {})])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effective],
  );

  const tradeablePairs = PAIRS.filter((p) => confluenceMap[p]?.bias !== "mixed");

  function currentChoice(pair: string, tf: TrendTf): Choice {
    const k = key(pair, tf);
    if (k in pending) return pending[k] ?? "auto";
    const cell = data?.cells[pair]?.[tf];
    return cell?.source === "instructor" ? cell.bias : "auto";
  }

  function toggleCell(pair: string, tf: TrendTf) {
    const next = CYCLE[currentChoice(pair, tf)];
    const savedCell = data?.cells[pair]?.[tf];
    const saved: Choice = savedCell?.source === "instructor" ? savedCell.bias : "auto";
    setPending((p) => {
      const copy = { ...p };
      if (next === saved) delete copy[key(pair, tf)];
      else copy[key(pair, tf)] = next === "auto" ? null : next;
      return copy;
    });
    setSaveError(null);
  }

  function setNote(pair: string, note: string) {
    if ((notes[pair] ?? "") === note) return;
    setNotes((n) => ({ ...n, [pair]: note }));
    setNotesDirty(true);
    setSaveError(null);
  }

  function discard() {
    setPending({});
    setNotes(data?.notes ?? {});
    setNotesDirty(false);
  }

  async function handlePublish() {
    setSaving(true);
    setSaveError(null);
    try {
      const overrides = Object.entries(pending).map(([k, bias]) => {
        const [pair, tf] = k.split(":");
        return { pair, tf, bias };
      });
      const res = await fetch("/api/trend-matrix", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ overrides, ...(notesDirty ? { notes } : {}) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to publish");
      }
      const fresh = await res.json() as TrendMatrixData;
      setData(fresh);
      setNotes(fresh.notes);
      setPending({});
      setNotesDirty(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  }

  const hasAnyRead = !!data && Object.keys(data.cells).length > 0;

  if (!hasAnyRead && !isInstructor) {
    return (
      <Panel>
        <EmptyState
          icon="ssid_chart"
          title="No trend read yet"
          body="The matrix fills in from live market structure. Check back shortly."
        />
      </Panel>
    );
  }

  return (
    <div className="view">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Trend Matrix
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            {isInstructor
              ? "Bias is read from market structure every hour. Click a cell to set your own call for 7 days; click through to Auto to hand it back."
              : "Bias is read from market structure every hour. Cells marked K are Kondwani's call."}
            {data?.updatedAt && <span className="ml-2">· Updated {fmtDateTime(data.updatedAt)}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-[12px] text-ink-dim">
            {(["bullish", "bearish", "ranging"] as Bias[]).map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <Icon name={BIAS_CONFIG[b].icon} size={14} className={BIAS_CONFIG[b].textCls} />
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </span>
            ))}
          </div>

          {isInstructor && (
            <>
              <Button type="button" variant="ghost" icon="refresh" onClick={discard} disabled={!isDirty || saving}>Discard</Button>
              <Button
                type="button"
                variant="primary"
                icon={saving ? "hourglass_empty" : "publish"}
                onClick={handlePublish}
                disabled={saving || !isDirty}
              >
                {saving ? "Publishing…" : isDirty ? "Publish" : "Published"}
              </Button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-[12.5px] bg-coral-tint text-coral-deep">
          {saveError}
        </div>
      )}

      {/* ── Summary chips ── */}
      {tradeablePairs.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[12px] font-semibold text-ink-dim">Clear bias:</span>
          {tradeablePairs.map((p) => {
            const conf = confluenceMap[p];
            const cfg  = BIAS_CONFIG[conf.bias as Bias];
            return (
              <span
                key={p}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold", cfg.bgCls, cfg.textCls)}
              >
                <Icon name={cfg.icon} size={13} />
                {p}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Matrix table ── */}
      <p className="md:hidden text-xs mb-2 text-ink-dim">← Scroll to see all timeframes</p>
      <Panel pad={0} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-panel-2">
                <th className="px-5 py-3 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Pair</span>
                </th>
                {TFS.map((tf) => (
                  <th key={tf} className="px-2 py-3 text-center w-[68px]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">{tf}</span>
                  </th>
                ))}
                <th className="px-5 py-3 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Confluence</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map((pair, i) => (
                <tr
                  key={pair}
                  className={cn("group transition-colors hover:bg-hover", i < PAIRS.length - 1 && "border-b border-line-soft")}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-display font-bold text-[14px] text-ink-strong">{pair}</div>
                    <NoteRow value={notes[pair] ?? ""} onChange={(v) => setNote(pair, v)} readonly={!isInstructor} />
                  </td>
                  {TFS.map((tf) => {
                    const k = key(pair, tf);
                    const isPending = k in pending;
                    const cell = data?.cells[pair]?.[tf];
                    const instructor = isPending ? pending[k] !== null : cell?.source === "instructor";
                    return (
                      <td key={tf} className="px-2 py-3 text-center">
                        <div className="flex justify-center">
                          <BiasCell
                            bias={effective[pair]?.[tf] ?? null}
                            instructor={instructor}
                            pending={isPending}
                            title={describeCell(cell, isPending)}
                            onClick={() => toggleCell(pair, tf)}
                            readonly={!isInstructor}
                            pair={pair}
                            tf={tf}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-5 py-3">
                    <ConfluenceBar conf={confluenceMap[pair]} />
                  </td>
                </tr>
              ))}
              <SummaryRow matrix={effective} pairs={PAIRS} />
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── How to use ── */}
      <div className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3 bg-teal-tint-soft shadow-ring-teal-2">
        <Icon name="info" size={17} fill className="text-teal-deep shrink-0 mt-px" />
        <p className="text-[12.5px] leading-relaxed text-ink-mid">
          {isInstructor
            ? "Each cell follows the last close-based break of structure on that timeframe. Two changes of character with no break of structure to confirm either side reads as ranging. Your calls show a K and lapse back to the computed read after 7 days, so the matrix never goes stale if you miss a week."
            : "Each cell follows the last close-based break of structure on that timeframe. Hover a cell to see the break behind it. Only trade models where the HTF bias matches, and validate in the Rules Validator first."}
        </p>
      </div>
    </div>
  );
}
