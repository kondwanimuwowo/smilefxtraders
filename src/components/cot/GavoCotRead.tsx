"use client";

import { useState } from "react";
import { Icon, GavoIcon } from "@/components/ui";

// Mirrors components/macro/GavoExplanation.tsx's idle/loading/done/error/locked
// state machine and card treatment, scoped to a single pair's COT reading.

type ExplainState = "idle" | "loading" | "done" | "error" | "locked";

export function GavoCotRead({ pair }: { pair: string }) {
  const [state, setState] = useState<ExplainState>("idle");
  const [explanation, setExplanation] = useState<string | null>(null);

  async function runExplain() {
    setState("loading");
    setExplanation(null);
    try {
      const res = await fetch(`/api/cot/${pair}/explain`, { method: "POST" });
      if (res.status === 403) {
        setState("locked");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { explanation: string };
      setExplanation(data.explanation);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mb-6 rounded-xl overflow-hidden bg-panel shadow-md">
      <div className="flex items-center gap-3 px-4 py-3.5 bg-panel-2">
        <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-[linear-gradient(135deg,var(--teal),var(--navy))]">
          <GavoIcon size={18} className="text-white" cutoutColor="var(--navy)" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] text-ink-strong">Gavo COT Read</div>
          <div className="text-[12px] text-ink-dim">
            {state === "idle" && `Ask Gavo to read ${pair}'s current COT positioning`}
            {state === "loading" && "Reading the data…"}
            {state === "done" && "AI narration"}
            {state === "error" && "Read failed. Tap to retry"}
            {state === "locked" && "Edge & Pro feature"}
          </div>
        </div>

        {state === "idle" && (
          <button
            type="button"
            onClick={runExplain}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all shrink-0 bg-[rgba(8,174,170,0.12)] text-teal border border-[rgba(8,174,170,0.2)]"
          >
            Explain
          </button>
        )}
        {state === "error" && (
          <button
            type="button"
            onClick={runExplain}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all shrink-0 bg-[rgba(234,82,61,0.10)] text-coral border border-[rgba(234,82,61,0.2)]"
          >
            Retry
          </button>
        )}
        {state === "locked" && (
          <a
            href="/pricing"
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all shrink-0 bg-[rgba(248,185,61,0.12)] text-gold border border-[rgba(248,185,61,0.2)]"
          >
            Upgrade
          </a>
        )}
        {state === "done" && (
          <button
            type="button"
            onClick={runExplain}
            className="p-1.5 rounded-lg transition-colors shrink-0 text-ink-dim"
            title="Regenerate"
          >
            <Icon name="refresh" size={16} />
          </button>
        )}
      </div>

      {state === "loading" && (
        <div className="animate-[pulse_1.8s_ease-in-out_infinite] px-4 py-4 flex flex-col gap-2">
          {[100, 85, 70].map((w, i) => (
            <div key={i} className="h-3 rounded-full bg-panel-2" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {state === "done" && explanation && (
        <div className="px-4 py-4">
          <p className="text-[13px] leading-relaxed text-ink-mid whitespace-pre-line">{explanation}</p>
        </div>
      )}
    </div>
  );
}
