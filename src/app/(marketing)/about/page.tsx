import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import { CTACard } from "@/components/marketing/CTACard";

export const metadata: Metadata = {
  title: "About | Smile FX Traders",
  description: "The story behind Smile FX Traders and Kondwani's mission to give African traders real tools, an honest method, and a community built on discipline.",
};

export default function AboutPage() {
  return (
    <>
      {/* Dark hero */}
      <section className="dark" style={{ padding: "128px 0 96px", background: "radial-gradient(ellipse at 12% 18%, rgba(8,174,170,0.45) 0%, transparent 52%), radial-gradient(ellipse at 88% 88%, rgba(248,185,61,0.32) 0%, transparent 48%), linear-gradient(155deg, #0C4E6B 0%, #082A3B 60%)" }}>
        <div className="container">
          <div className="sec-head reveal">
            <h2 style={{ fontSize: "clamp(28px,3.8vw,46px)", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.18, margin: 0 }}>Built for traders who refuse to gamble</h2>
            <p className="lead" style={{ marginTop: 18 }}>Smile FX Traders exists to give African traders what most never get starting out: real tools, an honest method, and a community that holds them to their rules.</p>
          </div>
        </div>
      </section>

      {/* Instructor story */}
      <section className="section">
        <div className="container">
          <div className="instr-grid">
            <div className="reveal" style={{ position: "relative" }}>
              <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-lg)", aspectRatio: "4/5", background: "var(--navy-grad)", display: "grid", placeItems: "center", position: "relative" }}>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", padding: 24 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 64 }}>account_circle</span>
                  <div style={{ fontSize: 13, marginTop: 10 }}>Instructor portrait</div>
                </div>
              </div>
            </div>
            <div>
              <div className="eyebrow reveal">Lead Instructor</div>
              <h2 className="reveal" data-delay="60" style={{ fontSize: "clamp(28px,3.4vw,40px)", marginTop: 14 }}>Kondwani</h2>
              <div className="rule reveal" data-delay="80" />
              <p className="reveal" data-delay="120" style={{ fontSize: 15, color: "var(--ink-mid)", marginTop: 22, lineHeight: 1.75 }}>
                Kondwani learned to trade the hard way: through blown accounts, recycled YouTube &quot;strategies,&quot; and signal groups that taught him nothing. The turning point was smart money: liquidity, fair-value gaps, order blocks, premium and discount. Not magic. Structure. A way to read what price was actually doing.
              </p>
              <p className="reveal" data-delay="160" style={{ fontSize: 15, color: "var(--ink-mid)", marginTop: 16, lineHeight: 1.75 }}>
                As a community of traders gathered around him in Zambia, he kept hearing the same gaps: no proper journal, no way to check a setup against a rulebook, no honest accountability. So he built Smile FX Traders to be the desk he wished he&apos;d had, and to teach the method, patiently, from first principles.
              </p>
              <blockquote className="reveal" data-delay="200" style={{ margin: "24px 0 0", padding: "18px 22px", background: "var(--bg-soft)", borderRadius: 14, display: "flex", gap: 13 }}>
                <span style={{ width: 8, borderRadius: 99, background: "var(--coral)", flexShrink: 0 }} />
                <p style={{ fontSize: 16, fontStyle: "italic", color: "var(--ink)", lineHeight: 1.6 }}>&quot;I don&apos;t want to hand you fish. I want you to read the chart, follow your rules, and never need my signals again.&quot;</p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section dark" id="mission">
        <div className="container">
          <div className="sec-head center reveal">
            <div className="eyebrow">Our mission</div>
            <h2>Raise a generation of disciplined African traders</h2>
            <div className="rule" style={{ background: "var(--gold)", marginLeft: "auto", marginRight: "auto" }} />
            <p className="lead">We believe trading, done right, is a skill, not a lottery. Our job is to make the right way the easy way: clear tools, honest teaching, and a community that celebrates discipline over wins.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <div className="sec-head reveal">
            <div className="eyebrow">What we stand for</div>
            <h2>Our values</h2>
            <div className="rule" />
          </div>
          <div className="grid g2" style={{ marginTop: 48 }}>
            {[
              { icon: "balance", title: "Discipline over hype", delay: 0, body: "No Lambos, no get-rich-quick. We measure success in rules followed and risk respected, because that's what survives." },
              { icon: "school", title: "Teach, don't spoon-feed", delay: 80, body: "Every signal comes with its reasoning. The goal is your independence: a trader who can read the chart alone." },
              { icon: "handshake", title: "Honesty about risk", delay: 0, body: "We tell the truth: most who gamble lose. We're here for the ones willing to do the work properly." },
              { icon: "public", title: "Built in Africa, for Africa", delay: 80, body: "Kwacha pricing, local payment methods, and a community that understands where our traders are coming from." },
            ].map(({ icon, title, body, delay }) => (
              <div key={title} className="card reveal" data-delay={delay || undefined} style={{ padding: 30, display: "flex", gap: 18 }}>
                <div className="icon-chip" style={{ flexShrink: 0 }}><span className="material-symbols-rounded">{icon}</span></div>
                <div>
                  <h3 style={{ fontSize: 20 }}>{title}</h3>
                  <p style={{ fontSize: 15, color: "var(--ink-mid)", lineHeight: 1.65, marginTop: 8 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section soft">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="sec-head reveal" style={{ marginBottom: 8 }}>
            <div className="eyebrow">The journey</div>
            <h2>How far we&apos;ve come</h2>
            <div className="rule" />
          </div>
          <div className="reveal" style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { year: "2023", yearCol: "var(--teal-dark)", dot: "var(--teal)", title: "A WhatsApp group", body: "A handful of Lusaka traders sharing setups and learning smart money together.", last: false },
              { year: "2024", yearCol: "var(--teal-dark)", dot: "var(--teal)", title: "The Academy takes shape", body: "Kondwani structures the method into a six-level curriculum, taught in order.", last: false },
              { year: "2025 to today", yearCol: "var(--gold-dark)", dot: "var(--gold)", title: "The full platform", body: "Tools, teaching, and community brought together in one desk. Growing across Zambia and the continent.", last: true },
            ].map(({ year, yearCol, dot, title, body, last }) => (
              <div key={year} style={{ display: "flex", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 99, background: dot, flexShrink: 0, marginTop: 6 }} />
                  {!last && <span style={{ width: 2, flex: 1, background: "var(--line)" }} />}
                </div>
                <div style={{ paddingBottom: last ? 0 : 32 }}>
                  <div className="mono" style={{ fontSize: 13, color: yearCol, fontWeight: 600 }}>{year}</div>
                  <h3 style={{ fontSize: 19, marginTop: 4 }}>{title}</h3>
                  <p style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6, marginTop: 6 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <CTACard
            heading="Trade with people who want you to win, the right way"
            sub="Join free and see what a disciplined desk feels like."
            primaryLabel="Start free"
            primaryHref="/signup"
            secondaryLabel="See the community"
            secondaryHref="/our-community"
            secondaryStyle={{ color: "var(--gold)", borderColor: "var(--gold)" }}
          />
        </div>
      </section>
    </>
  );
}
