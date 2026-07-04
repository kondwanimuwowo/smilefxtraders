import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ChartViz } from "@/components/marketing/ChartViz";
import { CTACard } from "@/components/marketing/CTACard";

export const metadata: Metadata = {
  title: "Features — Smile FX Traders",
  description: "Every tool a disciplined trader needs — journal, rules validator, live alerts, COT reports, Gavo AI review, the Academy, and FX option expiries.",
};

export default function FeaturesPage() {
  return (
    <>
      {/* Dark hero */}
      <section className="dark" style={{ padding: "128px 0 96px", background: "radial-gradient(ellipse at 12% 18%, rgba(8,174,170,0.45) 0%, transparent 52%), radial-gradient(ellipse at 88% 88%, rgba(248,185,61,0.32) 0%, transparent 48%), linear-gradient(155deg, #0C4E6B 0%, #082A3B 60%)" }}>
        <div className="container">
          <div className="sec-head reveal">
            <h2 style={{ fontSize: "clamp(28px,3.8vw,46px)", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.18, margin: 0 }}>Every tool a disciplined trader needs</h2>
            <p className="lead">Smile FX is built specifically for SMC and Supply &amp; Demand traders. One platform — journal, validate, follow, analyse, and learn.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
            {[["#journal","Journal"],["#validator","Rules Validator"],["#alerts","Live Alerts"],["#cot","COT Reports"],["#gavo","Gavo AI"],["#academy","Academy"],["#expiries","FX Expiries"]].map(([href, label]) => (
              <a key={href} href={href} className="feature-pill">{label}</a>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {/* 1. Journal */}
          <div className="feature-row" id="journal" style={{ scrollMarginTop: 90 }}>
            <div className="feature-text reveal">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">menu_book</span></div>
                <span className="chip" style={{ fontSize: 11 }}>Core tool</span>
              </div>
              <h3>Trade Journal</h3>
              <p className="lead">Log every trade with full context. Know your real edge — which pairs, sessions, and models actually make you money.</p>
              <ul className="feature-list">
                {[
                  "Log entry, SL, TP, close price, model, session, and R:R",
                  "Win rate by session (London, New York, Asia)",
                  "Win rate by SMC model (OB+BOS, FVG sweep, SMT divergence…)",
                  "Discipline score — tracks how often you followed all 8 rules",
                  "AI review from Gavo — structured debrief on any trade",
                  "Equity curve built automatically from your closed trades",
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>menu_book</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>Trade Journal</span>
                  <span className="chip" style={{ marginLeft: "auto", fontSize: 11 }}>+12.4R</span>
                </div>
                <div className="mock-body" style={{ display: "grid", gap: 11 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    <div className="mock-tile"><div className="k">Win rate</div><div className="v">63%</div></div>
                    <div className="mock-tile"><div className="k">Avg win</div><div className="v" style={{ color: "var(--teal-dark)" }}>+2.6R</div></div>
                    <div className="mock-tile"><div className="k">Discipline</div><div className="v" style={{ color: "var(--gold-dark)" }}>91</div></div>
                  </div>
                  <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                    {[
                      { pair: "XAUUSD", dir: "Long", model: "FVG sweep · London", pnl: "+3.1R", col: "var(--teal-dark)" },
                      { pair: "USDJPY", dir: "Long", model: "OB+BOS · New York", pnl: "OPEN", col: "var(--gold-dark)" },
                      { pair: "NAS100", dir: "Short", model: "SMT divergence · NY", pnl: "+4.0R", col: "var(--teal-dark)" },
                    ].map(({ pair, dir, model, pnl, col }, i) => (
                      <div key={pair} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderBottom: i < 2 ? "1px solid var(--line)" : undefined }}>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{pair}</span>
                        <span className={`chip ${dir === "Short" ? "badge-short" : "badge-long"}`} style={{ fontSize: 10 }}>{dir}</span>
                        <span
                          className="truncate"
                          style={{ fontSize: 12, color: "var(--ink-mid)", flex: 1, minWidth: 0 }}
                        >
                          {model}
                        </span>
                        <span className="mono" style={{ color: col, fontWeight: 700, fontSize: 13 }}>{pnl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Validator */}
          <div className="feature-row flip" id="validator" style={{ scrollMarginTop: 90, marginTop: 96 }}>
            <div className="feature-text reveal">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">rule</span></div>
                <span className="chip" style={{ fontSize: 11 }}>Pre-trade checklist</span>
              </div>
              <h3>Rules Validator</h3>
              <p className="lead">A 5-minute checklist that keeps impulsive trades off the books. Check all 8 SMC or Supply &amp; Demand rules before clicking execute.</p>
              <ul className="feature-list">
                {[
                  "SMC and Supply & Demand frameworks",
                  "8 pre-trade questions: HTF bias, POI confluence, BOS, session, risk",
                  "Pip calculator auto-fills from your account size and risk %",
                  "One-click export to journal — pre-fills pair, direction, model, R:R",
                  "Grade-based result (A+ to D) with a pass/fail badge",
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>rule</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>Rules Validator</span>
                  <span className="chip" style={{ marginLeft: "auto", fontSize: 11 }}>8 rules</span>
                </div>
                <div className="mock-body" style={{ display: "grid", gap: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 13, background: "rgba(8,174,170,0.1)", border: "1px solid rgba(8,174,170,0.4)", borderRadius: 12 }}>
                    <span className="material-symbols-rounded ic-fill" style={{ color: "var(--teal)", fontSize: 32 }}>verified</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>A+ · Pass</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-mid)" }}>XAUUSD · Long · 8 / 8 rules met</div>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "center" }}>
                      <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--teal-dark)" }}>A+</div>
                      <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>grade</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 7 }}>
                    {["HTF bias clear · trading the draw","POI confluence · OB + FVG overlap","Within London killzone · risk 0.5%"].map(r => (
                      <div key={r} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
                        <span className="material-symbols-rounded ic-fill" style={{ color: "var(--teal)", fontSize: 18 }}>check_circle</span> {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Live Alerts */}
          <div className="feature-row" id="alerts" style={{ scrollMarginTop: 90, marginTop: 96 }}>
            <div className="feature-text reveal">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">notifications_active</span></div>
                <span className="chip" style={{ fontSize: 11 }}>Instructor calls</span>
              </div>
              <h3>Live Setup Alerts</h3>
              <p className="lead">Follow Kondwani's live calls in real time. Each alert includes pair, direction, entry, SL/TP, the SMC model used, and a setup note.</p>
              <ul className="feature-list">
                {[
                  "Posted every trading day during London and New York sessions",
                  "All alerts validated against the SMC rulebook before posting",
                  "Tap 'Copy to journal' to log any alert as your own trade",
                  "Filter by pair or model",
                  "Free plan shows a 4-hour delay — Pro subscribers see alerts live",
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="avatar avatar-ring" style={{ width: 30, height: 30, fontSize: 12, background: "linear-gradient(135deg,#1672A1,#0B425D)" }}>K</span>
                  <span style={{ fontWeight: 700, fontSize: 13, marginLeft: 4 }}>Kondwani</span>
                  <span className="chip gold" style={{ fontSize: 10 }}>LEAD INSTRUCTOR</span>
                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: "var(--coral)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--coral)", display: "inline-block" }} />LIVE
                  </span>
                </div>
                <div className="mock-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>XAUUSD</span>
                    <span className="chip badge-long" style={{ fontSize: 11 }}><span className="material-symbols-rounded" style={{ fontSize: 13 }}>trending_up</span> Long</span>
                    <span className="chip" style={{ fontSize: 11 }}>FVG sweep</span>
                  </div>
                  <ChartViz seed={42} n={32} drift={0.05} h={150} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
                    <div className="mock-tile" style={{ padding: "9px 11px" }}><div className="k">Entry</div><div className="v" style={{ fontSize: 14 }}>2,331.50</div></div>
                    <div className="mock-tile" style={{ padding: "9px 11px" }}><div className="k">Stop</div><div className="v" style={{ fontSize: 14, color: "var(--coral-dark)" }}>2,326.10</div></div>
                    <div className="mock-tile" style={{ padding: "9px 11px" }}><div className="k">TP1</div><div className="v" style={{ fontSize: 14, color: "var(--teal-dark)" }}>2,344.00</div></div>
                    <div className="mock-tile" style={{ padding: "9px 11px" }}><div className="k">R:R</div><div className="v" style={{ fontSize: 14, color: "var(--gold-dark)" }}>3.1R</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. COT Reports */}
          <div className="feature-row flip" id="cot" style={{ scrollMarginTop: 90, marginTop: 96 }}>
            <div className="feature-text reveal">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">groups</span></div>
                <span className="chip" style={{ fontSize: 11 }}>Institutional data</span>
              </div>
              <h3>COT Reports</h3>
              <p className="lead">See what large speculators and commercials are doing in the futures market — straight from the CFTC's Commitment of Traders report.</p>
              <ul className="feature-list">
                {[
                  "Updated every Tuesday after the CFTC release",
                  "Net positioning gauge for EURUSD, GBPUSD, XAUUSD, USDJPY, and more",
                  "52-week range bar — know if specs are near historical extremes",
                  "Bullish / bearish / neutral signal per instrument",
                  "Inverted pairs (USDJPY, USDCHF) handled correctly",
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>groups</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>COT Reports</span>
                  <span className="chip" style={{ marginLeft: "auto", fontSize: 11 }}>Tue update</span>
                </div>
                <div className="mock-body" style={{ display: "grid", gap: 12 }}>
                  <div className="mock-tile">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700, fontSize: 15 }}>GOLD</span><span className="chip" style={{ fontSize: 11 }}>Bullish</span></div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 8 }}><span className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--teal-dark)" }}>+184.0K</span><span className="mono" style={{ fontSize: 12, color: "var(--teal-dark)" }}>▲ 12.5K w/w</span></div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-dim)", margin: "10px 0 5px" }}>52-week range · specs near top</div>
                    <div style={{ position: "relative", height: 8, borderRadius: 99, background: "var(--bg-soft)" }}><div style={{ position: "absolute", left: "78%", top: -2, width: 4, height: 12, borderRadius: 99, background: "var(--teal)" }} /></div>
                  </div>
                  <div className="mock-tile">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700, fontSize: 15 }}>USDJPY</span><span className="chip coral" style={{ fontSize: 11 }}>Bearish</span></div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 8 }}><span className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--coral-dark)" }}>−18.5K</span><span className="mono" style={{ fontSize: 12, color: "var(--coral-dark)" }}>▼ 5.2K w/w · inverted</span></div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-dim)", margin: "10px 0 5px" }}>52-week range · specs near bottom</div>
                    <div style={{ position: "relative", height: 8, borderRadius: 99, background: "var(--bg-soft)" }}><div style={{ position: "absolute", left: "22%", top: -2, width: 4, height: 12, borderRadius: 99, background: "var(--coral)" }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Gavo AI */}
          <div className="feature-row" id="gavo" style={{ scrollMarginTop: 90, marginTop: 96 }}>
            <div className="feature-text reveal">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">auto_awesome</span></div>
                <span className="chip gold" style={{ fontSize: 11 }}>AI coaching</span>
              </div>
              <h3>Gavo AI Trade Review</h3>
              <p className="lead">Your always-on trading coach. Grade any trade from your journal — Gavo checks it against the full SMC rulebook and gives you a structured debrief.</p>
              <ul className="feature-list">
                {[
                  "Grades A+, A, B, C, or D against 8 SMC rules",
                  "Verdict sentence — what made or broke this trade",
                  "What you did well vs what to improve",
                  "One actionable tip per review",
                  "Re-runnable — run on any closed trade at any time",
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="card" style={{ padding: 20, background: "linear-gradient(165deg, rgba(8,174,170,0.1), rgba(22,114,161,0.05))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,var(--teal),var(--navy))", color: "#fff", display: "grid", placeItems: "center" }}>
                    <span className="material-symbols-rounded ic-fill" style={{ fontSize: 18 }}>auto_awesome</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Gavo AI Review</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>Graded against 8 SMC rules</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--teal)", color: "#fff", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>A</div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.4 }}>&quot;Clean liquidity sweep into a discount FVG — textbook patience.&quot;</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#fff", borderRadius: 11, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--teal-dark)", marginBottom: 6 }}>What worked</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-mid)", lineHeight: 1.5 }}>Waited for M5 CHoCH · SL beyond the sweep</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 11, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--coral-dark)", marginBottom: 6 }}>To improve</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-mid)", lineHeight: 1.5 }}>Scale out at TP1, trail the runner</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, padding: "11px 13px", background: "#fff", borderRadius: 11 }}>
                  <span className="material-symbols-rounded ic-fill" style={{ color: "var(--gold)", fontSize: 18 }}>lightbulb</span>
                  <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>Tip: mark the opposing liquidity before entry to plan your runner target.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Academy */}
          <div className="feature-row flip" id="academy" style={{ scrollMarginTop: 90, marginTop: 96 }}>
            <div className="feature-text reveal">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">school</span></div>
                <span className="chip" style={{ fontSize: 11 }}>Full curriculum</span>
              </div>
              <h3>Academy</h3>
              <p className="lead">6 structured courses from market structure basics to prop firm readiness. Video lessons + quizzes, all inside the platform.</p>
              <ul className="feature-list">
                {[
                  "Course 1: Market Structure & Basics",
                  "Course 2: Order Blocks, FVG, and POIs",
                  "Course 3: Sessions & Killzones",
                  "Course 4: Supply & Demand Framework",
                  "Course 5: Risk Management & Psychology",
                  "Course 6: Prop Firm Readiness",
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
              <Link className="link-arrow" href="/academy">Explore the Academy <span className="material-symbols-rounded">arrow_forward</span></Link>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>school</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>Academy</span>
                  <span className="chip" style={{ marginLeft: "auto", fontSize: 11 }}>27 lessons</span>
                </div>
                <div className="mock-body" style={{ display: "grid", gap: 8 }}>
                  {[
                    { label: "Course 1 · Market Structure", sub: "5 lessons · complete", state: "done" },
                    { label: "Course 2 · Order Blocks & FVG", sub: "7 lessons · in progress", state: "current" },
                    { label: "Course 3 · Sessions & Killzones", sub: "4 lessons · locked", state: "locked" },
                  ].map(({ label, sub, state }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 11, padding: 11, borderRadius: 10, opacity: state === "locked" ? 0.7 : 1, background: state === "current" ? "rgba(248,185,61,0.1)" : "var(--bg-soft)" }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: state === "current" ? "var(--gold)" : state === "done" ? "rgba(8,174,170,0.14)" : "var(--bg-tint)", display: "grid", placeItems: "center" }}>
                        <span className={`material-symbols-rounded ${state !== "locked" ? "ic-fill" : ""}`} style={{ color: state === "current" ? "var(--navy-deep)" : state === "done" ? "var(--teal)" : "var(--ink-dim)", fontSize: 17 }}>
                          {state === "done" ? "verified" : state === "current" ? "play_arrow" : "lock"}
                        </span>
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 7. FX Option Expiries */}
          <div className="feature-row" id="expiries" style={{ scrollMarginTop: 90, marginTop: 96 }}>
            <div className="feature-text reveal">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">calendar_month</span></div>
                <span className="chip" style={{ fontSize: 11 }}>Market intelligence</span>
              </div>
              <h3>FX Option Expiries</h3>
              <p className="lead">Large FX option expiries create price magnetism — knowing where they sit helps you anticipate sticky price levels and avoid fakeouts.</p>
              <ul className="feature-list">
                {[
                  "Daily expiry levels for EURUSD, GBPUSD, USDJPY, and USDCHF",
                  "Synced automatically from a third-party data source",
                  "Displayed on a calendar view by pair and date",
                  "Highlight expiries near key POIs",
                ].map(f => <li key={f}><span className="material-symbols-rounded">check_circle</span>{f}</li>)}
              </ul>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>calendar_month</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>FX Option Expiries</span>
                  <span className="chip" style={{ marginLeft: "auto", fontSize: 11 }}>10:00 NY cut</span>
                </div>
                <div className="mock-body" style={{ display: "grid", gap: 8 }}>
                  {[
                    { pair: "EURUSD", level: "1.0850", size: "€1.2B", near: true },
                    { pair: "USDJPY", level: "157.00", size: "$2.1B", near: false },
                    { pair: "GBPUSD", level: "1.2700", size: "£780M", near: false },
                    { pair: "USDCHF", level: "0.8950", size: "$640M", near: false },
                  ].map(({ pair, level, size, near }) => (
                    <div key={pair} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 10, background: near ? "rgba(8,174,170,0.08)" : "var(--bg-soft)", border: near ? "1px solid rgba(8,174,170,0.3)" : undefined }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 13, width: 64 }}>{pair}</span>
                      <span className="mono" style={{ fontSize: 13, flex: 1 }}>{level}</span>
                      <span className="chip" style={{ fontSize: 10 }}>{size}</span>
                      {near && <span className="chip" style={{ fontSize: 10, background: "rgba(248,185,61,0.16)", color: "var(--gold-dark)" }}>near POI</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="section soft">
        <div className="container">
          <CTACard
            heading="Start using every tool today"
            sub="Free to start. No credit card. Upgrade when you're ready for live alerts and AI review."
            primaryLabel="Create your free account"
            primaryHref="/signup"
            secondaryLabel="See pricing"
            secondaryHref="/pricing"
          />
        </div>
      </section>
    </>
  );
}
