"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Panel, Icon, Button } from "@/components/ui";
import { fmtDateTime } from "@/lib/date";

// ── Types ─────────────────────────────────────────────────────────────────────

type Bias   = "bullish" | "bearish" | "ranging";
type Matrix = Record<string, Record<string, Bias>>;
type Notes  = Record<string, string>;

const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"] as const;
const TFS   = ["MN", "W", "D", "H4", "H1"] as const;

// ── Defaults (shown before first publish) ─────────────────────────────────────

const DEFAULT: Matrix = {
  EURUSD: { MN: "bullish",  W: "bullish",  D: "bearish", H4: "bullish", H1: "bullish"  },
  GBPUSD: { MN: "bullish",  W: "ranging",  D: "ranging", H4: "bearish", H1: "bearish"  },
  USDJPY: { MN: "bullish",  W: "bullish",  D: "bullish", H4: "ranging", H1: "ranging"  },
  USDCHF: { MN: "bearish",  W: "ranging",  D: "ranging", H4: "bullish", H1: "bullish"  },
  AUDUSD: { MN: "bearish",  W: "bearish",  D: "ranging", H4: "bearish", H1: "ranging"  },
  NZDUSD: { MN: "bearish",  W: "bearish",  D: "bearish", H4: "bearish", H1: "ranging"  },
  USDCAD: { MN: "bullish",  W: "ranging",  D: "bullish", H4: "bullish", H1: "ranging"  },
  XAUUSD: { MN: "bullish",  W: "bullish",  D: "bullish", H4: "bullish", H1: "bullish"  },
  NAS100: { MN: "bullish",  W: "bullish",  D: "ranging", H4: "ranging", H1: "bearish"  },
};

const DEFAULT_NOTES: Notes = {
  EURUSD: "DXY at HTF supply — watch for continuation short on DXY = long EURUSD.",
  GBPUSD: "Mixed structure. Waiting for D1 close above 1.2780 for long bias.",
  USDJPY: "Strong HTF bullish. BOJ intervention risk on H1/H4 — size down.",
  USDCHF: "Inversely correlated to EURUSD. HTF bearish USD → CHF strength.",
  AUDUSD: "Risk-off pressure. China data weighing on AUD. Bias short.",
  NZDUSD: "Strong HTF bearish. RBNZ dovish. Only looking for shorts.",
  USDCAD: "Oil correlated. Monitor CAD strength on oil rallies.",
  XAUUSD: "Bullish across all TFs. Geopolitical premium still in play.",
  NAS100: "Earnings season — choppy H1/H4. HTF structure still bullish.",
};

// ── Bias config ───────────────────────────────────────────────────────────────

const CYCLE: Record<Bias, Bias> = { bullish: "bearish", bearish: "ranging", ranging: "bullish" };

const BIAS_CONFIG: Record<Bias, { icon: string; color: string; bg: string; barColor: string }> = {
  bullish: { icon: "trending_up",   color: "var(--teal-bright)",  bg: "rgba(48,232,223,0.13)",  barColor: "var(--teal)"  },
  bearish: { icon: "trending_down", color: "var(--coral-bright)", bg: "rgba(255,89,66,0.13)",   barColor: "var(--coral)" },
  ranging: { icon: "trending_flat", color: "var(--gold)",         bg: "rgba(248,185,61,0.13)",  barColor: "var(--gold)"  },
};

// ── Confluence helpers ────────────────────────────────────────────────────────

interface Confluence {
  bias:      Bias | "mixed";
  strength:  number;
  label:     string;
  color:     string;
}

function getConfluence(row: Record<string, Bias>): Confluence {
  const counts = { bullish: 0, bearish: 0, ranging: 0 };
  TFS.forEach((tf) => { counts[row[tf]]++; });

  const dominant = counts.bullish > counts.bearish ? "bullish" : counts.bearish > counts.bullish ? "bearish" : null;
  const strength = dominant ? counts[dominant] : 0;

  if (!dominant || strength <= 2) {
    return { bias: "mixed", strength: 0, label: "Mixed — no clear bias", color: "var(--ink-dim)" };
  }

  const cfg = BIAS_CONFIG[dominant];
  return {
    bias: dominant,
    strength,
    label: `${strength}/5 ${dominant.charAt(0).toUpperCase() + dominant.slice(1)}`,
    color: cfg.color,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BiasCell({ bias, onClick, readonly }: { bias: Bias; onClick: () => void; readonly: boolean }) {
  const cfg = BIAS_CONFIG[bias];
  return (
    <button
      type="button"
      onClick={readonly ? undefined : onClick}
      title={readonly ? bias : `${bias} — click to change`}
      disabled={readonly}
      className="flex items-center justify-center rounded-xl transition-all"
      style={{
        width: 56, height: 44,
        background: cfg.bg,
        flexShrink: 0,
        cursor: readonly ? "default" : "pointer",
      }}
    >
      <span
        className="material-symbols-rounded"
        style={{ fontSize: 20, color: cfg.color, fontVariationSettings: "'FILL' 1" }}
      >
        {cfg.icon}
      </span>
    </button>
  );
}

function ConfluenceBar({ conf }: { conf: Confluence }) {
  if (conf.bias === "mixed") {
    return <div className="flex items-center gap-2 min-w-[140px]"><span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>Mixed</span></div>;
  }
  const pct = (conf.strength / 5) * 100;
  const cfg = BIAS_CONFIG[conf.bias];
  return (
    <div className="flex items-center gap-2.5 min-w-[160px]">
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cfg.barColor }} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums whitespace-nowrap" style={{ color: conf.color }}>
        {conf.label}
      </span>
    </div>
  );
}

function NoteRow({ pair, value, onChange, readonly }: { pair: string; value: string; onChange: (v: string) => void; readonly: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  if (readonly) {
    return value ? (
      <p className="text-[11.5px] mt-0.5 leading-relaxed max-w-[300px] truncate" style={{ color: "var(--ink-dim)" }}>{value}</p>
    ) : null;
  }

  if (!editing && !value) {
    return (
      <button
        type="button"
        className="text-[11.5px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
        style={{ color: "var(--ink-dim)" }}
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
          className="flex-1 bg-transparent text-[12px] outline-none border-b"
          style={{ borderColor: "var(--teal)", color: "var(--ink-strong)" }}
          placeholder="Your HTF analysis…"
        />
        <button type="button" onClick={() => { onChange(draft); setEditing(false); }}>
          <Icon name="check" size={14} style={{ color: "var(--teal)" }} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="text-left text-[11.5px] mt-0.5 leading-relaxed cursor-text max-w-[300px] truncate"
      style={{ color: "var(--ink-dim)" }}
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </button>
  );
}

function SummaryRow({ matrix }: { matrix: Matrix }) {
  const tfBias = TFS.map((tf) => {
    const counts = { bullish: 0, bearish: 0, ranging: 0 };
    PAIRS.forEach((p) => counts[matrix[p][tf]]++);
    const dom: Bias = counts.bullish > counts.bearish ? "bullish" : counts.bearish > counts.bullish ? "bearish" : "ranging";
    return { tf, dom, counts };
  });

  return (
    <tr style={{ borderTop: "2px solid var(--line)" }}>
      <td className="px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>
          TF consensus
        </span>
      </td>
      {tfBias.map(({ tf, dom, counts }) => {
        const cfg = BIAS_CONFIG[dom];
        return (
          <td key={tf} className="px-2 py-3 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: cfg.color, fontVariationSettings: "'FILL' 1" }}>
                {cfg.icon}
              </span>
              <span className="text-[10px]" style={{ color: "var(--ink-dim)" }}>
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

export function TrendMatrix({ isInstructor }: { isInstructor: boolean }) {
  const [matrix, setMatrix]         = useState<Matrix>(DEFAULT);
  const [notes, setNotes]           = useState<Notes>(DEFAULT_NOTES);
  const [updatedAt, setUpdatedAt]   = useState<string | null>(null);
  const [isDirty, setIsDirty]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const initialLoad                 = useRef(true);

  // Fetch from API on mount
  useEffect(() => {
    fetch("/api/trend-matrix")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setMatrix(data.matrix as Matrix);
          setNotes(data.notes as Notes);
          setUpdatedAt(data.updatedAt as string);
        }
      })
      .catch(() => {/* keep defaults */})
      .finally(() => {
        setLoading(false);
        initialLoad.current = false;
      });
  }, []);

  // Track dirty state after initial load
  useEffect(() => {
    if (initialLoad.current) return;
    setIsDirty(true);
    setSaveError(null);
  }, [matrix, notes]);

  const confluenceMap = useMemo(
    () => Object.fromEntries(PAIRS.map((p) => [p, getConfluence(matrix[p])])),
    [matrix]
  );

  const tradeablePairs = useMemo(
    () => PAIRS.filter((p) => confluenceMap[p].bias !== "mixed"),
    [confluenceMap]
  );

  function toggleCell(pair: string, tf: string) {
    setMatrix((m) => ({ ...m, [pair]: { ...m[pair], [tf]: CYCLE[m[pair][tf]] } }));
  }

  function setNote(pair: string, note: string) {
    setNotes((n) => ({ ...n, [pair]: note }));
  }

  function resetMatrix() {
    setMatrix(DEFAULT);
    setNotes(DEFAULT_NOTES);
  }

  async function handlePublish() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/trend-matrix", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ matrix, notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to publish");
      }
      const data = await res.json() as { updatedAt: string };
      setUpdatedAt(data.updatedAt);
      setIsDirty(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  }

  const updatedLabel = updatedAt
    ? fmtDateTime(updatedAt)
    : null;

  return (
    <div className="view">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
            Trend Matrix
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            {isInstructor
              ? "Set weekly HTF bias for each pair and timeframe, then publish for all students."
              : "Kondwani's weekly HTF bias read. Updated every Sunday."}
            {updatedLabel && <span className="ml-2">· Last updated {updatedLabel}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-[12px]" style={{ color: "var(--ink-dim)" }}>
            {(["bullish", "bearish", "ranging"] as Bias[]).map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: BIAS_CONFIG[b].color, fontVariationSettings: "'FILL' 1" }}>
                  {BIAS_CONFIG[b].icon}
                </span>
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </span>
            ))}
          </div>

          {isInstructor && (
            <>
              <Button type="button" variant="ghost" icon="refresh" onClick={resetMatrix}>Reset</Button>
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
        <div className="mb-4 px-4 py-2.5 rounded-xl text-[12.5px]" style={{ background: "rgba(234,82,61,0.1)", color: "var(--coral)" }}>
          {saveError}
        </div>
      )}

      {/* ── Summary chips ── */}
      {tradeablePairs.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-dim)" }}>Clear bias:</span>
          {tradeablePairs.map((p) => {
            const conf = confluenceMap[p];
            const cfg  = BIAS_CONFIG[conf.bias as Bias];
            return (
              <span
                key={p}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                {p}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Matrix table ── */}
      <p className="md:hidden text-xs mb-2" style={{ color: "var(--ink-dim)" }}>← Scroll to see all timeframes</p>
      <Panel pad={0}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th className="px-5 py-3 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>Pair</span>
                </th>
                {TFS.map((tf) => (
                  <th key={tf} className="px-2 py-3 text-center w-[68px]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>{tf}</span>
                  </th>
                ))}
                <th className="px-5 py-3 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>Confluence</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? PAIRS.map((pair) => (
                    <tr key={pair} style={{ borderTop: "1px solid var(--line)" }}>
                      <td className="px-5 py-4">
                        <div className="h-4 w-16 rounded animate-pulse" style={{ background: "var(--track)" }} />
                      </td>
                      {TFS.map((tf) => (
                        <td key={tf} className="px-2 py-4">
                          <div className="h-11 w-14 rounded-xl animate-pulse mx-auto" style={{ background: "var(--track)" }} />
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="h-3 w-32 rounded animate-pulse" style={{ background: "var(--track)" }} />
                      </td>
                    </tr>
                  ))
                : PAIRS.map((pair, i) => {
                    const conf = confluenceMap[pair];
                    return (
                      <tr
                        key={pair}
                        className="group transition-colors hover:bg-[var(--hover)]"
                        style={{ borderTop: i > 0 ? "1px solid var(--line)" : undefined }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-display font-bold text-[14px]" style={{ color: "var(--ink-strong)" }}>{pair}</div>
                          <NoteRow pair={pair} value={notes[pair] ?? ""} onChange={(v) => setNote(pair, v)} readonly={!isInstructor} />
                        </td>
                        {TFS.map((tf) => (
                          <td key={tf} className="px-2 py-3 text-center">
                            <div className="flex justify-center">
                              <BiasCell bias={matrix[pair][tf]} onClick={() => toggleCell(pair, tf)} readonly={!isInstructor} />
                            </div>
                          </td>
                        ))}
                        <td className="px-5 py-3">
                          <ConfluenceBar conf={conf} />
                        </td>
                      </tr>
                    );
                  })
              }
              {!loading && <SummaryRow matrix={matrix} />}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── How to use ── */}
      <div
        className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3"
        style={{ background: "rgba(8,174,170,0.06)", border: "1px solid rgba(8,174,170,0.15)" }}
      >
        <Icon name="info" size={17} fill style={{ color: "var(--teal)", flexShrink: 0, marginTop: 1 }} />
        <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>
          {isInstructor
            ? "Update this matrix every Sunday after your weekly chart review, then hit Publish. Students will immediately see your updated bias across all pairs and timeframes."
            : "This matrix is updated every Sunday by Kondwani after his weekly chart review. Use the bias alignment to confirm your trade direction before entering. Only trade models where the HTF bias matches — validate in the Rules Validator first."}
        </p>
      </div>
    </div>
  );
}
