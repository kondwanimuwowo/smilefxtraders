"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Panel, Icon, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtDateTime } from "@/lib/date";
import { useInstrumentSymbols } from "@/lib/hooks/useInstruments";

// ── Types ─────────────────────────────────────────────────────────────────────

type Bias   = "bullish" | "bearish" | "ranging";
type Matrix = Record<string, Record<string, Bias>>;
type Notes  = Record<string, string>;

const PAIRS_FALLBACK = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"];
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
  EURUSD: "DXY at HTF supply. Watch for continuation short on DXY = long EURUSD.",
  GBPUSD: "Mixed structure. Waiting for D1 close above 1.2780 for long bias.",
  USDJPY: "Strong HTF bullish. BOJ intervention risk on H1/H4, so size down.",
  USDCHF: "Inversely correlated to EURUSD. HTF bearish USD → CHF strength.",
  AUDUSD: "Risk-off pressure. China data weighing on AUD. Bias short.",
  NZDUSD: "Strong HTF bearish. RBNZ dovish. Only looking for shorts.",
  USDCAD: "Oil correlated. Monitor CAD strength on oil rallies.",
  XAUUSD: "Bullish across all TFs. Geopolitical premium still in play.",
  NAS100: "Earnings season: choppy H1/H4. HTF structure still bullish.",
};

// ── Bias config ───────────────────────────────────────────────────────────────

const CYCLE: Record<Bias, Bias> = { bullish: "bearish", bearish: "ranging", ranging: "bullish" };

const BIAS_CONFIG: Record<Bias, { icon: string; textCls: string; bgCls: string; barBgCls: string }> = {
  bullish: { icon: "trending_up",   textCls: "text-teal-bright",  bgCls: "bg-[rgba(48,232,223,0.13)]", barBgCls: "bg-teal"  },
  bearish: { icon: "trending_down", textCls: "text-coral-bright", bgCls: "bg-[rgba(255,89,66,0.13)]",  barBgCls: "bg-coral" },
  ranging: { icon: "trending_flat", textCls: "text-gold",         bgCls: "bg-[rgba(248,185,61,0.13)]", barBgCls: "bg-gold"  },
};

// ── Confluence helpers ────────────────────────────────────────────────────────

interface Confluence {
  bias:      Bias | "mixed";
  strength:  number;
  label:     string;
  colorCls:  string;
}

function getConfluence(row: Record<string, Bias>): Confluence {
  const counts = { bullish: 0, bearish: 0, ranging: 0 };
  TFS.forEach((tf) => { counts[row[tf]]++; });

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

// ── Sub-components ────────────────────────────────────────────────────────────

function BiasCell({ bias, onClick, readonly }: { bias: Bias; onClick: () => void; readonly: boolean }) {
  const cfg = BIAS_CONFIG[bias];
  return (
    <button
      type="button"
      onClick={readonly ? undefined : onClick}
      title={readonly ? bias : `${bias} (click to change)`}
      disabled={readonly}
      className={cn("flex items-center justify-center rounded-xl transition-all w-14 h-11 shrink-0", cfg.bgCls, readonly ? "cursor-default" : "cursor-pointer")}
    >
      <span className={cn("material-symbols-rounded ic-fill text-[20px]", cfg.textCls)}>
        {cfg.icon}
      </span>
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

function NoteRow({ pair, value, onChange, readonly }: { pair: string; value: string; onChange: (v: string) => void; readonly: boolean }) {
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
          <Icon name="check" size={14} className="text-teal" />
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

function SummaryRow({ matrix, pairs }: { matrix: Matrix; pairs: string[] }) {
  const tfBias = TFS.map((tf) => {
    const counts = { bullish: 0, bearish: 0, ranging: 0 };
    pairs.forEach((p) => { if (matrix[p]?.[tf]) counts[matrix[p][tf] as Bias]++; });
    const dom: Bias = counts.bullish > counts.bearish ? "bullish" : counts.bearish > counts.bullish ? "bearish" : "ranging";
    return { tf, dom, counts };
  });

  return (
    <tr className="border-t-2 border-line">
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
              <span className={cn("material-symbols-rounded ic-fill text-[16px]", cfg.textCls)}>
                {cfg.icon}
              </span>
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

export function TrendMatrix({ isInstructor }: { isInstructor: boolean }) {
  const instrumentSymbols = useInstrumentSymbols();
  const PAIRS = instrumentSymbols.length ? instrumentSymbols : PAIRS_FALLBACK;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matrix, PAIRS.join(",")]
  );

  const tradeablePairs = useMemo(
    () => PAIRS.filter((p) => confluenceMap[p]?.bias !== "mixed"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confluenceMap, PAIRS.join(",")]
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
          <h1 className="font-display font-bold text-2xl tracking-[-0.02em] text-ink-strong">
            Trend Matrix
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            {isInstructor
              ? "Set weekly HTF bias for each pair and timeframe, then publish for all students."
              : "Kondwani's weekly HTF bias read. Updated every Sunday."}
            {updatedLabel && <span className="ml-2">· Last updated {updatedLabel}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-3 text-[12px] text-ink-dim">
            {(["bullish", "bearish", "ranging"] as Bias[]).map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <span className={cn("material-symbols-rounded ic-fill text-[14px]", BIAS_CONFIG[b].textCls)}>
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
        <div className="mb-4 px-4 py-2.5 rounded-xl text-[12.5px] bg-[rgba(234,82,61,0.1)] text-coral">
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
                <span className="material-symbols-rounded ic-fill text-[13px]">{cfg.icon}</span>
                {p}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Matrix table ── */}
      <p className="md:hidden text-xs mb-2 text-ink-dim">← Scroll to see all timeframes</p>
      <Panel pad={0}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
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
              {loading
                ? PAIRS.map((pair) => (
                    <tr key={pair} className="border-t border-line">
                      <td className="px-5 py-4">
                        <div className="h-4 w-16 rounded animate-pulse bg-track" />
                      </td>
                      {TFS.map((tf) => (
                        <td key={tf} className="px-2 py-4">
                          <div className="h-11 w-14 rounded-xl animate-pulse mx-auto bg-track" />
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="h-3 w-32 rounded animate-pulse bg-track" />
                      </td>
                    </tr>
                  ))
                : PAIRS.map((pair, i) => {
                    const conf = confluenceMap[pair];
                    return (
                      <tr
                        key={pair}
                        className={cn("group transition-colors hover:bg-hover", i > 0 && "border-t border-line")}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-display font-bold text-[14px] text-ink-strong">{pair}</div>
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
              {!loading && <SummaryRow matrix={matrix} pairs={PAIRS} />}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── How to use ── */}
      <div className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3 bg-[rgba(8,174,170,0.06)] border border-[rgba(8,174,170,0.15)]">
        <Icon name="info" size={17} fill className="text-teal shrink-0 mt-px" />
        <p className="text-[12.5px] leading-relaxed text-ink-mid">
          {isInstructor
            ? "Update this matrix every Sunday after your weekly chart review, then hit Publish. Students will immediately see your updated bias across all pairs and timeframes."
            : "This matrix is updated every Sunday by Kondwani after his weekly chart review. Use the bias alignment to confirm your trade direction before entering. Only trade models where the HTF bias matches, and validate in the Rules Validator first."}
        </p>
      </div>
    </div>
  );
}
