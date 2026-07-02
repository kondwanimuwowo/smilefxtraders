import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ChartViz } from "@/components/marketing/ChartViz";
import { CTACard } from "@/components/marketing/CTACard";
import { MarketingPlanCard } from "@/components/pricing/MarketingPlanCard";
import { PLAN_META, DEFAULT_PRICES } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Smile FX Traders — Trade Smart Money, Together",
  description:
    "A professional trading desk for SMC and Supply & Demand traders. Journal your edge, validate every setup, and follow live calls from Kondwani.",
};

export default async function HomePage() {
  const rows = await prisma.planConfig.findMany();
  const byId = Object.fromEntries(rows.map((r) => [r.planId, r]));
  const prices: PlanPrices[] = DEFAULT_PRICES.map((d) => ({
    planId:     d.planId,
    monthlyZmw: byId[d.planId]?.monthlyZmw ?? d.monthlyZmw,
    annualZmw:  byId[d.planId]?.annualZmw  ?? d.annualZmw,
    monthlyUsd: byId[d.planId]?.monthlyUsd ?? d.monthlyUsd,
    annualUsd:  byId[d.planId]?.annualUsd  ?? d.annualUsd,
  }));
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
                className="reveal"
                data-delay="60"
                style={{ fontSize: "clamp(28px,3.8vw,46px)", margin: "18px 0 0", lineHeight: 1.18, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.01em" }}
              >
                Trade Smart Money<br />
                <span style={{ color: "var(--teal-bright)" }}>Together</span>
              </h1>
              <p
                className="reveal"
                data-delay="120"
                style={{ fontSize: 15, color: "rgba(255,255,255,0.76)", marginTop: 22, maxWidth: 520, lineHeight: 1.6 }}
              >
                A professional trading desk for SMC and Supply &amp; Demand traders. Journal your edge, validate every setup, and follow live calls from Kondwani.
              </p>
              <div
                className="reveal"
                data-delay="180"
                style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}
              >
                <Button href="/signup" size="lg" iconRight="arrow_forward">Start for free</Button>
              </div>
            </div>

            {/* Right: Hero illustration */}
            <div className="reveal" data-delay="160" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src="/hero-illustration.svg"
                alt=""
                aria-hidden="true"
                style={{ width: "100%", maxWidth: 480, height: "auto", display: "block" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOCUS + FLOATING PAIRS (preview) ===== */}
      <section className="section soft">
        <style>{`
          @keyframes fxfloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
          .fx-wrap { position: relative; }
          .fx-chip {
            position: absolute;
            display: flex; align-items: center; gap: 8px;
            padding: 8px 13px; border-radius: 999px;
            background: #fff; border: 1px solid rgba(8,174,170,0.28);
            box-shadow: 0 10px 26px rgba(11,66,93,0.14);
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 13px; font-weight: 600; color: var(--navy, #0B425D);
            white-space: nowrap; animation: fxfloat 4.5s ease-in-out infinite;
          }
          .fx-chip .dot { width: 8px; height: 8px; border-radius: 99px; background: var(--teal, #08AEAA); }
          .fx-chip .up { color: var(--teal, #08AEAA); font-weight: 700; }
          .fx-chip .down { color: var(--coral, #EA523D); font-weight: 700; }
        `}</style>
        <div className="container">
          <div className="feature-row">
            <div className="feature-text reveal">
              <div className="eyebrow">Stay focused</div>
              <h3>Tune out the noise. Trade your plan.</h3>
              <p className="lead">The market throws a hundred pairs and a thousand opinions at you every day. Smile FX keeps you anchored to the setups that fit your edge — and nothing else.</p>
              <Button href="/signup" size="lg" iconRight="arrow_forward">Start focused</Button>
            </div>
            <div className="feature-visual reveal" data-delay="120">
              <div className="fx-wrap">
                <img src="/focus-illustration.svg" alt="" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }} />
                <div className="fx-chip" style={{ top: "2%", left: "-2%", animationDelay: "0s" }}>
                  <span className="dot" /> EUR/USD <span className="up">▲ 0.4%</span>
                </div>
                <div className="fx-chip" style={{ top: "10%", right: "-3%", animationDelay: "1.2s" }}>
                  <span className="dot" /> GBP/USD <span className="down">▼ 0.2%</span>
                </div>
                <div className="fx-chip" style={{ top: "42%", left: "-6%", animationDelay: "0.6s" }}>
                  <span className="dot" /> XAU/USD <span className="up">▲ 1.1%</span>
                </div>
                <div className="fx-chip" style={{ top: "46%", right: "-4%", animationDelay: "1.8s" }}>
                  <span className="dot" /> NZD/USD <span className="up">▲ 0.3%</span>
                </div>
                <div className="fx-chip" style={{ bottom: "12%", left: "6%", animationDelay: "2.4s" }}>
                  <span className="dot" /> NAS100 <span className="up">▲ 0.7%</span>
                </div>
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
            <div className="rule" />
            <p className="lead">Built for SMC and Supply &amp; Demand traders who take their craft seriously.</p>
          </div>
          <div className="grid g3" style={{ marginTop: 56 }}>
            {[
              { icon: "menu_book",            title: "Trade Journal",       desc: "Log every trade with full context — entry, SL, TP, model, session, R:R. Find your edge through session analytics and model win-rates.", href: "/features#journal" },
              { icon: "rule",                 title: "Rules Validator",     desc: "Walk any idea through the SMC checklist before you click. Get a clear A+ / Wait / No-Trade verdict.", href: "/features#validator" },
              { icon: "notifications_active", title: "Live Alerts",         desc: "Kondwani posts validated setups in real time, with the full reasoning. Copy any alert straight to your journal.", href: "/features#alerts" },
              { icon: "bar_chart",            title: "COT Reports",         desc: "Weekly institutional positioning from the CFTC Commitments of Traders report — large specs, commercials, and net positioning.", href: "/features#cot" },
              { icon: "auto_awesome",         title: "Gavo AI Review",      desc: "Your AI trading coach grades every trade against the SMC rulebook with a structured verdict: what was good, what to improve.", href: "/features#gavo" },
              { icon: "school",               title: "Academy",             desc: "A six-level SMC curriculum taught in order, from market structure foundations to prop-firm readiness.", href: "/learn" },
            ].map((tool, i) => (
              <div key={tool.title} className="card tool-card reveal" data-delay={i % 3 * 80}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div className="icon-chip" style={{ flexShrink: 0 }}><span className="material-symbols-rounded">{tool.icon}</span></div>
                  <h3 style={{ margin: 0 }}>{tool.title}</h3>
                </div>
                <p>{tool.desc}</p>
                <Link href={tool.href} className="link-arrow">
                  Learn more <span className="material-symbols-rounded">arrow_forward</span>
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
              <p className="lead">Stop guessing what works. Tag each entry to its model, session, and confluences — then let the analytics show you which setups actually pay, and which mistakes keep costing you.</p>
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
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>menu_book</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>Trade Journal</span>
                </div>
                <div className="mock-body" style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    <div className="mock-tile"><div className="k">Win rate</div><div className="v">—</div></div>
                    <div className="mock-tile"><div className="k">Net R</div><div className="v" style={{ color: "var(--teal-dark)" }}>—</div></div>
                    <div className="mock-tile"><div className="k">Discipline</div><div className="v" style={{ color: "var(--gold-dark)" }}>—</div></div>
                  </div>
                  <ChartViz seed={11} n={34} drift={0.06} h={150} annot={false} />
                </div>
              </div>
            </div>
          </div>

          {/* Validator */}
          <div className="feature-row flip" style={{ marginTop: 88 }}>
            <div className="feature-text reveal">
              <div className="eyebrow">Rules Validator</div>
              <h3>Validate before you risk.</h3>
              <p className="lead">Discipline beats prediction. Walk your idea through the SMC checklist — HTF bias, liquidity, structure shift, POI, risk — and get an honest verdict. No confluence, no trade.</p>
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
                  <span className="material-symbols-rounded" style={{ color: "var(--teal)", fontSize: 18 }}>rule</span>
                  <span style={{ fontWeight: 600, fontSize: 13, marginLeft: 4 }}>Rules Validator</span>
                </div>
                <div className="mock-body" style={{ display: "grid", gap: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 13, background: "rgba(8,174,170,0.1)", border: "1px solid rgba(8,174,170,0.4)", borderRadius: 12 }}>
                    <span className="material-symbols-rounded ic-fill" style={{ color: "var(--teal)", fontSize: 32 }}>verified</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>A+ Setup — Take it</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-mid)" }}>XAUUSD · Long · all rules met</div>
                    </div>
                  </div>
                  {["HTF bias clear · trading the draw", "Liquidity swept into discount FVG", "M5 CHoCH confirmed · 1:3 R:R"].map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
                      <span className="material-symbols-rounded ic-fill" style={{ color: "var(--teal)", fontSize: 18 }}>check_circle</span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSTRUCTOR ===== */}
      <section className="section">
        <div className="container">
          <div style={{ display: "grid", gap: 56, alignItems: "center" }} className="instr-grid">
            <div className="reveal" style={{ position: "relative" }}>
              <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 60px rgba(11,66,93,0.16)", aspectRatio: "4/5", background: "linear-gradient(165deg, #0C4359 0%, #082A3B 78%)", display: "grid", placeItems: "center", position: "relative" }}>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", padding: 24 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 64 }}>account_circle</span>
                </div>
              </div>
            </div>
            <div>
              <div className="eyebrow reveal">Lead Instructor</div>
              <h2 className="reveal" data-delay="60" style={{ fontSize: "clamp(28px,3.4vw,40px)", marginTop: 16 }}>Kondwani</h2>
              <div className="reveal" data-delay="80" style={{ width: 56, height: 4, borderRadius: 99, background: "var(--coral)", marginTop: 18 }} />
              <p className="reveal" data-delay="120" style={{ fontSize: 17, color: "var(--ink-mid)", marginTop: 22, lineHeight: 1.7 }}>
                Live calls posted every trading day. Every alert is validated against the SMC rulebook before posting — so you know exactly why the setup qualifies. Kondwani teaches pure smart money: liquidity, fair-value gaps, order blocks, premium and discount, from first principles.
              </p>
              <blockquote className="reveal" data-delay="160" style={{ margin: "24px 0 0", padding: "18px 22px", background: "var(--bg-soft)", borderRadius: 14, display: "flex", gap: 13 }}>
                <span style={{ width: 8, borderRadius: 99, background: "var(--coral)", flexShrink: 0 }} />
                <p style={{ fontSize: 16, fontStyle: "italic", color: "var(--ink)", lineHeight: 1.6 }}>&quot;I don&apos;t want to hand you fish. I want you to read the chart, follow your rules, and never need my signals again.&quot;</p>
              </blockquote>
              <div className="reveal" data-delay="200" style={{ display: "flex", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
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
          <div className="sec-head center reveal" style={{ marginBottom: 52 }}>
            <h2>Simple, transparent plans</h2>
            <p className="lead" style={{ marginTop: 14 }}>Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid g3" style={{ alignItems: "start" }}>
            {PLAN_META.map((meta, i) => (
              <div key={meta.id} className="reveal" data-delay={i * 80}>
                <MarketingPlanCard
                  meta={meta}
                  prices={prices.find((p) => p.planId === meta.id)!}
                />
              </div>
            ))}
          </div>
          <div className="reveal" style={{ textAlign: "center", marginTop: 36 }}>
            <Link href="/pricing" className="link-arrow" style={{ fontSize: 15 }}>
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
