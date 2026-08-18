"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ruleById, WEIGHT_LABEL, WEIGHT_BLURB, type Readiness, type RuleWeight } from "@/lib/rulebook";
import { Panel, PanelHead, Button, DirPill, Icon, Field, Select, SegRow, MonoInput, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  MODELS, MODEL_INFO, validate, FIB_LEVELS,
  BLANK_SETUP, type Framework, type Setup, type Status, type RuleResult, type ValidationResult,
} from "@/lib/frameworks";
import { useInstruments } from "@/lib/hooks/useInstruments";

// ── Readiness display helpers ─────────────────────────────────────────────────
//
// The Validator used to hand out A+ to D, the same letters Gavo gives a closed
// trade. Two assessments sharing one vocabulary read as a contradiction when
// they disagreed, and they will disagree by design: this sees what a trader
// declares before entry, Gavo sees the outcome and real broker prices. So this
// answers "should I take this?" and leaves the grading to Gavo.

const READINESS_CFG: Record<Readiness, {
  label:   string;
  icon:    string;
  /** Raw var value — needed for the SVG stroke and alpha-suffixed shadows. */
  color:   string;
  textCls: string;
  bgCls:   string;
}> = {
  cleared: {
    label: "Cleared to trade", icon: "verified", color: "var(--teal)",
    textCls: "text-teal-deep", bgCls: "bg-[rgba(8,174,170,0.10)]",
  },
  caution: {
    label: "Proceed with caution", icon: "warning", color: "var(--gold)",
    textCls: "text-gold-deep", bgCls: "bg-[rgba(248,185,61,0.12)]",
  },
  "do-not-take": {
    label: "Do not take this", icon: "cancel", color: "var(--coral)",
    textCls: "text-coral-deep", bgCls: "bg-[rgba(234,82,61,0.12)]",
  },
};

const STATUS_ICON: Record<Status, string>    = { pass: "check_circle", fail: "cancel", warn: "warning", na: "remove_circle" };
const STATUS_TEXT_CLS: Record<Status, string> = { pass: "text-teal-deep", fail: "text-coral-deep", warn: "text-gold-deep", na: "text-ink-dim" };

const WEIGHT_CHIP: Record<RuleWeight, string> = {
  invalidating: "bg-[rgba(234,82,61,0.12)] text-coral-deep",
  core:         "bg-[rgba(248,185,61,0.12)] text-gold-deep",
  supporting:   "bg-panel-2 text-ink-dim",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-left w-full transition-all",
        checked ? "ring-2 ring-teal-deep bg-teal-tint" : "shadow-sm bg-panel-2"
      )}
    >
      <Icon
        name={checked ? "check_box" : "check_box_outline_blank"}
        size={18}
        className={cn("shrink-0", checked ? "text-teal-deep" : "text-ink-dim")}
      />
      <span className={cn("text-[12.5px] font-medium", checked ? "text-ink-strong" : "text-ink-mid")}>
        {label}
      </span>
    </button>
  );
}

function RuleRow({ rule, framework }: { rule: RuleResult; framework: Framework }) {
  // The Validator's rule ids match the rulebook's where they check the same
  // thing, so a failed check can send the trader to the rule it broke. Without
  // this the Validator says "you are fighting the trend" and offers nowhere to
  // learn why that matters.
  const linked = ruleById(framework, rule.id);
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl transition-colors",
        rule.status === "fail" ? "bg-coral-tint ring-1 ring-coral-deep/40"
          : rule.status === "warn" ? "bg-gold-tint ring-1 ring-gold-deep/40"
          : "bg-panel-2 shadow-sm"
      )}
    >
      <Icon
        name={STATUS_ICON[rule.status]}
        size={17}
        className={cn("shrink-0 mt-0.5", STATUS_TEXT_CLS[rule.status])}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-ink-strong">{rule.label}</span>
          {linked && (
            <span
              className={cn("text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", WEIGHT_CHIP[linked.weight])}
              title={WEIGHT_BLURB[linked.weight]}
            >
              {WEIGHT_LABEL[linked.weight]}
            </span>
          )}
        </div>
        <div className="text-[12px] mt-0.5 leading-relaxed text-ink-dim">{rule.why}</div>
        {linked && (
          <Link
            href={`/rules?fw=${framework}#${linked.id}`}
            className="inline-flex items-center gap-1 mt-1.5 text-[11.5px] font-semibold text-teal-deep hover:opacity-75"
          >
            Rule {linked.n}: {linked.title}
            <Icon name="chevron_right" size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Rules cleared out of rules that applied. A count, not a score. */
function ReadinessDial({ readiness, clear, total }: { readiness: Readiness; clear: number; total: number }) {
  const { color, icon } = READINESS_CFG[readiness];
  const r    = 38;
  const circ = 2 * Math.PI * r;
  const dash = total > 0 ? (clear / total) * circ : 0;
  return (
    <div className="relative shrink-0 w-24 h-24">
      <svg width={96} height={96} className="-rotate-90" aria-hidden>
        <circle cx={48} cy={48} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-track" />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <Icon name={icon} size={20} fill className={READINESS_CFG[readiness].textCls} />
        <span className="tabular-nums font-display font-bold text-[17px] leading-none text-ink-strong">
          {clear}<span className="text-ink-dim">/{total}</span>
        </span>
      </div>
    </div>
  );
}

function ModelInfoCard({ framework, model }: { framework: Framework; model: string }) {
  const info = MODEL_INFO[framework]?.[model];
  if (!info) return null;
  return (
    <div className="rounded-xl px-4 py-3.5 flex items-start gap-3 bg-teal-tint ring-1 ring-teal-deep/40">
      <Icon name="lightbulb" size={17} fill className="text-teal-deep shrink-0 mt-0.5" />
      <div>
        <div className="text-[12px] font-semibold mb-1 text-teal-deep">{model}</div>
        <p className="text-[12px] leading-relaxed text-ink-mid">{info.tip}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {info.need.map((n) => (
            <span key={n} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-[rgba(8,174,170,0.12)] text-teal-deep">
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
  readiness: Readiness;
  clear:     number;
  total:     number;
  time:      string;
}

const HISTORY_KEY = "smfx_validator_history";

function HistoryRow({ entry, divider }: { entry: HistoryEntry; divider?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 py-2.5 px-2.5 -mx-2.5 rounded-lg", divider && "border-b border-line")}>
      <div
        className={cn(
          "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
          READINESS_CFG[entry.readiness].bgCls,
        )}
        title={READINESS_CFG[entry.readiness].label}
      >
        <Icon name={READINESS_CFG[entry.readiness].icon} size={17} fill className={READINESS_CFG[entry.readiness].textCls} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-[13px] text-ink-strong">{entry.pair}</span>
          <DirPill dir={entry.dir} size="sm" />
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-panel text-ink-dim shadow-sm">
            {entry.framework}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden bg-track">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${entry.total > 0 ? (entry.clear / entry.total) * 100 : 0}%`,
                background: READINESS_CFG[entry.readiness].color,
              }}
            />
          </div>
          <span className="text-[10px] tabular-nums shrink-0 text-ink-dim">
            {entry.clear}/{entry.total}
          </span>
        </div>
      </div>
      <span className="text-[10.5px] shrink-0 text-ink-dim">{entry.time}</span>
    </div>
  );
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function Validator() {
  const router = useRouter();
  const { data: instruments = [] } = useInstruments();
  const pairs = instruments.map((i) => i.symbol);
  const pipValueMap = Object.fromEntries(instruments.map((i) => [i.symbol, i.pipValue]));

  const [setup,       setSetup]       = useState<Setup>(BLANK_SETUP("SMC"));
  const [history,     setHistory]     = useState<HistoryEntry[]>([]);
  const [killzoneNow, setKillzoneNow] = useState(() => isInKillzone("London"));

  // Balance/risk/entry/SL now live in `setup`, not here. They used to be local
  // state feeding only the pip calculator, which is why rules 8 and 10 could
  // never be checked: validate() had no access to the numbers sitting three
  // lines above it.
  const { balance: calcBalance, riskPct: calcRisk, entryPrice: calcEntry, slPrice: calcSl } = setup;

  // Restore history + balance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) { try { setHistory(JSON.parse(saved)); } catch { /* ignore */ } }
    const bal = localStorage.getItem("smfx_balance");
    if (bal) setSetup((s) => ({ ...s, balance: bal }));
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

  // Framework switch resets the setup but keeps balance and risk %: those are
  // properties of the trader's account, not of the setup being validated.
  function handleFrameworkChange(fw: Framework) {
    setSetup((prev) => ({ ...BLANK_SETUP(fw), balance: prev.balance, riskPct: prev.riskPct }));
  }

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
      { id: "h" + Date.now(), pair: setup.pair, dir: setup.dir as "long" | "short", model: setup.model, framework: setup.framework, readiness: result.readiness, clear: result.clear, total: result.total, time },
      ...h.slice(0, 9),
    ]);
  }

  // Pre-fill the new-trade page (via sessionStorage handoff) with setup details and calculator values
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
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Rules Validator
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Check every condition before you press the button. No exceptions.
          </p>
        </div>
        <Button type="button" variant="ghost" icon="refresh" onClick={() => setSetup((prev) => ({ ...BLANK_SETUP(prev.framework), balance: prev.balance, riskPct: prev.riskPct }))}>
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

              <Field label={setup.dir === "long" ? "Where does entry sit in the HTF range?" : "Where does entry sit in the HTF range?"}>
                <SegRow
                  value={setup.pdZone}
                  onChange={(v) => set("pdZone", v as Setup["pdZone"])}
                  options={[
                    { v: "discount",    l: "Discount" },
                    { v: "equilibrium", l: "Equilibrium" },
                    { v: "premium",     l: "Premium" },
                  ]}
                />
                <p className="text-[11px] mt-1.5 text-ink-dim">
                  {setup.dir === "long"
                    ? "A long belongs in discount, below the 50% level of the HTF range."
                    : "A short belongs in premium, above the 50% level of the HTF range."}
                </p>
              </Field>

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
                      <div className="flex flex-col gap-1">
                        <CheckToggle label="Entry inside session killzone" checked={setup.killzone} onChange={(v) => set("killzone", v)} />
                        <KillzoneBadge active={killzoneNow} session={setup.session} />
                      </div>
                    </>
                  )}
                </div>
              </Field>

              {/* Execution + discipline declarations (rules 2, 7, 8, 12, 13) */}
              <Field label="Execution &amp; discipline">
                <div className="flex flex-col gap-2">
                  <CheckToggle
                    label={isSMC ? "Aligned with the HTF draw on liquidity" : "Aligned with the HTF magnet"}
                    checked={setup.htfDrawAligned}
                    onChange={(v) => set("htfDrawAligned", v)}
                  />
                  <CheckToggle
                    label={isSMC ? "Price retraced into the POI (not a chase)" : "Price retraced to the zone edge (not a chase)"}
                    checked={setup.cleanRetrace}
                    onChange={(v) => set("cleanRetrace", v)}
                  />
                  <CheckToggle
                    label={isSMC ? "Stop beyond swept liquidity / OB extreme" : "Stop beyond the distal edge of the zone"}
                    checked={setup.stopBeyondInvalidation}
                    onChange={(v) => set("stopBeyondInvalidation", v)}
                  />
                  <CheckToggle
                    label="Pre-planned, marked before price arrived"
                    checked={setup.prePlanned}
                    onChange={(v) => set("prePlanned", v)}
                  />
                  <CheckToggle
                    label="News calendar checked, no red folder within 15m"
                    checked={setup.newsChecked}
                    onChange={(v) => set("newsChecked", v)}
                  />
                </div>
              </Field>

              {/* Fibonacci confluence */}
              <div className="border-t border-line pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="architecture" size={15} className="text-gold-deep" />
                  <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-dim">
                    Fibonacci confluence
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gold-tint text-gold-deep ring-1 ring-gold-deep/40">
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
                  <div className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 bg-gold-tint ring-1 ring-gold-deep/40">
                    <Icon name="bolt" size={13} fill className="text-gold-deep shrink-0 mt-px" />
                    <p className="text-[11.5px] leading-relaxed text-ink-dim">
                      Fibonacci confluence is active. If all main rules pass, this{" "}
                      <span className="text-gold-deep font-semibold">boosts an A grade to A+</span>.
                      It does not fix a failing rule.
                    </p>
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
            className={cn("rounded-2xl p-5", READINESS_CFG[result.readiness].bgCls)}
            style={{ boxShadow: `0 0 0 2px ${READINESS_CFG[result.readiness].color}55` }}
          >
            <div className="flex items-center gap-5 mb-3">
              <ReadinessDial readiness={result.readiness} clear={result.clear} total={result.total} />
              <div className="flex-1">
                <div className={cn("text-[11px] font-semibold uppercase tracking-widest mb-1", READINESS_CFG[result.readiness].textCls)}>
                  {READINESS_CFG[result.readiness].label}
                </div>
                <p className="text-[14px] font-semibold leading-snug mb-2 text-ink-strong">
                  {result.verdict}
                </p>
                <div className="text-[11.5px] text-ink-dim">
                  {passCount} of {result.total} rules fully met
                </div>
                {setup.fibConfluence && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Icon name="architecture" size={13} className="text-gold-deep" />
                    <span className="text-[11px] font-semibold text-gold-deep">
                      Fib {setup.fibLevel} active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action — logging auto-saves to history */}
            <div className="flex gap-2.5 mt-1">
              {result.canLog ? (
                <Button
                  type="button"
                  variant="primary"
                  icon="add_task"
                  onClick={() => {
                    saveToHistory();
                    sessionStorage.setItem("journal:preset", JSON.stringify(tradePreset));
                    router.push("/journal/new");
                  }}
                >
                  Log this trade
                </Button>
              ) : (
                <Button type="button" variant="ghost" icon="block" disabled>
                  Resolve invalidating rules to log
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
                  <RuleRow key={rule.id} rule={rule} framework={setup.framework} />
                ))}
              </div>
            )}
          </Panel>


          {/* Position size calculator — its own card in the results column,
              matching the design prototype. It used to be a collapsed drawer
              at the bottom of the setup card, which hid Risk %: the input for
              rule 10, an invalidating rule. An input that decides whether a
              setup is void does not belong behind a disclosure. */}
          <Panel>
            <PanelHead title="Position size calculator" icon="calculate" />
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Account balance" half>
                    <MonoInput
                      value={calcBalance}
                      onChange={(e) => { set("balance", e.target.value); localStorage.setItem("smfx_balance", e.target.value); }}
                      placeholder="10000"
                    />
                  </Field>
                  <Field label="Risk %" half>
                    <MonoInput value={calcRisk} onChange={(e) => set("riskPct", e.target.value)} placeholder="1" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Entry price" half>
                    <MonoInput
                      value={calcEntry}
                      onChange={(e) => set("entryPrice", e.target.value)}
                      placeholder={setup.pair === "EURUSD" ? "1.08500" : setup.pair === "XAUUSD" ? "2330.00" : "..."}
                    />
                  </Field>
                  <Field label="Stop loss" half>
                    <MonoInput
                      value={calcSl}
                      onChange={(e) => set("slPrice", e.target.value)}
                      placeholder={setup.pair === "EURUSD" ? "1.08300" : setup.pair === "XAUUSD" ? "2325.00" : "..."}
                    />
                  </Field>
                </div>

                {calcResult && (
                  <div className="rounded-xl p-4 bg-panel-2 shadow-sm">
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
                        <div className="text-[14px] font-semibold text-coral-deep">
                          −${calcResult.dollarRisk.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">Lot size</div>
                        <div className="font-bold text-[26px] tracking-[-0.02em] text-gold-deep">
                          {calcResult.lots < 0.01 ? calcResult.lots.toFixed(4) : calcResult.lots.toFixed(2)}
                        </div>
                      </div>
                      {calcResult.tp !== null && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">
                            TP ({setup.rr}R)
                          </div>
                          <div className={cn("text-[14px] font-semibold", setup.dir === "long" ? "text-teal-deep" : "text-coral-deep")}>
                            {calcResult.tp.toFixed(calcResult.isForex ? 5 : setup.pair === "XAUUSD" ? 2 : 1)}
                          </div>
                        </div>
                      )}
                      {calcResult.dollarProfit !== null && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-ink-dim">Expected profit</div>
                          <div className="text-[14px] font-semibold text-teal-deep">
                            +${calcResult.dollarProfit.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!calcResult && calcEntry && calcSl && (
                  <p className="text-[11.5px] text-coral-deep">Enter valid entry and SL prices.</p>
                )}

                {calcResult && (
                  <p className="text-[11px] text-ink-dim">
                    These prices will pre-fill the trade log when you click &ldquo;Log this trade&rdquo;.
                  </p>
                )}
            </div>
          </Panel>
          {/* Model notes — advice about the chosen model, not rulebook rules */}
          {result.subChecks.length > 0 && (
            <Panel pad={0}>
              <div className="px-5 pt-4 pb-2">
                <div className="font-display font-semibold text-[15px] text-ink-strong">
                  Notes on this model
                </div>
                <p className="text-[12px] mt-0.5 text-ink-dim">
                  Specific to {setup.model}. These do not count toward the thirteen rules.
                </p>
              </div>
              <div className="px-4 pb-4 flex flex-col gap-2">
                {result.subChecks.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-panel-2 shadow-sm">
                    <Icon name={STATUS_ICON[c.status]} size={17} className={cn("shrink-0 mt-0.5", STATUS_TEXT_CLS[c.status])} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink-strong">{c.label}</div>
                      <div className="text-[12px] mt-0.5 leading-relaxed text-ink-dim">{c.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Status legend */}
          <div className="flex items-center gap-4 px-1">
            {(["pass", "warn", "fail"] as Status[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <Icon name={STATUS_ICON[s]} size={14} className={STATUS_TEXT_CLS[s]} />
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
              <div className="px-5 pb-3 flex flex-col gap-0.5">
                {history.map((h, i) => <HistoryRow key={h.id} entry={h} divider={i < history.length - 1} />)}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Killzone badge — extracted to avoid duplication ───────────────────────────

function KillzoneBadge({ active, session }: { active: boolean; session: string }) {
  if (active) {
    return (
      <div className="flex items-center gap-1.5 pl-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal animate-[live-pulse_2s_infinite]" />
        <span className="text-[11px] font-semibold text-teal-deep">Active now</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 pl-1">
      <Icon name="schedule" size={12} className="text-ink-dim" />
      <span className="text-[11px] text-ink-dim">Opens in {timeUntilOpen(session)}</span>
    </div>
  );
}
