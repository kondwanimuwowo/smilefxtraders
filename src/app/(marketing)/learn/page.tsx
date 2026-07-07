import type { Metadata } from "next";
import Link from "next/link";
import { Button, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Academy | Smile FX Traders",
  description: "A structured smart-money curriculum: six levels from market-structure foundations to a funded account, taught in order by Kondwani.",
};

const LEVELS = [
  { num: "01", title: "Foundations", desc: "Market structure, candles, and risk basics. The bedrock everything else stands on.", state: "done" as const, lessons: 8 },
  { num: "02", title: "Liquidity & Structure", desc: "BOS, CHoCH, liquidity pools, and how price hunts stops with sweeps.", state: "done" as const, lessons: 10 },
  { num: "03", title: "POIs: FVG & Order Blocks", desc: "Identifying and grading the points of interest you actually enter from.", state: "current" as const, lessons: 12 },
  { num: "04", title: "Premium / Discount & PD Arrays", desc: "Dealing ranges, OTE, and equilibrium: where in the range to engage.", state: "locked" as const, lessons: 9 },
  { num: "05", title: "Multi-TF Execution", desc: "Top-down analysis and trading the London & New York killzones.", state: "locked" as const, lessons: 11 },
  { num: "06", title: "Mastery & Funding", desc: "Prop-firm rules, trading psychology, and scaling a funded account.", state: "locked" as const, lessons: 14 },
];

export default function LearnPage() {
  return (
    <>
      {/* Dark hero */}
      <section className="dark py-32 pb-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">From your first candle to a funded account</h2>
            <p className="lead mt-[18px]">Six levels, taught in order. Master each before the next unlocks, so nothing is skipped and nothing is rushed. This is the same path Kondwani walks every new trader through.</p>
          </div>
          <div className="flex gap-7 mt-[34px] flex-wrap">
            <div>
              <div className="mono text-[30px] font-bold text-teal-bright">64</div>
              <div className="text-[13px] text-white/60">Video lessons</div>
            </div>
            <div>
              <div className="mono text-[30px] font-bold text-gold">6</div>
              <div className="text-[13px] text-white/60">Structured levels</div>
            </div>
            <div>
              <div className="mono text-[30px] font-bold text-teal-bright">∞</div>
              <div className="text-[13px] text-white/60">Replays &amp; updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum path */}
      <section className="section">
        <div className="container">
          <div className="sec-head reveal">
            <div className="eyebrow">The curriculum</div>
            <h2>A path, not a playlist</h2>
            <div className="rule" />
          </div>
          <div className="mt-12 flex flex-col gap-[18px]">
            {LEVELS.map(({ num, title, desc, state, lessons }) => {
              const icon = state === "done" ? "verified" : state === "current" ? "play_circle" : "lock";
              const iconColorCls = state === "done" ? "text-teal" : state === "current" ? "text-gold" : "text-ink-dim";
              const iconBgCls = state === "current" ? "bg-[rgba(248,185,61,0.16)]" : state === "done" ? "bg-[rgba(8,174,170,0.14)]" : "bg-[var(--bg-soft)]";
              const tag = state === "done"
                ? <span className="chip text-[11px]">Complete</span>
                : state === "current"
                ? <span className="chip gold text-[11px]">In progress</span>
                : <span className="chip text-[11px] bg-[var(--bg-soft)] text-ink-dim">Locked</span>;
              return (
                <div key={num} className={`card reveal flex items-center gap-5 py-[22px] px-[26px] ${state === "locked" ? "opacity-[0.62]" : ""}`}>
                  <div className="font-display text-2xl font-bold text-ink-dim w-[38px] shrink-0">{num}</div>
                  <div className={`w-12 h-12 rounded-[13px] grid place-items-center shrink-0 ${iconBgCls}`}>
                    <Icon name={icon} size={24} className={iconColorCls} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-[19px]">{title}</h3>
                      {tag}
                    </div>
                    <p className="text-sm text-ink-mid mt-1.5 leading-[1.55]">{desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="mono text-[13px] text-ink-mid">{lessons} lessons</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Inside a lesson */}
      <section className="section soft">
        <div className="container">
          <div className="feature-row">
            <div className="feature-text reveal">
              <div className="eyebrow">Inside a lesson</div>
              <h3>Learn the why, not just the what</h3>
              <p className="lead">Every lesson pairs a focused video with a written summary and the key points, so you can revise fast before London opens, and the concept actually sticks.</p>
              <ul className="feature-list">
                {[
                  "Short, focused videos, most under 15 minutes",
                  "Written summary & numbered key takeaways",
                  "Live markups on real XAUUSD & EURUSD setups",
                  "Mark complete to unlock the next lesson",
                ].map(f => <li key={f}><Icon name="check_circle" size={22} className="text-teal shrink-0" />{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <Icon name="play_lesson" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">FVG + OB Confluence Entries</span>
                  <span className="chip gold ml-auto text-[10px]">Lesson 4</span>
                </div>
                <div className="mock-body">
                  <div className="aspect-video rounded-xl bg-navy-grad grid place-items-center relative overflow-hidden">
                    <div className="w-[58px] h-[58px] rounded-full bg-gold grid place-items-center shadow-[0_8px_26px_rgba(248,185,61,0.4)]">
                      <Icon name="play_arrow" size={30} className="text-[var(--navy-deep)]" />
                    </div>
                    <div className="absolute left-3.5 right-3.5 bottom-3.5 h-1 rounded-full bg-white/25">
                      <div className="h-full rounded-full bg-gold w-[32%]" />
                    </div>
                    <span className="mono absolute bottom-6 right-4 text-[11px] text-white/80">3:04 / 16:55</span>
                  </div>
                  <p className="text-[13px] text-ink-mid leading-[1.55] mt-3.5">The highest-probability SMC entry stacks an Order Block with an FVG in the same zone, in line with HTF bias, after a liquidity sweep.</p>
                  <div className="grid gap-[7px] mt-2.5">
                    {["HTF draw on liquidity established", "OB and FVG overlap in discount"].map((pt, i) => (
                      <div key={pt} className="flex gap-[9px] items-start text-[12.5px]">
                        <span className="mono w-5 h-5 rounded-md bg-bg-tint text-[var(--teal-dark)] grid place-items-center font-bold text-[11px] shrink-0">{i + 1}</span>
                        {pt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support cards */}
      <section className="section">
        <div className="container">
          <div className="grid g3 reveal">
            <div className="card p-7">
              <div className="icon-chip"><Icon name="groups_3" /></div>
              <h3 className="text-[19px] mt-4 mb-2">Weekly live calls</h3>
              <p className="text-[14.5px] text-ink-mid leading-[1.6]">Join Kondwani live to mark up the week&apos;s setups and ask questions in real time. <span className="text-[var(--gold-dark)] font-semibold">Funded Track</span></p>
            </div>
            <div className="card p-7">
              <div className="icon-chip"><Icon name="reviews" /></div>
              <h3 className="text-[19px] mt-4 mb-2">1-on-1 journal reviews</h3>
              <p className="text-[14.5px] text-ink-mid leading-[1.6]">Send your journal for a personal teardown and find the leaks faster with a mentor&apos;s eye.</p>
            </div>
            <div className="card p-7">
              <div className="icon-chip"><Icon name="workspace_premium" /></div>
              <h3 className="text-[19px] mt-4 mb-2">Prop-firm playbook</h3>
              <p className="text-[14.5px] text-ink-mid leading-[1.6]">The exact rules and risk model to pass a challenge and trade a funded account responsibly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section soft">
        <div className="container">
          <div className="reveal text-center max-w-[600px] mx-auto">
            <h2 className="text-[clamp(28px,4vw,40px)]">Start at Level 1 today</h2>
            <p className="lead mt-3.5">Foundations is free on the Starter plan. Climb at your own pace.</p>
            <div className="flex gap-3.5 justify-center mt-[26px] flex-wrap">
              <Button href="/signup" hardNav size="lg" iconRight="arrow_forward">Begin learning</Button>
              <Button href="/pricing" size="lg" variant="ghost">Compare plans</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
