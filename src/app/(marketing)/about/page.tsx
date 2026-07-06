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
      <section className="dark py-32 pb-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18]" style={{ fontSize: "clamp(28px,3.8vw,46px)" }}>Built for traders who refuse to gamble</h2>
            <p className="lead mt-[18px]">Smile FX Traders exists to give African traders what most never get starting out: real tools, an honest method, and a community that holds them to their rules.</p>
          </div>
        </div>
      </section>

      {/* Instructor story */}
      <section className="section">
        <div className="container">
          <div className="instr-grid">
            <div className="reveal relative">
              <div className="rounded-3xl overflow-hidden aspect-[4/5] bg-navy-grad grid place-items-center relative shadow-[var(--shadow-lg)]">
                <div className="text-center text-white/55 p-6">
                  <span className="material-symbols-rounded text-[64px]">account_circle</span>
                  <div className="text-[13px] mt-2.5">Instructor portrait</div>
                </div>
              </div>
            </div>
            <div>
              <div className="eyebrow reveal">Lead Instructor</div>
              <h2 className="reveal mt-3.5" data-delay="60" style={{ fontSize: "clamp(28px,3.4vw,40px)" }}>Kondwani</h2>
              <div className="rule reveal" data-delay="80" />
              <p className="reveal text-[15px] text-ink-mid mt-[22px] leading-[1.75]" data-delay="120">
                Kondwani learned to trade the hard way: through blown accounts, recycled YouTube &quot;strategies,&quot; and signal groups that taught him nothing. The turning point was smart money: liquidity, fair-value gaps, order blocks, premium and discount. Not magic. Structure. A way to read what price was actually doing.
              </p>
              <p className="reveal text-[15px] text-ink-mid mt-4 leading-[1.75]" data-delay="160">
                As a community of traders gathered around him in Zambia, he kept hearing the same gaps: no proper journal, no way to check a setup against a rulebook, no honest accountability. So he built Smile FX Traders to be the desk he wished he&apos;d had, and to teach the method, patiently, from first principles.
              </p>
              <blockquote className="reveal mt-6 py-[18px] px-[22px] bg-[var(--bg-soft)] rounded-[14px] flex gap-[13px]" data-delay="200">
                <span className="w-2 rounded-full bg-coral shrink-0" />
                <p className="text-base italic text-ink leading-[1.6]">&quot;I don&apos;t want to hand you fish. I want you to read the chart, follow your rules, and never need my signals again.&quot;</p>
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
            <div className="rule bg-gold mx-auto" />
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
          <div className="grid g2 mt-12">
            {[
              { icon: "balance", title: "Discipline over hype", delay: 0, body: "No Lambos, no get-rich-quick. We measure success in rules followed and risk respected, because that's what survives." },
              { icon: "school", title: "Teach, don't spoon-feed", delay: 80, body: "Every signal comes with its reasoning. The goal is your independence: a trader who can read the chart alone." },
              { icon: "handshake", title: "Honesty about risk", delay: 0, body: "We tell the truth: most who gamble lose. We're here for the ones willing to do the work properly." },
              { icon: "public", title: "Built in Africa, for Africa", delay: 80, body: "Kwacha pricing, local payment methods, and a community that understands where our traders are coming from." },
            ].map(({ icon, title, body, delay }) => (
              <div key={title} className="card reveal p-[30px] flex gap-[18px]" data-delay={delay || undefined}>
                <div className="icon-chip shrink-0"><span className="material-symbols-rounded">{icon}</span></div>
                <div>
                  <h3 className="text-xl">{title}</h3>
                  <p className="text-[15px] text-ink-mid leading-[1.65] mt-2">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section soft">
        <div className="container max-w-[760px]">
          <div className="sec-head reveal mb-2">
            <div className="eyebrow">The journey</div>
            <h2>How far we&apos;ve come</h2>
            <div className="rule" />
          </div>
          <div className="reveal mt-9 flex flex-col gap-0">
            {[
              { year: "2023", yearCol: "var(--teal-dark)", dot: "var(--teal)", title: "A WhatsApp group", body: "A handful of Lusaka traders sharing setups and learning smart money together.", last: false },
              { year: "2024", yearCol: "var(--teal-dark)", dot: "var(--teal)", title: "The Academy takes shape", body: "Kondwani structures the method into a six-level curriculum, taught in order.", last: false },
              { year: "2025 to today", yearCol: "var(--gold-dark)", dot: "var(--gold)", title: "The full platform", body: "Tools, teaching, and community brought together in one desk. Growing across Zambia and the continent.", last: true },
            ].map(({ year, yearCol, dot, title, body, last }) => (
              <div key={year} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-1.5" style={{ background: dot }} />
                  {!last && <span className="w-0.5 flex-1 bg-line" />}
                </div>
                <div className={last ? "pb-0" : "pb-8"}>
                  <div className="mono text-[13px] font-semibold" style={{ color: yearCol }}>{year}</div>
                  <h3 className="text-[19px] mt-1">{title}</h3>
                  <p className="text-[14.5px] text-ink-mid leading-[1.6] mt-1.5">{body}</p>
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
