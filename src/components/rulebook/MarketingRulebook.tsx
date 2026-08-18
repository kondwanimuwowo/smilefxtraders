"use client";

import { useState } from "react";
import { RULEBOOK, GRADE_SCALE, WEIGHT_LABEL, WEIGHT_BLURB, type Rulebook, type RuleWeight } from "@/lib/rulebook";
import type { Framework } from "@/lib/frameworks";
import { cn } from "@/lib/cn";

/**
 * The rulebook as a published document, for the marketing site.
 *
 * Deliberately a separate presentation from RulebookView rather than a variant
 * of it. That component is built from app surface tokens (bg-panel, panel-2),
 * so on the apex it read as a dashboard page a visitor had wandered into. The
 * rules themselves come from the same RULEBOOK object, so the two cannot
 * describe different standards no matter how differently they look.
 */

const WEIGHT_CHIP: Record<RuleWeight, string> = {
  invalidating: "chip coral",
  core:         "chip gold",
  supporting:   "chip",
};

function TierLegend() {
  return (
    <div className="grid gap-6 sm:grid-cols-3 mb-16">
      {(["invalidating", "core", "supporting"] as RuleWeight[]).map((w) => (
        <div key={w} className="card p-6">
          <span className={cn(WEIGHT_CHIP[w], "text-[11.5px]")}>{WEIGHT_LABEL[w]}</span>
          <p className="text-[14px] leading-[1.6] text-ink-mid mt-3 mb-0">{WEIGHT_BLURB[w]}</p>
        </div>
      ))}
    </div>
  );
}

function BookBody({ book }: { book: Rulebook }) {
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      {book.groups.map((group, gi) => (
        <section key={group.title} className="grid gap-8 md:grid-cols-[240px_1fr] md:gap-12">
          {/* Group heading — sticky on desktop so the section stays named while
              the reader works down its rules. */}
          <header className="md:sticky md:top-[110px] md:self-start">
            <span className="eyebrow">Group {String(gi + 1).padStart(2, "0")}</span>
            <h3 className="text-[22px] leading-[1.25] mt-3 mb-2">{group.title}</h3>
            <p className="text-[14px] leading-[1.6] text-ink-mid m-0">{group.blurb}</p>
          </header>

          <ol className="m-0 p-0 list-none">
            {group.rules.map((rule, ri) => (
              <li
                key={rule.id}
                id={rule.id}
                className={cn(
                  "flex gap-5 scroll-mt-[110px] py-7 first:pt-0 last:pb-0",
                  ri < group.rules.length - 1 && "border-b border-[var(--line)]",
                )}
              >
                <span
                  className="font-display font-bold text-[34px] leading-none tabular-nums shrink-0 w-[46px] text-teal-deep/70"
                  aria-hidden
                >
                  {String(rule.n).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <h4 className="text-[17px] font-bold leading-[1.3] m-0">{rule.title}</h4>
                    <span className={cn(WEIGHT_CHIP[rule.weight], "text-[11px]")}>{WEIGHT_LABEL[rule.weight]}</span>
                  </div>
                  <p className="text-[15px] leading-[1.65] text-ink-mid m-0">{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function GradeTable() {
  return (
    <div className="card overflow-hidden mt-16">
      <div className="px-7 py-6 bg-[var(--bg-soft)]">
        <h3 className="text-[20px] m-0">How a trade is graded</h3>
        <p className="text-[14px] text-ink-mid mt-2 mb-0">
          Which rules broke, not how many. One invalidating break caps the grade regardless of the rest.
        </p>
      </div>
      <div className="flex flex-col">
        {GRADE_SCALE.map((g, i) => (
          <div
            key={g.grade}
            className={cn(
              "flex items-center gap-5 px-7 py-4",
              i < GRADE_SCALE.length - 1 && "border-b border-[var(--line)]",
            )}
          >
            <span
              className={cn(
                "font-display font-bold text-[16px] w-11 h-11 rounded-full grid place-items-center shrink-0 tabular-nums",
                g.tone === "teal" ? "bg-[rgba(8,174,170,0.12)] text-teal-deep"
                  : g.tone === "gold" ? "bg-[rgba(248,185,61,0.16)] text-gold-deep"
                  : "bg-[rgba(234,82,61,0.12)] text-coral-deep",
              )}
            >
              {g.grade}
            </span>
            <span className="text-[14.5px] leading-[1.6] text-ink-mid">{g.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketingRulebook() {
  const [framework, setFramework] = useState<Framework>("SMC");

  return (
    <>
      <div className="flex gap-2.5 flex-wrap mb-14">
        {(Object.keys(RULEBOOK) as Framework[]).map((fw) => (
          <button
            key={fw}
            type="button"
            onClick={() => setFramework(fw)}
            aria-pressed={framework === fw}
            className={cn(
              "inline-flex items-center py-[9px] px-5 rounded-full text-[13.5px] font-semibold transition-colors duration-150",
              framework === fw
                ? "bg-teal-solid text-white"
                : "bg-bg-tint text-teal-deep hover:bg-[rgba(8,174,170,0.18)]",
            )}
          >
            {RULEBOOK[fw].label}
          </button>
        ))}
      </div>

      <TierLegend />

      {/* Both rulebooks are rendered and one is hidden, rather than only the
          selected one being mounted. The switch is client state, so a
          server-rendered page would otherwise ship SMC alone -- and this page
          exists partly to be found by people searching for these rules, which
          means all twenty-six need to be in the HTML. `hidden` keeps them out
          of the accessibility tree without removing them from the document. */}
      {(Object.keys(RULEBOOK) as Framework[]).map((fw) => (
        <div key={fw} hidden={fw !== framework}>
          <p className="text-[16px] leading-[1.7] text-ink-mid max-w-[680px] mb-14">{RULEBOOK[fw].intro}</p>
          <BookBody book={RULEBOOK[fw]} />
          <GradeTable />
        </div>
      ))}
    </>
  );
}
