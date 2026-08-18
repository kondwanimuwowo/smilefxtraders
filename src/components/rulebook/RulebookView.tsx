"use client";

import { useEffect, useState } from "react";
import { RULEBOOK, GRADE_SCALE, WEIGHT_LABEL, WEIGHT_BLURB, type RuleWeight, type RuleEvidence } from "@/lib/rulebook";
import type { Framework } from "@/lib/frameworks";
import { cn } from "@/lib/cn";
// Type-only on purpose: rule-stats.ts imports Prisma, and a value import from
// a "use client" module drags pg (and dns/fs) into the browser bundle.
import type { RuleStats } from "@/lib/gavo/rule-stats";

const WEIGHT_CHIP: Record<RuleWeight, string> = {
  invalidating: "bg-[rgba(234,82,61,0.12)] text-coral-deep",
  core:         "bg-[rgba(248,185,61,0.12)] text-gold-deep",
  supporting:   "bg-panel-2 text-ink-dim",
};

const EVIDENCE_NOTE: Record<RuleEvidence, string> = {
  computed: "Checked from your numbers",
  declared: "You confirm this",
};

/**
 * This rule's record against the member's own recent reviews.
 *
 * The number is the argument. A trader who has read rule 10 twenty times still
 * breaks it; being told Gavo has pulled them up on it in six of their last
 * twenty reviews is what makes it land.
 */
function RuleRecord({ stat, id }: { stat?: RuleStats; id: string }) {
  if (!stat || stat.reviewed === 0) return null;
  const record = stat.byRule[id];
  if (!record || (record.flagged === 0 && record.praised === 0)) return null;

  return (
    <div className="flex items-center gap-3 mt-2 text-[11px]">
      {record.flagged > 0 && (
        <span className="font-semibold text-coral-deep">
          Flagged in {record.flagged} of your last {stat.reviewed} reviews
        </span>
      )}
      {record.flagged === 0 && record.praised > 0 && (
        <span className="font-semibold text-teal-deep">
          Credited in {record.praised} of your last {stat.reviewed} reviews
        </span>
      )}
    </div>
  );
}

/**
 * The rulebook for members, inside the app shell.
 *
 * The marketing site has its own presentation (MarketingRulebook) because this
 * one is built from app surface tokens and read as a dashboard page on the apex.
 * Both render the same RULEBOOK object, so they cannot describe different
 * standards.
 */
export function RulebookView({ stats }: { stats?: Record<Framework, RuleStats> }) {
  const [framework, setFramework] = useState<Framework>("SMC");
  const book  = RULEBOOK[framework];
  const stat  = stats?.[framework];

  // Deep links carry the framework (`/rules?fw=SnD#zone-fresh`). Three S&D
  // rule ids have no SMC counterpart, so without this an S&D link from the
  // validator or a Gavo review would land on a page where the anchor does not
  // exist. Read after mount rather than during render so the server HTML and
  // the first client render still agree; the browser has already given up on
  // the hash by then, so scroll to it ourselves once the right book is on.
  useEffect(() => {
    const fw = new URLSearchParams(window.location.search).get("fw");
    if (fw === "SnD" || fw === "SMC") setFramework(fw);

    const id = window.location.hash.slice(1);
    if (!id) return;
    // Two frames: one for the framework state to commit, one for layout.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: "center" }),
      ),
    );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Framework switch */}
      <div className="flex items-center gap-2">
        {(Object.keys(RULEBOOK) as Framework[]).map((fw) => (
          <button
            key={fw}
            type="button"
            onClick={() => setFramework(fw)}
            aria-pressed={framework === fw}
            className={cn(
              "rounded-xl px-4 py-2 text-[13px] font-semibold transition-all active:scale-[0.98]",
              framework === fw
                ? "bg-teal-solid text-white shadow-sm"
                : "bg-panel-2 text-ink-mid hover:opacity-80",
            )}
          >
            {RULEBOOK[fw].label}
          </button>
        ))}
      </div>

      <p className="text-[14px] leading-relaxed max-w-2xl text-ink-mid">{book.intro}</p>

      {/* The tiers are load-bearing: they decide whether a break is fatal or
          merely costly, so they belong above the rules rather than in a footnote. */}
      <div className="rounded-2xl overflow-hidden bg-panel shadow-sm">
        <header className="px-5 py-4 bg-panel-2">
          <h2 className="font-display font-semibold text-[16px] text-ink-strong">Not every rule costs the same</h2>
          <p className="text-[12.5px] mt-1 text-ink-dim">
            Some rules are the ones others depend on. Break one of those and the setup is void, however clean the rest of it looks.
          </p>
        </header>
        <div className="flex flex-col">
          {(["invalidating", "core", "supporting"] as RuleWeight[]).map((w, i) => (
            <div key={w} className={cn("flex items-start gap-3 px-5 py-3", i < 2 && "border-b border-line")}>
              <span className={cn("text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5", WEIGHT_CHIP[w])}>
                {WEIGHT_LABEL[w]}
              </span>
              <span className="text-[13px] text-ink-mid">{WEIGHT_BLURB[w]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="flex flex-col gap-5">
        {book.groups.map((group, gi) => (
          <section key={group.title} className="rounded-2xl overflow-hidden bg-panel shadow-sm">
            <header className="px-5 py-4 bg-panel-2">
              <div className="flex items-baseline gap-2.5">
                <span className="font-display font-bold text-[12px] tabular-nums text-teal-deep">
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display font-semibold text-[16px] tracking-[-0.01em] text-ink-strong">
                  {group.title}
                </h2>
              </div>
              <p className="text-[12.5px] mt-1 text-ink-dim">{group.blurb}</p>
            </header>

            <ol className="flex flex-col">
              {group.rules.map((rule, ri) => (
                <li
                  key={rule.id}
                  id={rule.id}
                  className={cn(
                    "px-5 py-4 scroll-mt-24 target:bg-[rgba(8,174,170,0.06)] transition-colors",
                    ri < group.rules.length - 1 && "border-b border-line",
                  )}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-display font-bold text-[13px] tabular-nums shrink-0 w-5 text-ink-dim">
                      {rule.n}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-[14px] text-ink-strong">{rule.title}</h3>
                        <span
                          className={cn("text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", WEIGHT_CHIP[rule.weight])}
                          title={WEIGHT_BLURB[rule.weight]}
                        >
                          {WEIGHT_LABEL[rule.weight]}
                        </span>
                        <span className="text-[10px] text-ink-dim">{EVIDENCE_NOTE[rule.evidence]}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-ink-mid">{rule.body}</p>
                      <RuleRecord stat={stat} id={rule.id} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {/* Grade scale — previously invisible: members got a letter with no idea what earned it. */}
      <section className="rounded-2xl overflow-hidden bg-panel shadow-sm">
        <header className="px-5 py-4 bg-panel-2">
          <h2 className="font-display font-semibold text-[16px] text-ink-strong">How the grade is worked out</h2>
          <p className="text-[12.5px] mt-1 text-ink-dim">
            Gavo grades every trade you journal against these thirteen rules, and checks what it can
            against real broker price data. Which rules broke matters more than how many.
          </p>
        </header>
        <div className="flex flex-col">
          {GRADE_SCALE.map((g, i) => (
            <div
              key={g.grade}
              className={cn(
                "flex items-center gap-4 px-5 py-3",
                i < GRADE_SCALE.length - 1 && "border-b border-line",
              )}
            >
              <span
                className={cn(
                  "font-display font-bold text-[15px] w-9 shrink-0 tabular-nums",
                  g.tone === "teal" ? "text-teal-deep" : g.tone === "gold" ? "text-gold-deep" : "text-coral-deep",
                )}
              >
                {g.grade}
              </span>
              <span className="text-[13px] text-ink-mid">{g.meaning}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
