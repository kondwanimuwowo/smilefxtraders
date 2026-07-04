import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";

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
      <section className="dark" style={{ padding: "128px 0 96px", background: "radial-gradient(ellipse at 12% 18%, rgba(8,174,170,0.45) 0%, transparent 52%), radial-gradient(ellipse at 88% 88%, rgba(248,185,61,0.32) 0%, transparent 48%), linear-gradient(155deg, #0C4E6B 0%, #082A3B 60%)" }}>
        <div className="container">
          <div className="sec-head reveal">
            <h2 style={{ fontSize: "clamp(28px,3.8vw,46px)", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.18, margin: 0 }}>From your first candle to a funded account</h2>
            <p className="lead" style={{ marginTop: 18 }}>Six levels, taught in order. Master each before the next unlocks, so nothing is skipped and nothing is rushed. This is the same path Kondwani walks every new trader through.</p>
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 34, flexWrap: "wrap" }}>
            <div>
              <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: "var(--teal-bright)" }}>64</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Video lessons</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: "var(--gold)" }}>6</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Structured levels</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: "var(--teal-bright)" }}>∞</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Replays &amp; updates</div>
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
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 18 }}>
            {LEVELS.map(({ num, title, desc, state, lessons }) => {
              const icon = state === "done" ? "verified" : state === "current" ? "play_circle" : "lock";
              const iconColor = state === "done" ? "var(--teal)" : state === "current" ? "var(--gold)" : "var(--ink-dim)";
              const iconBg = state === "current" ? "rgba(248,185,61,0.16)" : state === "done" ? "rgba(8,174,170,0.14)" : "var(--bg-soft)";
              const tag = state === "done"
                ? <span className="chip" style={{ fontSize: 11 }}>Complete</span>
                : state === "current"
                ? <span className="chip gold" style={{ fontSize: 11 }}>In progress</span>
                : <span className="chip" style={{ background: "var(--bg-soft)", color: "var(--ink-dim)", fontSize: 11 }}>Locked</span>;
              return (
                <div key={num} className="card reveal" style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 26px", opacity: state === "locked" ? 0.62 : 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--ink-dim)", width: 38, flexShrink: 0 }}>{num}</div>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: iconBg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <span className={`material-symbols-rounded ${state !== "locked" ? "ic-fill" : ""}`} style={{ color: iconColor, fontSize: 24 }}>{icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 19 }}>{title}</h3>
                      {tag}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--ink-mid)", marginTop: 5, lineHeight: 1.55 }}>{desc}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 13, color: "var(--ink-mid)" }}>{lessons} lessons</div>
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
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>play_lesson</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>FVG + OB Confluence Entries</span>
                  <span className="chip gold" style={{ marginLeft: "auto", fontSize: 10 }}>Lesson 4</span>
                </div>
                <div className="mock-body">
                  <div style={{ aspectRatio: "16/9", borderRadius: 12, background: "var(--navy-grad)", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
                    <div style={{ width: 58, height: 58, borderRadius: 99, background: "var(--gold)", display: "grid", placeItems: "center", boxShadow: "0 8px 26px rgba(248,185,61,0.4)" }}>
                      <span className="material-symbols-rounded ic-fill" style={{ color: "var(--navy-deep)", fontSize: 30 }}>play_arrow</span>
                    </div>
                    <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.25)" }}>
                      <div style={{ width: "32%", height: "100%", borderRadius: 99, background: "var(--gold)" }} />
                    </div>
                    <span className="mono" style={{ position: "absolute", bottom: 24, right: 16, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>3:04 / 16:55</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ink-mid)", lineHeight: 1.55, marginTop: 14 }}>The highest-probability SMC entry stacks an Order Block with an FVG in the same zone, in line with HTF bias, after a liquidity sweep.</p>
                  <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
                    {["HTF draw on liquidity established", "OB and FVG overlap in discount"].map((pt, i) => (
                      <div key={pt} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5 }}>
                        <span className="mono" style={{ width: 20, height: 20, borderRadius: 6, background: "var(--bg-tint)", color: "var(--teal-dark)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{i + 1}</span>
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
            <div className="card" style={{ padding: 28 }}>
              <div className="icon-chip"><span className="material-symbols-rounded">groups_3</span></div>
              <h3 style={{ fontSize: 19, margin: "16px 0 8px" }}>Weekly live calls</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6 }}>Join Kondwani live to mark up the week&apos;s setups and ask questions in real time. <span style={{ color: "var(--gold-dark)", fontWeight: 600 }}>Funded Track</span></p>
            </div>
            <div className="card" style={{ padding: 28 }}>
              <div className="icon-chip"><span className="material-symbols-rounded">reviews</span></div>
              <h3 style={{ fontSize: 19, margin: "16px 0 8px" }}>1-on-1 journal reviews</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6 }}>Send your journal for a personal teardown and find the leaks faster with a mentor&apos;s eye.</p>
            </div>
            <div className="card" style={{ padding: 28 }}>
              <div className="icon-chip"><span className="material-symbols-rounded">workspace_premium</span></div>
              <h3 style={{ fontSize: 19, margin: "16px 0 8px" }}>Prop-firm playbook</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6 }}>The exact rules and risk model to pass a challenge and trade a funded account responsibly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section soft">
        <div className="container">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,40px)" }}>Start at Level 1 today</h2>
            <p className="lead" style={{ marginTop: 14 }}>Foundations is free on the Starter plan. Climb at your own pace.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
              <Button href="/signup" size="lg" iconRight="arrow_forward">Begin learning</Button>
              <Button href="/pricing" size="lg" variant="ghost">Compare plans</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
