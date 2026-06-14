"use client";

import { useState, useEffect } from "react";
import type { Trade, AIReviewResult } from "@/lib/store";
import { Icon } from "@/components/ui";

// ── Types ────────────────────────────────────────────────────────────────────

type ReviewState = "idle" | "loading" | "done" | "error" | "locked";

const GRADE_COLOR: Record<string, string> = {
  "A+": "var(--teal)", A: "var(--teal)",
  B:    "var(--gold)", C: "var(--gold)",
  D:    "var(--coral)",
};

function GradeChip({ grade }: { grade: string }) {
  const color = GRADE_COLOR[grade] ?? "var(--ink-dim)";
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold shrink-0"
      style={{ fontSize: 22, background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {grade}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: "var(--panel-2)" }} />
        <div className="flex-1 h-4 rounded-full" style={{ background: "var(--panel-2)" }} />
      </div>
      {[75, 55, 88, 60].map((w, i) => (
        <div key={i} className="h-3 rounded-full" style={{ background: "var(--panel-2)", width: `${w}%` }} />
      ))}
    </div>
  );
}

// ── AIReview ──────────────────────────────────────────────────────────────────

interface Props {
  trade:          Trade;
  autoRun?:       boolean;
  initialReview?: AIReviewResult;
  onSave?:        (result: AIReviewResult) => void;
}

export function AIReview({ trade, autoRun = false, initialReview, onSave }: Props) {
  const [state,  setState]  = useState<ReviewState>(initialReview ? "done" : "idle");
  const [result, setResult] = useState<AIReviewResult | null>(initialReview ?? null);

  async function runReview() {
    setState("loading");
    setResult(null);
    try {
      const res = await fetch("/api/review", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pair:      trade.pair,
          dir:       trade.dir,
          model:     trade.model,
          framework: trade.framework ?? "SMC",
          session:   trade.session,
          rr:        trade.rr,
          riskPct:   trade.riskPct,
          result:    trade.result,
          pnlR:      trade.pnlR,
          tags:      trade.tags,
          note:      trade.note,
        }),
      });
      if (res.status === 403) {
        setState("locked");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as AIReviewResult;
      setResult(data);
      setState("done");
      onSave?.(data);
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    if (autoRun && !initialReview) runReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tipLabel = trade.framework === "SnD" ? "S&D tip: " : "ICT tip: ";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{
          background: "var(--panel-2)",
          borderBottom: state !== "idle" ? "1px solid var(--line)" : "none",
        }}
      >
        <div
          className="size-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--teal), var(--navy))" }}
        >
          <span className="material-symbols-rounded text-white" style={{ fontSize: 18 }}>robot_2</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px]" style={{ color: "var(--ink-strong)" }}>
            Gavo AI Review
          </div>
          <div className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
            {state === "idle"    && (trade.framework === "SnD" ? "Grade this setup against the S&D rulebook" : "Grade this setup against the SMC rulebook")}
            {state === "loading" && "Analysing your trade…"}
            {state === "done"    && result && `Grade: ${result.grade} · ${trade.pair} ${trade.dir}`}
            {state === "error"   && "Review failed — tap to retry"}
            {state === "locked"  && "Pro & Funded Track feature"}
          </div>
        </div>

        {state === "idle" && (
          <button
            type="button"
            onClick={runReview}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all shrink-0"
            style={{ background: "rgba(8,174,170,0.12)", color: "var(--teal)", border: "1px solid rgba(8,174,170,0.2)" }}
          >
            Review
          </button>
        )}

        {state === "error" && (
          <button
            type="button"
            onClick={runReview}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all shrink-0"
            style={{ background: "rgba(234,82,61,0.10)", color: "var(--coral)", border: "1px solid rgba(234,82,61,0.2)" }}
          >
            Retry
          </button>
        )}

        {state === "locked" && (
          <a
            href="/pricing"
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all shrink-0"
            style={{ background: "rgba(248,185,61,0.12)", color: "var(--gold)", border: "1px solid rgba(248,185,61,0.2)" }}
          >
            Upgrade
          </a>
        )}

        {state === "done" && (
          <button
            type="button"
            onClick={runReview}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: "var(--ink-dim)" }}
            title="Re-run review"
          >
            <Icon name="refresh" size={16} />
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {state === "loading" && (
        <div style={{ animation: "pulse 1.8s ease-in-out infinite" }}>
          <Skeleton />
        </div>
      )}

      {/* Result */}
      {state === "done" && result && (
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Grade + verdict */}
          <div className="flex items-start gap-3">
            <GradeChip grade={result.grade} />
            <p className="text-[13px] leading-relaxed flex-1 pt-0.5" style={{ color: "var(--ink-mid)" }}>
              {result.verdict}
            </p>
          </div>

          {/* What you did well */}
          {result.good.length > 0 && (
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--teal)" }}>
                What you did well
              </div>
              <ul className="flex flex-col gap-1.5">
                {result.good.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "var(--ink-mid)" }}>
                    <Icon name="check_circle" size={15} fill style={{ color: "var(--teal)", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to improve */}
          {result.improve.length > 0 && (
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--coral)" }}>
                Areas to improve
              </div>
              <ul className="flex flex-col gap-1.5">
                {result.improve.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "var(--ink-mid)" }}>
                    <Icon name="trending_flat" size={15} style={{ color: "var(--coral)", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tip */}
          {result.tip && (
            <div
              className="rounded-xl px-3.5 py-3 flex items-start gap-2.5"
              style={{ background: "rgba(248,185,61,0.08)", border: "1px solid rgba(248,185,61,0.2)" }}
            >
              <Icon name="lightbulb" size={15} fill style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>
                <span className="font-semibold" style={{ color: "var(--gold)" }}>{tipLabel}</span>
                {result.tip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
