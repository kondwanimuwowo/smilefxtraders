import type { Metadata } from "next";
import { Icon } from "@/components/ui";
import { ChartViz } from "@/components/marketing/ChartViz";
import { CTACard } from "@/components/marketing/CTACard";
import { FeatureBlock } from "@/components/marketing/FeatureBlock";

export const metadata: Metadata = {
  title: "Features | Smile FX Traders",
  description: "Every tool a disciplined trader needs: journal, rules validator, live alerts, COT reports, MacroEdge fundamentals, Gavo AI review, the Academy, and FX option expiries.",
};

export default function FeaturesPage() {
  return (
    <>
      {/* Dark hero */}
      <section className="dark py-32 pb-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Every tool a disciplined trader needs</h2>
            <p className="lead">Smile FX is built specifically for SMC and Supply &amp; Demand traders. One platform to journal, validate, follow, analyse, and learn.</p>
          </div>
          <div className="flex gap-2.5 flex-wrap mt-7">
            {[["#journal","Journal"],["#validator","Rules Validator"],["#alerts","Live Alerts"],["#cot","COT Reports"],["#macroedge","MacroEdge"],["#gavo","Gavo AI"],["#academy","Academy"],["#expiries","FX Expiries"]].map(([href, label]) => (
              <a key={href} href={href} className="feature-pill">{label}</a>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {/* 1. Journal */}
          <div className="feature-row scroll-mt-[90px]" id="journal">
            <FeatureBlock
              icon="menu_book"
              title="Trade Journal"
              lead="Log every trade with full context. Know your real edge: which pairs, sessions, and models actually make you money."
              bullets={[
                "Log entry, SL, TP, close price, model, session, and R:R",
                "Win rate by session (London, New York, Asia)",
                "Win rate by SMC model (OB+BOS, FVG sweep, SMT divergence…)",
                "Discipline score that tracks how often you followed all 8 rules",
                "AI review from Gavo: a structured debrief on any trade",
                "Equity curve built automatically from your closed trades",
              ]}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <Icon name="menu_book" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">Trade Journal</span>
                  <span className="chip ml-auto text-[11px]">+12.4R</span>
                </div>
                <div className="mock-body grid gap-[11px]">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="mock-tile"><div className="k">Win rate</div><div className="v">63%</div></div>
                    <div className="mock-tile"><div className="k">Avg win</div><div className="v text-[var(--teal-dark)]">+2.6R</div></div>
                    <div className="mock-tile"><div className="k">Discipline</div><div className="v text-[var(--gold-dark)]">91</div></div>
                  </div>
                  <div className="border border-line rounded-xl overflow-hidden">
                    {[
                      { pair: "XAUUSD", dir: "Long", model: "FVG sweep · London", pnl: "+3.1R", colorCls: "text-[var(--teal-dark)]" },
                      { pair: "USDJPY", dir: "Long", model: "OB+BOS · New York", pnl: "OPEN", colorCls: "text-[var(--gold-dark)]" },
                      { pair: "NAS100", dir: "Short", model: "SMT divergence · NY", pnl: "+4.0R", colorCls: "text-[var(--teal-dark)]" },
                    ].map(({ pair, dir, model, pnl, colorCls }, i) => (
                      <div key={pair} className={`flex items-center gap-2.5 py-2.5 px-[13px] ${i < 2 ? "border-b border-line" : ""}`}>
                        <span className="mono font-semibold text-[13px]">{pair}</span>
                        <span className={`chip text-[10px] ${dir === "Short" ? "badge-short" : "badge-long"}`}>{dir}</span>
                        <span className="truncate text-xs text-ink-mid flex-1 min-w-0">
                          {model}
                        </span>
                        <span className={`mono font-bold text-[13px] ${colorCls}`}>{pnl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Validator */}
          <div className="feature-row flip scroll-mt-[90px] mt-24" id="validator">
            <FeatureBlock
              icon="rule"
              title="Rules Validator"
              lead="A 5-minute checklist that keeps impulsive trades off the books. Check all 8 SMC or Supply &amp; Demand rules before clicking execute."
              bullets={[
                "SMC and Supply & Demand frameworks",
                "8 pre-trade questions: HTF bias, POI confluence, BOS, session, risk",
                "Pip calculator auto-fills from your account size and risk %",
                "One-click export to journal, pre-filled with pair, direction, model, R:R",
                "Grade-based result (A+ to D) with a pass/fail badge",
              ]}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <Icon name="rule" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">Rules Validator</span>
                  <span className="chip ml-auto text-[11px]">8 rules</span>
                </div>
                <div className="mock-body grid gap-[9px]">
                  <div className="flex items-center gap-[11px] p-[13px] bg-[rgba(8,174,170,0.1)] border border-[rgba(8,174,170,0.4)] rounded-xl">
                    <Icon name="verified" size={32} className="text-teal" />
                    <div>
                      <div className="font-bold text-[17px]">A+ · Pass</div>
                      <div className="text-[12.5px] text-ink-mid">XAUUSD · Long · 8 / 8 rules met</div>
                    </div>
                    <div className="ml-auto text-center">
                      <div className="mono text-[22px] font-bold text-[var(--teal-dark)]">A+</div>
                      <div className="text-[10px] text-ink-dim">grade</div>
                    </div>
                  </div>
                  <div className="grid gap-[7px]">
                    {["HTF bias clear · trading the draw","POI confluence · OB + FVG overlap","Within London killzone · risk 0.5%"].map(r => (
                      <div key={r} className="flex items-center gap-[9px] text-[13px]">
                        <Icon name="check_circle" size={18} className="text-teal" /> {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Live Alerts */}
          <div className="feature-row scroll-mt-[90px] mt-24" id="alerts">
            <FeatureBlock
              icon="notifications_active"
              title="Live Setup Alerts"
              lead="Follow Kondwani's live calls in real time. Each alert includes pair, direction, entry, SL/TP, the SMC model used, and a setup note."
              bullets={[
                "Posted every trading day during London and New York sessions",
                "All alerts validated against the SMC rulebook before posting",
                "Tap 'Copy to journal' to log any alert as your own trade",
                "Filter by pair or model",
                "Free plan shows a 4-hour delay; Pro subscribers see alerts live",
              ]}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="avatar avatar-ring w-[30px] h-[30px] text-xs bg-[linear-gradient(135deg,#1672A1,#0B425D)]">K</span>
                  <span className="font-bold text-[13px] ml-1">Kondwani</span>
                  <span className="chip gold text-[10px]">LEAD INSTRUCTOR</span>
                  <span className="ml-auto inline-flex items-center gap-[5px] text-[11px] font-extrabold text-coral">
                    <span className="w-[7px] h-[7px] rounded-full bg-coral inline-block" />LIVE
                  </span>
                </div>
                <div className="mock-body">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="mono text-[15px] font-bold">XAUUSD</span>
                    <span className="chip badge-long text-[11px]"><Icon name="trending_up" size={13} /> Long</span>
                    <span className="chip text-[11px]">FVG sweep</span>
                  </div>
                  <ChartViz seed={42} n={32} drift={0.05} h={150} />
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <div className="mock-tile p-[9px_11px]"><div className="k">Entry</div><div className="v text-sm">2,331.50</div></div>
                    <div className="mock-tile p-[9px_11px]"><div className="k">Stop</div><div className="v text-sm text-[var(--coral-dark)]">2,326.10</div></div>
                    <div className="mock-tile p-[9px_11px]"><div className="k">TP1</div><div className="v text-sm text-[var(--teal-dark)]">2,344.00</div></div>
                    <div className="mock-tile p-[9px_11px]"><div className="k">R:R</div><div className="v text-sm text-[var(--gold-dark)]">3.1R</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. COT Reports */}
          <div className="feature-row flip scroll-mt-[90px] mt-24" id="cot">
            <FeatureBlock
              icon="groups"
              title="COT Reports"
              lead="See what large speculators and commercials are doing in the futures market, straight from the CFTC's Commitment of Traders report."
              bullets={[
                "Updated every Tuesday after the CFTC release",
                "Net positioning gauge for EURUSD, GBPUSD, XAUUSD, USDJPY, and more",
                "52-week range bar to show when specs are near historical extremes",
                "Bullish / bearish / neutral signal per instrument",
                "Inverted pairs (USDJPY, USDCHF) handled correctly",
              ]}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <Icon name="groups" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">COT Reports</span>
                  <span className="chip ml-auto text-[11px]">Tue update</span>
                </div>
                <div className="mock-body grid gap-3">
                  <div className="mock-tile">
                    <div className="flex justify-between items-center"><span className="font-bold text-[15px]">GOLD</span><span className="chip text-[11px]">Bullish</span></div>
                    <div className="flex items-end gap-2.5 mt-2"><span className="mono text-xl font-bold text-[var(--teal-dark)]">+184.0K</span><span className="mono text-xs text-[var(--teal-dark)]">▲ 12.5K w/w</span></div>
                    <div className="text-[10.5px] text-ink-dim my-2.5 mb-[5px]">52-week range · specs near top</div>
                    <div className="relative h-2 rounded-full bg-[var(--bg-soft)]"><div className="absolute -top-0.5 w-1 h-3 rounded-full bg-teal left-[78%]" /></div>
                  </div>
                  <div className="mock-tile">
                    <div className="flex justify-between items-center"><span className="font-bold text-[15px]">USDJPY</span><span className="chip coral text-[11px]">Bearish</span></div>
                    <div className="flex items-end gap-2.5 mt-2"><span className="mono text-xl font-bold text-[var(--coral-dark)]">−18.5K</span><span className="mono text-xs text-[var(--coral-dark)]">▼ 5.2K w/w · inverted</span></div>
                    <div className="text-[10.5px] text-ink-dim my-2.5 mb-[5px]">52-week range · specs near bottom</div>
                    <div className="relative h-2 rounded-full bg-[var(--bg-soft)]"><div className="absolute -top-0.5 w-1 h-3 rounded-full bg-coral left-[22%]" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. MacroEdge */}
          <div className="feature-row scroll-mt-[90px] mt-24" id="macroedge">
            <FeatureBlock
              icon="analytics"
              title="MacroEdge"
              lead="Know why a currency is strong or weak before the chart shows it. A weighted fundamental score per currency, built from interest rates, inflation, employment, and more, cross-checked against your Trend Matrix and COT positioning."
              bullets={[
                "Weighted fundamental score per currency (USD, EUR, GBP, NZD)",
                "Pair bias from Strong Buy to Strong Sell, from the score differential",
                "Confluence check against Trend Matrix and COT: agree or conflict",
                "Gavo narrates the reasoning behind every currency and pair",
                "Bias-flip alerts the moment a pair's fundamental read changes",
                "Curated economic news feed, tagged by currency",
              ]}
              cta={{ label: "Explore MacroEdge", href: "/macroedge", variant: "link" }}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <Icon name="analytics" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">MacroEdge</span>
                  <span className="chip ml-auto text-[11px]">EURUSD</span>
                </div>
                <div className="mock-body grid gap-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="mock-tile"><div className="k">USD score</div><div className="v text-[var(--teal-dark)]">+8.0</div></div>
                    <div className="mock-tile"><div className="k">EUR score</div><div className="v text-[var(--coral-dark)]">−3.0</div></div>
                  </div>
                  <div className="flex items-center gap-[11px] p-[13px] bg-[rgba(234,82,61,0.08)] border border-[rgba(234,82,61,0.3)] rounded-xl">
                    <Icon name="trending_down" size={28} className="text-coral" />
                    <div>
                      <div className="font-bold text-[15px]">Strong Sell EURUSD</div>
                      <div className="text-[12px] text-ink-mid">Differential −11.0 · agrees with Trend Matrix</div>
                    </div>
                  </div>
                  <div className="grid gap-[7px]">
                    {["10Y yield gap widening in USD's favour", "Trend Matrix: bearish · 4/5 timeframes", "COT: commercials net short EUR"].map((r) => (
                      <div key={r} className="flex items-center gap-[9px] text-[13px]">
                        <Icon name="check_circle" size={18} className="text-teal" /> {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Gavo AI */}
          <div className="feature-row flip scroll-mt-[90px] mt-24" id="gavo">
            <FeatureBlock
              icon="auto_awesome"
              title="Gavo AI Trade Review"
              lead="Your always-on trading coach. Grade any trade from your journal. Gavo checks it against the full SMC rulebook and gives you a structured debrief."
              bullets={[
                "Grades A+, A, B, C, or D against 8 SMC rules",
                "Verdict sentence: what made or broke this trade",
                "What you did well vs what to improve",
                "One actionable tip per review",
                "Re-runnable on any closed trade at any time",
              ]}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="card p-5 bg-[linear-gradient(165deg,rgba(8,174,170,0.1),rgba(22,114,161,0.05))]">
                <div className="flex items-center gap-[11px] mb-3.5">
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[linear-gradient(135deg,var(--teal),var(--navy))] text-white grid place-items-center">
                    <Icon name="auto_awesome" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">Gavo AI Review</div>
                    <div className="text-[11.5px] text-ink-dim">Graded against 8 SMC rules</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="w-[46px] h-[46px] rounded-xl bg-teal text-white grid place-items-center font-display text-xl font-bold">A</div>
                  <div className="text-[14.5px] font-semibold leading-[1.4]">&quot;Clean liquidity sweep into a discount FVG. Textbook patience.&quot;</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-[11px] p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--teal-dark)] mb-1.5">What worked</div>
                    <div className="text-[12.5px] text-ink-mid leading-[1.5]">Waited for M5 CHoCH · SL beyond the sweep</div>
                  </div>
                  <div className="bg-white rounded-[11px] p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--coral-dark)] mb-1.5">To improve</div>
                    <div className="text-[12.5px] text-ink-mid leading-[1.5]">Scale out at TP1, trail the runner</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 mt-3 py-[11px] px-[13px] bg-white rounded-[11px]">
                  <Icon name="lightbulb" size={18} className="text-gold" />
                  <span className="text-[13px] text-ink leading-[1.5]">Tip: mark the opposing liquidity before entry to plan your runner target.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Academy */}
          <div className="feature-row scroll-mt-[90px] mt-24" id="academy">
            <FeatureBlock
              icon="school"
              title="Academy"
              lead="6 structured courses from market structure basics to prop firm readiness. Video lessons + quizzes, all inside the platform."
              bullets={[
                "Course 1: Market Structure & Basics",
                "Course 2: Order Blocks, FVG, and POIs",
                "Course 3: Sessions & Killzones",
                "Course 4: Supply & Demand Framework",
                "Course 5: Risk Management & Psychology",
                "Course 6: Prop Firm Readiness",
              ]}
              cta={{ label: "Explore the Academy", href: "/academy", variant: "link" }}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <Icon name="school" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">Academy</span>
                  <span className="chip ml-auto text-[11px]">27 lessons</span>
                </div>
                <div className="mock-body grid gap-2">
                  {[
                    { label: "Course 1 · Market Structure", sub: "5 lessons · complete", state: "done" },
                    { label: "Course 2 · Order Blocks & FVG", sub: "7 lessons · in progress", state: "current" },
                    { label: "Course 3 · Sessions & Killzones", sub: "4 lessons · locked", state: "locked" },
                  ].map(({ label, sub, state }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-[11px] p-[11px] rounded-[10px] ${state === "locked" ? "opacity-70" : "opacity-100"} ${state === "current" ? "bg-[rgba(248,185,61,0.1)]" : "bg-[var(--bg-soft)]"}`}
                    >
                      <span
                        className={`w-[30px] h-[30px] rounded-lg grid place-items-center ${
                          state === "current" ? "bg-gold" : state === "done" ? "bg-[rgba(8,174,170,0.14)]" : "bg-[var(--bg-tint)]"
                        }`}
                      >
                        <Icon
                          name={state === "done" ? "verified" : state === "current" ? "play_arrow" : "lock"}
                          size={17}
                          className={state === "current" ? "text-navy-deep" : state === "done" ? "text-teal" : "text-ink-dim"}
                        />
                      </span>
                      <div className="flex-1">
                        <div className="text-[13.5px] font-semibold">{label}</div>
                        <div className="text-[11.5px] text-ink-dim">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 8. FX Option Expiries */}
          <div className="feature-row flip scroll-mt-[90px] mt-24" id="expiries">
            <FeatureBlock
              icon="calendar_month"
              title="FX Option Expiries"
              lead="Large FX option expiries create price magnetism. Knowing where they sit helps you anticipate sticky price levels and avoid fakeouts."
              bullets={[
                "Daily expiry levels for EURUSD, GBPUSD, USDJPY, and USDCHF",
                "Synced automatically from a third-party data source",
                "Displayed on a calendar view by pair and date",
                "Highlight expiries near key POIs",
              ]}
            />
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <Icon name="calendar_month" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">FX Option Expiries</span>
                  <span className="chip ml-auto text-[11px]">10:00 NY cut</span>
                </div>
                <div className="mock-body grid gap-2">
                  {[
                    { pair: "EURUSD", level: "1.0850", size: "€1.2B", near: true },
                    { pair: "USDJPY", level: "157.00", size: "$2.1B", near: false },
                    { pair: "GBPUSD", level: "1.2700", size: "£780M", near: false },
                    { pair: "USDCHF", level: "0.8950", size: "$640M", near: false },
                  ].map(({ pair, level, size, near }) => (
                    <div
                      key={pair}
                      className={`flex items-center gap-2.5 py-[11px] px-[13px] rounded-[10px] ${near ? "bg-[rgba(8,174,170,0.08)] border border-[rgba(8,174,170,0.3)]" : "bg-[var(--bg-soft)]"}`}
                    >
                      <span className="mono font-bold text-[13px] w-16">{pair}</span>
                      <span className="mono text-[13px] flex-1">{level}</span>
                      <span className="chip text-[10px]">{size}</span>
                      {near && <span className="chip text-[10px] bg-[rgba(248,185,61,0.16)] text-[var(--gold-dark)]">near POI</span>}
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
            primaryHardNav
            secondaryLabel="See pricing"
            secondaryHref="/pricing"
          />
        </div>
      </section>
    </>
  );
}
