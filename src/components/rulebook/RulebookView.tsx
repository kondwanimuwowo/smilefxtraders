"use client";

import { useEffect, useState } from "react";
import { RULEBOOK, GRADE_SCALE } from "@/lib/rulebook";
import type { Framework } from "@/lib/frameworks";
import { cn } from "@/lib/cn";

/**
 * The rulebook, rendered from the same object Gavo's prompt is built from.
 *
 * Shared by the in-app page and the marketing page so the two cannot describe
 * different standards. `marketing` only changes the surrounding copy; the rules
 * themselves are identical by construction.
 */
export function RulebookView({ marketing = false }: { marketing?: boolean }) {
  const [framework, setFramework] = useState<Framework>("SMC");
  const book = RULEBOOK[framework];

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
                ? "bg-teal text-white shadow-sm"
                : "bg-panel-2 text-ink-mid hover:opacity-80",
            )}
          >
            {RULEBOOK[fw].label}
          </button>
        ))}
      </div>

      <p className="text-[14px] leading-relaxed max-w-2xl text-ink-mid">{book.intro}</p>

      {/* Rules */}
      <div className="flex flex-col gap-5">
        {book.groups.map((group, gi) => (
          <section key={group.title} className="rounded-2xl overflow-hidden bg-panel shadow-sm">
            <header className="px-5 py-4 bg-panel-2">
              <div className="flex items-baseline gap-2.5">
                <span className="font-display font-bold text-[12px] tabular-nums text-teal">
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
                      <h3 className="font-semibold text-[14px] mb-1 text-ink-strong">{rule.title}</h3>
                      <p className="text-[13px] leading-relaxed text-ink-mid">{rule.body}</p>
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
            {marketing
              ? "Every journalled trade is graded against these thirteen rules."
              : "Gavo grades every trade you journal against these thirteen rules, and checks what it can against real broker price data."}
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
                  g.tone === "teal" ? "text-teal" : g.tone === "gold" ? "text-gold" : "text-coral",
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
