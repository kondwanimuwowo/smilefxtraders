import type { Metadata } from "next";
import { Icon, GavoIcon } from "@/components/ui";
import { ChartViz } from "@/components/marketing/ChartViz";
import { CTACard } from "@/components/marketing/CTACard";
import { FeatureBlock } from "@/components/marketing/FeatureBlock";

export const metadata: Metadata = {
  title: "Features | Smile FX Traders",
  description: "Every tool a disciplined trader needs: journal, rules validator, live alerts, COT reports, MacroEdge fundamentals, Gavo AI review, and the Academy.",
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
            {[["#journal","Journal"],["#validator","Rules Validator"],["#alerts","Live Alerts"],["#cot","COT Reports"],["#macroedge","MacroEdge"],["#gavo","Gavo AI"],["#academy","Academy"]].map(([href, label]) => (
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
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/journal.jpg" alt="Smile FX Traders trade journal" className="w-full h-auto block" />
              </div>
            </div>
          </div>

          {/* 2. Validator */}
          <div className="feature-row flip scroll-mt-[90px] mt-24" id="validator">
            <FeatureBlock
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
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/rules-validator.jpg" alt="Smile FX Traders rules validator" className="w-full h-auto block" />
              </div>
            </div>
          </div>

          {/* 3. Live Alerts */}
          <div className="feature-row scroll-mt-[90px] mt-24" id="alerts">
            <FeatureBlock
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/kondwanimuwowo.png" alt="Kondwani" className="avatar avatar-ring w-[30px] h-[30px] object-cover" />
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
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cot-details.jpg" alt="Smile FX Traders COT report detail" className="w-full h-auto block" />
              </div>
            </div>
          </div>

          {/* 5. MacroEdge */}
          <div className="feature-row scroll-mt-[90px] mt-24" id="macroedge">
            <FeatureBlock
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
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/eurusd-pair.jpg" alt="Smile FX Traders pair bias, cross-checked against Trend Matrix and COT" className="w-full h-auto block" />
              </div>
            </div>
          </div>

          {/* 6. Gavo AI */}
          <div className="feature-row flip scroll-mt-[90px] mt-24" id="gavo">
            <FeatureBlock
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
              <div className="mock">
                <div className="mock-bar">
                  <GavoIcon size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">Gavo AI Review</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/gavo-review.jpg" alt="Gavo AI trade review" className="w-full h-auto block" />
              </div>
            </div>
          </div>

          {/* 7. Academy */}
          <div className="feature-row scroll-mt-[90px] mt-24" id="academy">
            <FeatureBlock
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
