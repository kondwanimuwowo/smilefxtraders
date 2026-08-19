"use client";

import { useState } from "react";
import Link from "next/link";
import { Panel, Icon, Button, GavoIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Framework } from "@/lib/frameworks";
import type { RuleResult } from "@/lib/frameworks";
import { ruleById } from "@/lib/rulebook";
import type { SetupRead } from "@/lib/gavo/setup-read";

interface Props {
  framework: Framework;
  pair:      string;
  dir:       string;
  model:     string;
  session:   string;
  readiness: string;
  clear:     number;
  total:     number;
  rules:     RuleResult[];
}

// Gavo's pre-trade read, sitting beside the Validator's mechanical verdict.
//
// Button-triggered rather than automatic, and that is deliberate: the setup
// form changes on every toggle, so an automatic read would fire an Anthropic
// call per keystroke, cost real money, and show the trader an opinion about a
// setup they were halfway through describing. They ask when they are ready.
export function GavoSetupRead(props: Props) {
  const [read,    setRead]    = useState<SetupRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  async function ask() {
    setLoading(true);
    setError(null);
    setUpgrade(false);
    try {
      const res = await fetch("/api/validator-review", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework: props.framework,
          pair:      props.pair,
          dir:       props.dir,
          model:     props.model,
          session:   props.session,
          readiness: props.readiness,
          clear:     props.clear,
          total:     props.total,
          rules:     props.rules.map((r) => ({ id: r.id, label: r.label, status: r.status, why: r.why })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpgrade(Boolean(data?.upgrade));
        setError(data?.error ?? "Gavo could not read this setup.");
        return;
      }
      setRead(data as SetupRead);
    } catch {
      setError("Could not reach Gavo. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex items-center justify-center size-8 rounded-full bg-teal-tint shrink-0">
          {/* The brand mark, not a generic robot glyph: smart_toy is not in
              ICON_REGISTRY and would throw. */}
          <GavoIcon size={18} className="text-teal-deep" />
        </span>
        <h2 className="text-[15px] font-semibold text-ink-strong flex-1">Gavo&rsquo;s read</h2>
        {loading && <span className="text-[11.5px] font-semibold text-ink-dim">Thinking&hellip;</span>}
      </div>

      {!read && !error && !loading && (
        <p className="text-[12.5px] leading-relaxed text-ink-mid mb-4">
          The checklist tells you which rules are unmet. Ask Gavo which one actually decides this trade.
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[12.5px] bg-coral-tint text-coral-deep ring-1 ring-coral-deep/40">
          {error}
          {upgrade && (
            <Link href="/membership" className="block mt-1.5 font-semibold underline">
              See plans
            </Link>
          )}
        </div>
      )}

      {read && (
        <div className="flex flex-col gap-3 mb-4">
          {read.read && (
            <p className="text-[13px] leading-relaxed text-ink">{read.read}</p>
          )}

          {read.watch.length > 0 && (
            <div className="rounded-xl px-4 py-3 bg-panel-2">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-ink-dim">
                Watch
              </div>
              <ul className="flex flex-col gap-1.5">
                {read.watch.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-[12.5px] text-ink-mid">
                    <Icon name="visibility" size={14} className="text-teal-deep shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cited rules, resolved against the rulebook rather than printed
              raw: the ids are validated server-side, so anything here has a
              real page to link to. */}
          {read.rules.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {read.rules.map((id) => {
                const rule = ruleById(props.framework, id);
                if (!rule) return null;
                return (
                  <Link
                    key={id}
                    href={`/rules?fw=${props.framework}#${rule.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-teal-tint text-teal-deep hover:opacity-75"
                  >
                    Rule {rule.n}
                    <Icon name="chevron_right" size={12} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Button
        variant={read ? "ghost" : "primary"}
        size="md"
        loading={loading}
        icon="auto_awesome"
        onClick={ask}
        className={cn(read && "border-line text-ink-mid")}
      >
        {read ? "Ask again" : "Ask Gavo"}
      </Button>
    </Panel>
  );
}
