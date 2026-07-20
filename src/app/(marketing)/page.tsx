import type { Metadata } from "next";
import Link from "next/link";
import { Button, Icon, GavoIcon } from "@/components/ui";
import { CTACard } from "@/components/marketing/CTACard";
import { MarketingCard } from "@/components/marketing/MarketingCard";
import { FeatureBlock } from "@/components/marketing/FeatureBlock";
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
        className="dark py-32 pb-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]"
      >
        <div className="container">
          <div className="hero-grid grid grid-cols-[1.05fr_1fr] gap-14 items-center">
            {/* Left */}
            <div>
              <h1
                className="reveal mt-[18px] leading-[1.18] text-white font-display font-extrabold tracking-[-0.01em] text-[clamp(32px,4vw,54px)]"
                data-delay="60"
              >
                Trade Smart Money<br />
                Together
              </h1>
              <p
                className="reveal text-[15px] text-white/76 mt-[22px] max-w-[520px] leading-[1.6]"
                data-delay="120"
              >
                A professional trading desk for SMC and Supply &amp; Demand traders. Journal your edge, validate every setup, and follow live calls from Kondwani.
              </p>
              <div className="reveal flex gap-3.5 mt-8 flex-wrap" data-delay="180">
                <Button href="/signup" hardNav size="lg" iconRight="arrow_forward">Start for free</Button>
              </div>
            </div>

            {/* Right: Hero chart mock */}
            <div className="reveal relative flex items-center justify-center" data-delay="160">
              {/* Glow — echoes the hero's own radial gradients */}
              <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(ellipse_at_50%_50%,rgba(48,232,223,0.35)_0%,transparent_70%)] blur-3xl" aria-hidden="true" />
              <div className="mock relative w-full max-w-[480px] shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
                <div className="mock-bar">
                  <Icon name="candlestick_chart" size={18} className="text-teal" />
                  <span className="font-semibold text-[13px] ml-1">Market Structure</span>
                  <span className="chip ml-auto text-[11px]">
                    <span className="size-1.5 rounded-full bg-teal-bright animate-live" />
                    Live
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/candles-smc.png"
                  alt="Annotated candlestick chart showing break of market structure, change of character, fair value gap, and order block"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOOLKIT ===== */}
      <section className="section">
        <div className="container">
          <div className="sec-head center reveal">
<h2>Everything you need to trade with discipline</h2>
            <p className="lead">Built for SMC and Supply &amp; Demand traders who take their craft seriously.</p>
          </div>
          <div className="grid g3 auto-rows-fr mt-14">
            {[
              { icon: "menu_book",            title: "Trade Journal",       desc: "Log every trade with full context: entry, SL, TP, model, session, R:R. Find your edge through session analytics and model win-rates." },
              { icon: "rule",                 title: "Rules Validator",     desc: "Walk any idea through the SMC checklist before you click. Get a clear A+ / Wait / No-Trade verdict." },
              { icon: "notifications_active", title: "Live Alerts",         desc: "Kondwani posts validated setups in real time, with the full reasoning. Copy any alert straight to your journal." },
              { icon: undefined, iconNode: <GavoIcon size={32} />, title: "Gavo AI Review", desc: "Your AI trading coach grades every trade against the SMC rulebook with a structured verdict: what was good, what to improve." },
              { icon: "analytics",            title: "MacroEdge",           desc: "A weighted fundamental score per currency, cross-checked against Trend Matrix and COT, so you know why a pair is biased before the chart shows it." },
              { icon: "school",               title: "Academy",             desc: "A six-level SMC curriculum taught in order, from market structure foundations to prop-firm readiness." },
            ].map((tool, i) => (
              <MarketingCard
                key={tool.title}
                icon={tool.icon}
                iconNode={tool.iconNode}
                title={tool.title}
                description={tool.desc}
                className="reveal h-full flex flex-col"
                dataDelay={(i % 3) * 80}
              />
            ))}
          </div>
          <div className="flex justify-center mt-10 reveal">
            <Button href="/features" size="lg" variant="ghost" iconRight="arrow_forward">
              Explore all features
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FEATURE DETAILS ===== */}
      <section className="section soft">
        <div className="container">
          {/* Journal */}
          <div className="feature-row">
            <FeatureBlock
              title="Journal every trade"
              lead="Stop guessing what works. Tag each entry to its model, session, and confluences, then let the analytics show you which setups actually pay, and which mistakes keep costing you."
              bullets={[
                "Win-rate and expectancy by SMC model",
                "Discipline score that holds you accountable",
                "AI trade review graded against your rules",
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

          {/* Validator */}
          <div className="feature-row flip">
            <FeatureBlock
              title="Validate before you risk."
              lead="Discipline beats prediction. Walk your idea through the SMC checklist (HTF bias, liquidity, structure shift, POI, risk) and get an honest verdict. No confluence, no trade."
              bullets={[
                "Built on liquidity → FVG / OB → CHoCH logic",
                "Confluence score and clear A+ / Wait / No-Trade call",
                "Send validated setups straight to your journal",
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

          {/* MacroEdge */}
          <div className="feature-row">
            <FeatureBlock
              title="Know why a pair is biased"
              lead="A weighted fundamental score per currency, cross-checked against Trend Matrix and COT, so you know the reasoning behind a bias before the chart shows it."
              bullets={[
                "Weighted fundamental score per currency",
                "Pair bias from Strong Buy to Strong Sell",
                "Gavo narrates the reasoning behind every read",
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

          {/* Gavo AI Review */}
          <div className="feature-row flip">
            <FeatureBlock
              title="Your AI coach, on every trade"
              lead="After logging a trade, ask Gavo for a review. He grades it against the full SMC rulebook and gives you a structured debrief, not just a pat on the back."
              bullets={[
                "Grades A+ to D against 8 SMC rules",
                "What you did well vs what to improve",
                "One actionable tip per review",
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
        </div>
      </section>

      {/* ===== INSTRUCTOR ===== */}
      <section className="section">
        <div className="container">
          <div className="instr-grid">
            <div className="reveal relative">
              <div className="rounded-3xl overflow-hidden aspect-[4/5] bg-[linear-gradient(165deg,#0C4359_0%,#082A3B_78%)] relative shadow-[var(--shadow-card-lg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kondwanimuwowo.png" alt="Kondwani" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <div className="eyebrow reveal">Lead Instructor</div>
              <h2 className="reveal mt-4 text-[clamp(28px,3.4vw,40px)]" data-delay="60">Kondwani</h2>
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
            <h2>Pricing</h2>
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

          {/* Lifetime access */}
          <div className="reveal text-center mt-8">
            <Button href="mailto:support@smilefxtraders.com" hardNav size="lg" variant="ghost">
              Need lifetime access? Contact our sales team
            </Button>
          </div>

          <div className="reveal text-center mt-6">
            <Link href="/pricing" className="link-arrow text-[15px]">
              See full pricing &amp; FAQ <Icon name="arrow_forward" />
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
            primaryHardNav
            secondaryLabel="See pricing"
            secondaryHref="/pricing"
          />
        </div>
      </section>
    </main>
  );
}
