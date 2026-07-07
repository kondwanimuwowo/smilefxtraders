import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ChartViz } from "@/components/marketing/ChartViz";
import { CTACard } from "@/components/marketing/CTACard";
import { MarketingPlanCard } from "@/components/pricing/MarketingPlanCard";
import { PLAN_META } from "@/lib/plans";
import { getPlanPrices } from "@/lib/server/getPlanPrices";

export const metadata: Metadata = {
  title: "Smile FX Traders | Trade Smart Money, Together",
  description:
    "A professional trading desk for SMC and Supply & Demand traders. Journal your edge, validate every setup, and follow live calls from Kondwani.",
};

export default async function HomePage() {
  const prices = await getPlanPrices();
  return (
    <main>
      {/* ===== HERO ===== */}
      <section
        className="dark"
        style={{ padding: "128px 0 96px", background: "radial-gradient(ellipse at 12% 18%, rgba(8,174,170,0.45) 0%, transparent 52%), radial-gradient(ellipse at 88% 88%, rgba(248,185,61,0.32) 0%, transparent 48%), linear-gradient(155deg, #0C4E6B 0%, #082A3B 60%)" }}
      >
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: "56px", alignItems: "center" }} className="hero-grid">
            {/* Left */}
            <div>
              <h1
                className="reveal mt-[18px] leading-[1.18] text-white font-display font-extrabold tracking-[-0.01em]"
                data-delay="60"
                style={{ fontSize: "clamp(32px,4vw,54px)" }}
              >
                Trade Smart Money<br />
                <span className="text-teal-bright">Together</span>
              </h1>
              <p
                className="reveal text-[15px] text-white/76 mt-[22px] max-w-[520px] leading-[1.6]"
                data-delay="120"
              >
                A professional trading desk for SMC and Supply &amp; Demand traders. Journal your edge, validate every setup, and follow live calls from Kondwani.
              </p>
              <div className="reveal flex gap-3.5 mt-8 flex-wrap" data-delay="180">
                <Button href="/signup" size="lg" iconRight="arrow_forward">Start for free</Button>
              </div>
            </div>

            {/* Right: Hero illustration */}
            <div className="reveal flex items-center justify-center" data-delay="160">
              <img
                src="/hero-illustration.svg"
                alt=""
                aria-hidden="true"
                className="w-full max-w-[480px] h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOOLKIT ===== */}
      <section className="section">
        <div className="container">
          <div className="sec-head center reveal">
<h2>Everything you need to trade with discipline</h2>
            <div className="rule" />
            <p className="lead">Built for SMC and Supply &amp; Demand traders who take their craft seriously.</p>
          </div>
          <div className="grid g3 auto-rows-fr" style={{ marginTop: 56 }}>
            {[
              { icon: "menu_book",            title: "Trade Journal",       desc: "Log every trade with full context: entry, SL, TP, model, session, R:R. Find your edge through session analytics and model win-rates.", href: "/features#journal" },
              { icon: "rule",                 title: "Rules Validator",     desc: "Walk any idea through the SMC checklist before you click. Get a clear A+ / Wait / No-Trade verdict.", href: "/features#validator" },
              { icon: "notifications_active", title: "Live Alerts",         desc: "Kondwani posts validated setups in real time, with the full reasoning. Copy any alert straight to your journal.", href: "/features#alerts" },
              { icon: "bar_chart",            title: "COT Reports",         desc: "Weekly institutional positioning from the CFTC Commitments of Traders report: large specs, commercials, and net positioning.", href: "/features#cot" },
              { icon: "auto_awesome",         title: "Gavo AI Review",      desc: "Your AI trading coach grades every trade against the SMC rulebook with a structured verdict: what was good, what to improve.", href: "/features#gavo" },
              { icon: "school",               title: "Academy",             desc: "A six-level SMC curriculum taught in order, from market structure foundations to prop-firm readiness.", href: "/learn" },
            ].map((tool, i) => (
              <div key={tool.title} className="card tool-card reveal h-full flex flex-col" data-delay={i % 3 * 80}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="icon-chip shrink-0">
                    <span className="material-symbols-rounded text-[32px] leading-none translate-y-[2px]">{tool.icon}</span>
                  </div>
                  <h3 className="m-0 font-bold">{tool.title}</h3>
                </div>
                <p>{tool.desc}</p>
                <Link href={tool.href} className="link-arrow mt-auto pt-3">
                  Learn more <span className="material-symbols-rounded translate-y-[2px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURE DETAILS ===== */}
      <section className="section soft">
        <div className="container">
          {/* Journal */}
          <div className="feature-row">
            <div className="feature-text reveal">
              <div className="eyebrow">Journal</div>
              <h3>Journal every trade. Find your edge.</h3>
              <p className="lead">Stop guessing what works. Tag each entry to its model, session, and confluences, then let the analytics show you which setups actually pay, and which mistakes keep costing you.</p>
              <ul className="feature-list">
                <li><span className="material-symbols-rounded">check_circle</span> Win-rate and expectancy by SMC model</li>
                <li><span className="material-symbols-rounded">check_circle</span> Discipline score that holds you accountable</li>
                <li><span className="material-symbols-rounded">check_circle</span> AI trade review graded against your rules</li>
              </ul>
              <Button href="/signup" size="lg" iconRight="arrow_forward">Open the journal</Button>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded text-teal text-[18px]">menu_book</span>
                  <span className="font-semibold text-[13px] ml-1">Trade Journal</span>
                </div>
                <div className="mock-body grid gap-2.5">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="mock-tile"><div className="k">Win rate</div><div className="v">—</div></div>
                    <div className="mock-tile"><div className="k">Net R</div><div className="v text-[var(--teal-dark)]">—</div></div>
                    <div className="mock-tile"><div className="k">Discipline</div><div className="v text-[var(--gold-dark)]">—</div></div>
                  </div>
                  <ChartViz seed={11} n={34} drift={0.06} h={150} annot={false} />
                </div>
              </div>
            </div>
          </div>

          {/* Validator */}
          <div className="feature-row flip">
            <div className="feature-text reveal">
              <div className="eyebrow">Rules Validator</div>
              <h3>Validate before you risk.</h3>
              <p className="lead">Discipline beats prediction. Walk your idea through the SMC checklist (HTF bias, liquidity, structure shift, POI, risk) and get an honest verdict. No confluence, no trade.</p>
              <ul className="feature-list">
                <li><span className="material-symbols-rounded">check_circle</span> Built on liquidity → FVG / OB → CHoCH logic</li>
                <li><span className="material-symbols-rounded">check_circle</span> Confluence score and clear A+ / Wait / No-Trade call</li>
                <li><span className="material-symbols-rounded">check_circle</span> Send validated setups straight to your journal</li>
              </ul>
              <Link href="/features#validator" className="link-arrow">
                See how it works <span className="material-symbols-rounded">arrow_forward</span>
              </Link>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="mock">
                <div className="mock-bar">
                  <span className="material-symbols-rounded text-teal text-[18px]">rule</span>
                  <span className="font-semibold text-[13px] ml-1">Rules Validator</span>
                </div>
                <div className="mock-body grid gap-[9px]">
                  <div className="flex items-center gap-[11px] p-[13px] bg-[rgba(8,174,170,0.1)] border border-[rgba(8,174,170,0.4)] rounded-xl">
                    <span className="material-symbols-rounded ic-fill text-teal text-[32px]">verified</span>
                    <div>
                      <div className="font-bold text-[17px]">A+ Setup: Take it</div>
                      <div className="text-[12.5px] text-ink-mid">XAUUSD · Long · all rules met</div>
                    </div>
                  </div>
                  {["HTF bias clear · trading the draw", "Liquidity swept into discount FVG", "M5 CHoCH confirmed · 1:3 R:R"].map((t) => (
                    <div key={t} className="flex items-center gap-[9px] text-[13px]">
                      <span className="material-symbols-rounded ic-fill text-teal text-[18px]">check_circle</span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOCUS + FLOATING PAIRS ===== */}
      <section className="section">
        <style>{`
          @keyframes fxfloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .fx-wrap { position: relative; }
          .fx-float {
            position: absolute;
            font-weight: 600; color: var(--navy, #0B425D);
            font-feature-settings: "tnum";
            white-space: nowrap; animation: fxfloat 5s ease-in-out infinite;
          }
          .fx-float .up { color: var(--teal, #08AEAA); font-weight: 700; }
          .fx-float .down { color: var(--coral, #EA523D); font-weight: 700; }
        `}</style>
        <div className="container">
          <div className="feature-row">
            <div className="feature-text reveal">
              <div className="eyebrow">Stay focused</div>
              <h3>Tune out the noise. Trade your plan.</h3>
              <p className="lead">The market throws a hundred pairs and a thousand opinions at you every day. Smile FX keeps you anchored to the setups that fit your edge, and nothing else.</p>
              <Button href="/signup" size="lg" iconRight="arrow_forward">Start focused</Button>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="fx-wrap">
                <img src="/focus-illustration.svg" alt="" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }} />
                <div className="fx-float hidden sm:block" style={{ top: "4%", left: "4%", fontSize: 15, animationDelay: "0s" }}>
                  EUR/USD <span className="up">▲ 0.4%</span>
                </div>
                <div className="fx-float hidden sm:block" style={{ top: "12%", right: "2%", fontSize: 13, animationDelay: "1.2s" }}>
                  GBP/USD <span className="down">▼ 0.2%</span>
                </div>
                <div className="fx-float hidden sm:block" style={{ top: "40%", left: "0%", fontSize: 14, animationDelay: "0.6s" }}>
                  XAU/USD <span className="up">▲ 1.1%</span>
                </div>
                <div className="fx-float hidden sm:block" style={{ top: "48%", right: "0%", fontSize: 15, animationDelay: "1.8s" }}>
                  NZD/USD <span className="up">▲ 0.3%</span>
                </div>
                <div className="fx-float hidden sm:block" style={{ bottom: "14%", left: "8%", fontSize: 13, animationDelay: "2.4s" }}>
                  NAS100 <span className="up">▲ 0.7%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSTRUCTOR ===== */}
      <section className="section">
        <div className="container">
          <div className="instr-grid">
            <div className="reveal relative">
              <div className="rounded-3xl overflow-hidden aspect-[4/5] bg-[linear-gradient(165deg,#0C4359_0%,#082A3B_78%)] grid place-items-center relative shadow-[0_24px_60px_rgba(11,66,93,0.16)]">
                <div className="text-center text-white/55 p-6">
                  <span className="material-symbols-rounded text-[64px]">account_circle</span>
                </div>
              </div>
            </div>
            <div>
              <div className="eyebrow reveal">Lead Instructor</div>
              <h2 className="reveal mt-4" data-delay="60" style={{ fontSize: "clamp(28px,3.4vw,40px)" }}>Kondwani</h2>
              <div className="reveal w-14 h-1 rounded-full bg-coral mt-[18px]" data-delay="80" />
              <p className="reveal text-[17px] text-ink-mid mt-[22px] leading-[1.7]" data-delay="120">
                Live calls posted every trading day. Every alert is validated against the SMC rulebook before posting, so you know exactly why the setup qualifies. Kondwani teaches pure smart money: liquidity, fair-value gaps, order blocks, premium and discount, from first principles.
              </p>
              <blockquote className="reveal mt-6 py-[18px] px-[22px] bg-[var(--bg-soft)] rounded-[14px] flex gap-[13px]" data-delay="160">
                <span className="w-2 rounded-full bg-coral shrink-0" />
                <p className="text-base italic text-ink leading-[1.6]">&quot;I don&apos;t want to hand you fish. I want you to read the chart, follow your rules, and never need my signals again.&quot;</p>
              </blockquote>
              <div className="reveal flex gap-3.5 mt-[26px] flex-wrap" data-delay="200">
                <Button href="/about" size="lg" iconRight="arrow_forward">Read his story</Button>
                <Button href="/learn" size="lg" variant="ghost" icon="school">Browse the Academy</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING TEASER ===== */}
      <section className="section soft">
        <div className="container">
          <div className="sec-head center reveal mb-[52px]">
            <h2>Simple, transparent plans</h2>
            <p className="lead mt-3.5">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid g3 items-start">
            {PLAN_META.map((meta, i) => (
              <div key={meta.id} className="reveal" data-delay={i * 80}>
                <MarketingPlanCard
                  meta={meta}
                  prices={prices.find((p) => p.planId === meta.id)!}
                />
              </div>
            ))}
          </div>
          <div className="reveal text-center mt-9">
            <Link href="/pricing" className="link-arrow text-[15px]">
              See full pricing &amp; FAQ <span className="material-symbols-rounded">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section">
        <div className="container">
          <CTACard
            heading="Ready to trade with discipline?"
            sub="The Starter plan is free, forever. No credit card required."
            primaryLabel="Create your free account"
            primaryHref="/signup"
            secondaryLabel="See pricing"
            secondaryHref="/pricing"
          />
        </div>
      </section>
    </main>
  );
}
