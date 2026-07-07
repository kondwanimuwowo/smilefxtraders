"use client";

import { useState, useMemo, useEffect } from "react";
import { Panel, PanelHead, Button, DirPill, Icon, Field, Select, SegRow, MonoInput, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { LogTradeModal } from "@/app/(app)/journal/LogTradeModal";
import type { Trade } from "@/lib/store";
import {
  MODELS, MODEL_INFO, validate, FIB_LEVELS,
  BLANK_SETUP, type Framework, type Setup, type Status, type RuleResult, type ValidationResult,
} from "@/lib/frameworks";
import { useInstruments } from "@/lib/hooks/useInstruments";

// ── Grade display helpers ─────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  "A+": "var(--teal)",   A: "var(--teal)",
  B:    "var(--gold)",   C: "var(--coral)",
  D:    "var(--coral-bright)",
};
const GRADE_BG: Record<string, string> = {
  "A+": "rgba(8,174,170,0.12)",  A:  "rgba(8,174,170,0.10)",
  B:    "rgba(248,185,61,0.12)", C:  "rgba(234,82,61,0.10)",
  D:    "rgba(234,82,61,0.16)",
};
const STATUS_ICON: Record<Status, string>    = { pass: "check_circle", fail: "cancel", warn: "warning", na: "remove_circle" };
const STATUS_TEXT_CLS: Record<Status, string> = { pass: "text-teal", fail: "text-coral", warn: "text-gold", na: "text-ink-dim" };

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left w-full transition-all",
        checked ? "border-teal bg-[rgba(8,174,170,0.08)]" : "border-line bg-panel-2"
      )}
    >
      <span className={cn("material-symbols-rounded ic-fill shrink-0 text-[18px]", checked ? "text-teal" : "text-ink-dim")}>
        {checked ? "check_box" : "check_box_outline_blank"}
      </span>
      <span className={cn("text-[12.5px] font-medium", checked ? "text-ink-strong" : "text-ink-mid")}>
        {label}
      </span>
    </button>
  );
}

function RuleRow({ rule }: { rule: RuleResult }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors",
        rule.status === "fail" ? "bg-[rgba(234,82,61,0.05)] border-[rgba(234,82,61,0.2)]"
          : rule.status === "warn" ? "bg-[rgba(248,185,61,0.05)] border-[rgba(248,185,61,0.2)]"
          : "bg-transparent border-line"
      )}
    >
      <span className={cn("material-symbols-rounded ic-fill shrink-0 mt-0.5 text-[17px]", STATUS_TEXT_CLS[rule.status])}>
        {STATUS_ICON[rule.status]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-ink-strong">{rule.label}</div>
        <div className="text-[12px] mt-0.5 leading-relaxed text-ink-dim">{rule.why}</div>
      </div>
    </div>
  );
}

function GradeRing({ grade, score }: { grade: string; score: number }) {
  const color = GRADE_COLOR[grade] ?? "var(--teal)";
  const r     = 38;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
      <svg width={96} height={96} className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-track" />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span
          className="font-display font-bold"
          style={{ fontSize: 26, letterSpacing: "-0.02em", color, lineHeight: 1 }}
        >
          {grade}
        </span>
        <span className="tabular-nums font-semibold text-[11px] text-ink-dim">
          {score}%
        </span>
      </div>
    </div>
  );
}

function ModelInfoCard({ framework, model }: { framework: Framework; model: string }) {
  const info = MODEL_INFO[framework]?.[model];
  if (!info) return null;
  return (
    <div className="rounded-xl px-4 py-3.5 flex items-start gap-3 bg-[rgba(8,174,170,0.06)] border border-[rgba(8,174,170,0.18)]">
      <Icon name="lightbulb" size={17} fill className="text-teal shrink-0 mt-0.5" />
      <div>
        <div className="text-[12px] font-semibold mb-1 text-teal">{model}</div>
        <p className="text-[12px] leading-relaxed text-ink-mid">{info.tip}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {info.need.map((n) => (
            <span key={n} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-[rgba(8,174,170,0.12)] text-teal">
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Killzone helpers ──────────────────────────────────────────────────────────

const KILLZONE_WINDOWS: Record<string, [number, number]> = {
  London:     [8 * 60,  10 * 60],
  "New York": [13 * 60, 15 * 60],
  Asia:       [0,        2 * 60],
};

function isInKillzone(session: string): boolean {
  const now  = new Date();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [start, end] = KILLZONE_WINDOWS[session] ?? [0, 0];
  return mins >= start && mins < end;
}

function timeUntilOpen(session: string): string {
  const now  = new Date();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [start] = KILLZONE_WINDOWS[session] ?? [0, 0];
  let diff = start - mins;
  if (diff <= 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── Position size helpers ─────────────────────────────────────────────────────


function calcPipDist(pair: string, entry: number, sl: number): number {
  if (pair === "XAUUSD" || pair === "NAS100") return Math.abs(entry - sl);
  return Math.abs(entry - sl) * 10_000;
}

// ── History ───────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id:        string;
  pair:      string;
  dir:       "long" | "short";
  model:     string;
  framework: Framework;
  grade:     string;
  score:     number;
  time:      string;
}

const HISTORY_KEY = "smfx_validator_history";

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const color = GRADE_COLOR[entry.grade] ?? "var(--teal)";
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-[13px]"
        style={{ background: GRADE_BG[entry.grade], color }}
      >
        {entry.grade}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-[13px] text-ink-strong">{entry.pair}</span>
          <DirPill dir={entry.dir} size="sm" />
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-panel-2 text-ink-dim border border-line">
            {entry.framework}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-track">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${entry.score}%`, background: color }}
            />
          </div>
          <span className="text-[10px] tabular-nums shrink-0 text-ink-dim">
            {entry.score}%
          </span>
        </div>
      </div>
      <span className="text-[10.5px] shrink-0 text-ink-dim">{entry.time}</span>
    </div>
  );
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function Validator() {
  const { data: instruments = [] } = useInstruments();
  const pairs = instruments.map((i) => i.symbol);
  const pipValueMap = Object.fromEntries(instruments.map((i) => [i.symbol, i.pipValue]));

  const [setup,       setSetup]       = useState<Setup>(BLANK_SETUP("SMC"));
  const [history,     setHistory]     = useState<HistoryEntry[]>([]);
  const [logOpen,     setLogOpen]     = useState(false);
  const [killzoneNow, setKillzoneNow] = useState(() => isInKillzone("London"));
  const [calcOpen,    setCalcOpen]    = useState(false);
  const [calcBalance, setCalcBalance] = useState("10000");
  const [calcRisk,    setCalcRisk]    = useState("1");
  const [calcEntry,   setCalcEntry]   = useState("");
  const [calcSl,      setCalcSl]      = useState("");

  // Restore history + balance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) { try { setHistory(JSON.parse(saved)); } catch { /* ignore */ } }
    const bal = localStorage.getItem("smfx_balance");
    if (bal) setCalcBalance(bal);
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
  }, [history]);

  // Killzone auto-detection — updates every 60s
  useEffect(() => {
    function check() {
      const active = isInKillzone(setup.session);
      setKillzoneNow(active);
      setSetup((s) => ({ ...s, killzone: active }));
    }
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [setup.session]);

  const set = <K extends keyof Setup>(k: K, v: Setup[K]) =>
    setSetup((p) => ({ ...p, [k]: v }));

  function handleFrameworkChange(fw: Framework) { setSetup(BLANK_SETUP(fw)); }

  const result: ValidationResult = useMemo(() => validate(setup), [setup]);

  const calcResult = useMemo(() => {
    const balance  = parseFloat(calcBalance);
    const risk     = parseFloat(calcRisk);
    const entry    = parseFloat(calcEntry);
    const sl       = parseFloat(calcSl);
    const rrRatio  = parseFloat(setup.rr) || 0;
    if (!balance || !risk || !entry || !sl || entry === sl) return null;
    const pipDist    = calcPipDist(setup.pair, entry, sl);
    if (pipDist === 0) return null;
    const dollarRisk   = (balance * risk) / 100;
    const lots         = dollarRisk / (pipDist * (pipValueMap[setup.pair] ?? 10));
    const isForex      = !["XAUUSD", "NAS100"].includes(setup.pair);
    const dollarProfit = rrRatio > 0 ? dollarRisk * rrRatio : null;
    let tp: number | null = null;
    if (rrRatio > 0) {
      const tpMove = isForex ? (pipDist * rrRatio) / 10_000 : pipDist * rrRatio;
      tp = setup.dir === "long" ? entry + tpMove : entry - tpMove;
    }
    return { pipDist, dollarRisk, dollarProfit, lots, tp, isForex };
  }, [calcBalance, calcRisk, calcEntry, calcSl, setup.pair, setup.dir, setup.rr]);

  function saveToHistory() {
    const now  = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setHistory((h) => [
      { id: "h" + Date.now(), pair: setup.pair, dir: setup.dir as "long" | "short", model: setup.model, framework: setup.framework, grade: result.grade, score: result.score, time },
      ...h.slice(0, 9),
    ]);
  }

  // Pre-fill LogTradeModal with setup details and calculator values
  const tradePreset = {
    pair:       setup.pair,
    dir:        setup.dir as "long" | "short",
    model:      setup.model,
    framework:  setup.framework,
    session:    setup.session,
    rr:         parseFloat(setup.rr) || undefined,
    result:     "open" as const,
    discipline: true,
    entryPrice: calcEntry ? parseFloat(calcEntry) || undefined : undefined,
    stopLoss:   calcSl    ? parseFloat(calcSl)    || undefined : undefined,
    takeProfit: calcResult?.tp ?? undefined,
  };

  const isSMC      = setup.framework === "SMC";
  const modelLabel = isSMC ? "SMC Model" : "S&D Setup";
  const emptyBody  = isSMC
    ? "Your setup meets every SMC rule. Execute with confidence."
    : "Your setup meets every Supply & Demand rule. Execute with confidence.";

  const passCount = result.rules.filter((r) => r.status === "pass").length;

  return (
    <div className="view">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-[-0.02em] text-ink-strong">
            Rules Validator
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Check every condition before you press the button. No exceptions.
          </p>
        </div>
        <Button type="button" variant="ghost" icon="refresh" onClick={() => setSetup(BLANK_SETUP(setup.framework))}>
          Reset
        </Button>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-[380px_minmax(0,1fr)] gap-5">

        {/* ── Left: setup inputs ── */}
        <div className="flex flex-col gap-4">
          <Panel pad={20}>
            <PanelHead title="Setup inputs" icon="tune" />

            <div className="flex flex-col gap-4">
              {/* Framework */}
              <Field label="Framework">
                <SegRow
                  value={setup.framework}
                  onChange={(v) => handleFrameworkChange(v as Framework)}
                  options={[{ v: "SMC", l: "SMC" }, { v: "SnD", l: "S&D" }]}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Instrument" half>
                  <Select value={setup.pair} onChange={(v) => set("pair", v)} options={pairs.length ? pairs : ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"]} />
                </Field>
                <Field label="Direction" half>
                  <SegRow value={setup.dir} onChange={(v) => set("dir", v)} options={[{ v: "long", l: "Long" }, { v: "short", l: "Short" }]} />
                </Field>
              </div>

              <Field label={modelLabel}>
                <Select value={setup.model} onChange={(v) => set("model", v)} options={MODELS[setup.framework]} />
              </Field>

              <ModelInfoCard framework={setup.framework} model={setup.model} />

              <Field label="Session">
                <SegRow
                  value={setup.session}
                  onChange={(v) => set("session", v)}
                  options={["London", "New York", "Asia"].map((s) => ({ v: s, l: s === "New York" ? "NY" : s }))}
                />
              </Field>

              <Field label="HTF Bias">
                <SegRow
                  value={setup.htfBias}
                  onChange={(v) => set("htfBias", v)}
                  options={[{ v: "bullish", l: "Bullish" }, { v: "bearish", l: "Bearish" }, { v: "ranging", l: "Ranging" }]}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Entry TF" half>
                  <SegRow value={setup.entryTf} onChange={(v) => set("entryTf", v)} options={["M15", "H1", "H4"].map((t) => ({ v: t, l: t }))} />
                </Field>
                {isSMC && (
                  <Field label="POI type" half>
                    <SegRow
                      value={setup.poi}
                      onChange={(v) => set("poi", v)}
                      options={[{ v: "FVG", l: "FVG" }, { v: "OB", l: "OB" }, { v: "OB+FVG", l: "Both" }]}
                    />
                  </Field>
                )}
              </div>

              <Field label="Planned R:R">
                <MonoInput value={setup.rr} onChange={(e) => set("rr", e.target.value)} placeholder="e.g. 3.5" />
              </Field>

              {/* Condition checkboxes */}
              <Field label="Setup conditions">
                <div className="flex flex-col gap-2">
                  {isSMC ? (
                    <>
                      <CheckToggle label="Liquidity swept (EQH/EQL/PDH/PDL)" checked={setup.liqSwept} onChange={(v) => set("liqSwept", v)} />
                      <CheckToggle label="Break of Structure (BOS) confirmed"  checked={setup.bos}     onChange={(v) => set("bos", v)} />
                      <CheckToggle label="Change of Character (CHoCH) confirmed" checked={setup.choch} onChange={(v) => set("choch", v)} />
                      <div className="flex flex-col gap-1">
                        <CheckToggle label="Entry inside session killzone" checked={setup.killzone} onChange={(v) => set("killzone", v)} />
                        <KillzoneBadge active={killzoneNow} session={setup.session} />
                      </div>
                      {setup.model === "SMT + OB" && (
                        <CheckToggle label="SMT divergence between correlated pairs" checked={setup.smtDiv} onChange={(v) => set("smtDiv", v)} />
                      )}
                    </>
                  ) : (
                    <>
                      <CheckToggle label="Zone is fresh (untested)"            checked={setup.zoneIsFresh}      onChange={(v) => set("zoneIsFresh", v)} />
                      <CheckToggle label="Origin move was strong and impulsive" checked={setup.strongOrigin}    onChange={(v) => set("strongOrigin", v)} />
                      <CheckToggle label="Price approaching from correct side"  checked={setup.correctSide}     onChange={(v) => set("correctSide", v)} />
                      <CheckToggle
                        label={setup.dir === "short" ? "Zone sits in premium area" : "Zone sits in discount area"}
                        checked={setup.inPremiumDiscount}
                        onChange={(v) => set("inPremiumDiscount", v)}
                      />
                      <div className="flex flex-col gap-1">
                        <CheckToggle label="Entry inside session killzone" checked={setup.killzone} onChange={(v) => set("killzone", v)} />
                        <KillzoneBadge active={killzoneNow} session={setup.session} />
                      </div>
                    </>
                  )}
                </div>
              </Field>

              {/* Fibonacci confluence */}
              <div className="border-t border-line pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-rounded text-[15px] text-gold">architecture</span>
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-dim">
                    Fibonacci confluence
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[rgba(248,185,61,0.1)] text-gold border border-[rgba(248,185,61,0.2)]">
                    optional
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <CheckToggle label="Fibonacci level at POI" checked={setup.fibConfluence} onChange={(v) => set("fibConfluence", v)} />
                  {setup.fibConfluence && (
                    <div className="pl-1">
                      <div className="text-[11px] mb-1.5 text-ink-dim">Which level?</div>
                      <SegRow value={setup.fibLevel} onChange={(v) => set("fibLevel", v)} options={FIB_LEVELS.map((l) => ({ v: l, l: l }))} />
                      <p className="text-[11px] mt-2 leading-relaxed text-ink-dim">
                        {setup.fibLevel === "OTE (62–79%)"
                          ? "Optimal Trade Entry: the highest-probability Fibonacci zone. Price retracing into an OB or FVG that also sits in the 62–79% retracement is the strongest possible confluence."
                          : setup.fibLevel === "61.8%"
                          ? "The 'golden ratio' retracement. A POI sitting exactly at 61.8% is a classical reversal magnet for both retail and institutional participants."
                          : setup.fibLevel === "78.6%"
                          ? "Deep retracement level, often the final pullback before continuation. Pairs well with order blocks that form at the extreme of a move."
                          : "The midpoint. Weaker than 61.8 or OTE but valid as a secondary confluence when the POI aligns with it."}
                      </p>
                    </div>
                  )}
                </div>

                {setup.fibConfluence && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 bg-[rgba(248,185,61,0.06)] border border-[rgba(248,185,61,0.18)]">
                    <Icon name="bolt" size={13} fill className="text-gold shrink-0 mt-px" />
                    <p className="text-[11.5px] leading-relaxed text-ink-dim">
                      Fibonacci confluence is active. If all main rules pass, this{" "}
                      <span className="text-gold font-semibold">boosts an A grade to A+</span>.
                      It does not fix a failing rule.
                    </p>
                  </div>
                )}
              </div>

              {/* Position size calculator */}
              <div className="border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setCalcOpen((o) => !o)}
                  className="flex items-center gap-2 w-full mb-2"
                >
                  <span className="material-symbols-rounded text-[15px] text-teal">calculate</span>
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider flex-1 text-left text-ink-dim">
                    Position size calculator
                  </span>
                  <span className="material-symbols-rounded text-[15px] text-ink-dim">
                    {calcOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {calcOpen && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Account balance" half>
                        <MonoInput
                          value={calcBalance}
                          onChange={(e) => { setCalcBalance(e.target.value); localStorage.setItem("smfx_balance", e.target.value); }}
                          placeholder="10000"
                        />
                      </Field>
                      <Field label="Risk %" half>
                        <MonoInput value={calcRisk} onChange={(e) => setCalcRisk(e.target.value)} placeholder="1" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Entry price" half>
                        <MonoInput
                          value={calcEntry}
                          onChange={(e) => setCalcEntry(e.target.value)}
                          placeholder={setup.pair === "EURUSD" ? "1.08500" : setup.pair === "XAUUSD" ? "2330.00" : "..."}
                        />
                      </Field>
                      <Field label="Stop loss" half>
                        <MonoInput
                          value={calcSl}
                          onChange={(e) => setCalcSl(e.target.value)}
                          placeholder={setup.pair === "EURUSD" ? "1.08300" : setup.pair === "XAUUSD" ? "2325.00" : "..."}
                        />
                      </Field>
                    </div>

                    {calcResult && (
                      <div className="rounded-xl p-4 bg-panel-2 border border-line">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">
                              {calcResult.isForex ? "Pip distance" : setup.pair === "XAUUSD" ? "$ distance" : "Points"}
                            </div>
                            <div className="text-[14px] font-semibold text-ink-strong">
                              {calcResult.isForex ? calcResult.pipDist.toFixed(1) : calcResult.pipDist.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">Dollar risk</div>
                            <div className="text-[14px] font-semibold text-coral">
                              −${calcResult.dollarRisk.toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">Lot size</div>
                            <div className="font-bold text-[26px] tracking-[-0.02em] text-gold">
                              {calcResult.lots < 0.01 ? calcResult.lots.toFixed(4) : calcResult.lots.toFixed(2)}
                            </div>
                          </div>
                          {calcResult.tp !== null && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">
                                TP ({setup.rr}R)
                              </div>
                              <div className={cn("text-[14px] font-semibold", setup.dir === "long" ? "text-teal" : "text-coral")}>
                                {calcResult.tp.toFixed(calcResult.isForex ? 5 : setup.pair === "XAUUSD" ? 2 : 1)}
                              </div>
                            </div>
                          )}
                          {calcResult.dollarProfit !== null && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">Expected profit</div>
                              <div className="text-[14px] font-semibold text-teal">
                                +${calcResult.dollarProfit.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!calcResult && calcEntry && calcSl && (
                      <p className="text-[11.5px] text-coral">Enter valid entry and SL prices.</p>
                    )}

                    {calcResult && (
                      <p className="text-[11px] text-ink-dim">
                        These prices will pre-fill the trade log when you click "Log this trade".
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Right: results ── */}
        <div className="flex flex-col gap-4">

          {/* Verdict card */}
          <div
            className="rounded-2xl p-5"
            style={{ background: GRADE_BG[result.grade], border: `1px solid ${GRADE_COLOR[result.grade]}33` }}
          >
            <div className="flex items-center gap-5 mb-3">
              <GradeRing grade={result.grade} score={result.score} />
              <div className="flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: GRADE_COLOR[result.grade] }}>
                  Overall grade
                </div>
                <p className="text-[14px] font-semibold leading-snug mb-2 text-ink-strong">
                  {result.verdict}
                </p>
                <div className="text-[11.5px] text-ink-dim">
                  {passCount}/{result.rules.length} rules passed
                </div>
                {setup.fibConfluence && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="material-symbols-rounded ic-fill text-[13px] text-gold">architecture</span>
                    <span className="text-[11px] font-semibold text-gold">
                      Fib {setup.fibLevel} active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action — logging auto-saves to history */}
            <div className="flex gap-2.5 mt-1">
              {result.canLog ? (
                <Button type="button" variant="primary" icon="add_task" onClick={() => { saveToHistory(); setLogOpen(true); }}>
                  Log this trade
                </Button>
              ) : (
                <Button type="button" variant="ghost" icon="block" disabled>
                  Resolve fails to log
                </Button>
              )}
            </div>
          </div>

          {/* Rules checklist */}
          <Panel pad={0}>
            <div className="px-5 pt-4 pb-2">
              <div className="font-display font-semibold text-[15px] text-ink-strong">
                Rulebook checklist
              </div>
              <p className="text-[12px] mt-0.5 text-ink-dim">
                Updates live as you fill in setup conditions.
              </p>
            </div>
            {result.rules.every((r) => r.status === "pass") ? (
              <EmptyState icon="verified" title="All rules satisfied" body={emptyBody} />
            ) : (
              <div className="px-4 pb-4 flex flex-col gap-2">
                {result.rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} />
                ))}
              </div>
            )}
          </Panel>

          {/* Status legend */}
          <div className="flex items-center gap-4 px-1">
            {(["pass", "warn", "fail"] as Status[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn("material-symbols-rounded ic-fill text-[14px]", STATUS_TEXT_CLS[s])}>
                  {STATUS_ICON[s]}
                </span>
                <span className="text-[11.5px] capitalize text-ink-dim">{s}</span>
              </div>
            ))}
          </div>

          {/* Validation history */}
          {history.length > 0 && (
            <Panel pad={0}>
              <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                <div className="font-display font-semibold text-[15px] text-ink-strong">
                  Recent validations
                </div>
                <button
                  type="button"
                  className="text-[11.5px] font-medium hover:underline text-ink-dim"
                  onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
                >
                  Clear
                </button>
              </div>
              <div className="px-5 pb-3 divide-y divide-line">
                {history.map((h) => <HistoryRow key={h.id} entry={h} />)}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Pre-filled log modal */}
      <LogTradeModal open={logOpen} onClose={() => setLogOpen(false)} preset={tradePreset} />
    </div>
  );
}

// ── Killzone badge — extracted to avoid duplication ───────────────────────────

function KillzoneBadge({ active, session }: { active: boolean; session: string }) {
  if (active) {
    return (
      <div className="flex items-center gap-1.5 pl-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal animate-[live-pulse_2s_infinite]" />
        <span className="text-[11px] font-semibold text-teal">Active now</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 pl-1">
      <span className="material-symbols-rounded text-[12px] text-ink-dim">schedule</span>
      <span className="text-[11px] text-ink-dim">Opens in {timeUntilOpen(session)}</span>
    </div>
  );
}
