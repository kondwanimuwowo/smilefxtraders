import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Community | Smile FX Traders",
  description: "Trade alongside a community of disciplined smart-money traders across Africa. Leaderboard, shared setups, streaks, and accountability.",
};

export default function OurCommunityPage() {
  return (
    <>
      {/* Dark hero */}
      <section className="dark py-32 pb-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18]" style={{ fontSize: "clamp(28px,3.8vw,46px)" }}>Discipline is easier together</h2>
            <p className="lead mt-[18px]">Share setups, climb the monthly leaderboard, and keep your streak alive alongside traders who take this as seriously as you do.</p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="section">
        <div className="container">
          <div className="grid g3 reveal">
            {[
              { icon: "leaderboard",       title: "Monthly leaderboard", body: "Ranked by net R on a shared risk model, so it rewards discipline, not gambling." },
              { icon: "local_fire_department", title: "Streaks & accountability", body: "Keep your journaling streak alive. Discipline scores keep everyone honest, gently." },
              { icon: "diversity_3",       title: "Share & learn",         body: "Post your setups, get feedback, and learn from how others read the same chart." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="card p-7">
                <div className="icon-chip"><span className="material-symbols-rounded">{icon}</span></div>
                <h3 className="text-[19px] mt-4 mb-2">{title}</h3>
                <p className="text-[14.5px] text-ink-mid leading-[1.6]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard + Feed preview */}
      <section className="section soft">
        <div className="container">
          <div className="sec-head center reveal mb-12">
            <div className="eyebrow">How it looks inside</div>
            <h2>Your community desk</h2>
            <div className="rule mx-auto" />
            <p className="lead text-[14.5px] text-ink-dim">Illustrative preview. Sign up to see real members and live activity.</p>
          </div>
          <div className="comm-grid">
            {/* Leaderboard mockup */}
            <div className="reveal">
              <div className="card p-1.5">
                <div className="py-[13px] px-3.5 flex items-center gap-2 border-b border-line">
                  <span className="material-symbols-rounded text-[var(--gold-dark)] text-[18px]">leaderboard</span>
                  <span className="font-bold text-[13.5px] text-ink">Monthly Leaderboard</span>
                </div>
                {[
                  { rank: 1, init: "—", name: "Top trader", loc: "Lusaka", pnl: "+R", streak: "—", rankBg: "var(--gold)", rankFg: "var(--navy-deep)" },
                  { rank: 2, init: "—", name: "2nd place",  loc: "Kitwe",  pnl: "+R", streak: "—", rankBg: "#C7D0D6",    rankFg: "var(--navy-deep)" },
                  { rank: 3, init: "—", name: "3rd place",  loc: "Ndola",  pnl: "+R", streak: "—", rankBg: "#C8855A",    rankFg: "#fff" },
                  { rank: 4, init: "—", name: "4th place",  loc: "—",      pnl: "+R", streak: "—", rankBg: "var(--bg-soft)", rankFg: "var(--ink-mid)" },
                  { rank: 5, init: "—", name: "5th place",  loc: "—",      pnl: "+R", streak: "—", rankBg: "var(--bg-soft)", rankFg: "var(--ink-mid)" },
                ].map((m, i) => (
                  <div key={m.rank} className={`flex items-center gap-[13px] py-[13px] px-3.5 ${i ? "border-t border-line" : ""}`}>
                    <span className="w-7 h-7 rounded-lg grid place-items-center font-bold text-[13px]" style={{ background: m.rankBg, color: m.rankFg }}>{m.rank}</span>
                    <span className="avatar w-9 h-9 text-[13px] bg-[var(--bg-soft)] text-ink-dim">?</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink">{m.name}</div>
                      <div className="text-[11.5px] text-ink-dim">{m.loc}</div>
                    </div>
                    <div className="text-right">
                      <div className="mono font-bold text-[var(--teal-dark)] text-[13px]">{m.pnl}</div>
                      <div className="text-[11.5px] text-[var(--gold-dark)]">🔥 {m.streak}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feed mockup */}
            <div className="reveal" data-delay="100">
              <div className="flex flex-col gap-3.5">
                {[
                  { pair: "XAUUSD", dir: "long",  text: "London open FVG fill. TP1 hit, runners on. Patience pays." },
                  { pair: "GBPUSD", dir: "short", text: "BOS on the 15m after Asian sweep. Textbook. Journal updated." },
                  { pair: "EURUSD", dir: "short", text: "Missed the entry waiting for confirmation. No FOMO, next setup." },
                ].map((f, i) => (
                  <div key={i} className="card p-[18px]">
                    <div className="flex gap-[11px]">
                      <span className="avatar w-[38px] h-[38px] text-[13px] bg-[var(--bg-soft)] text-ink-dim shrink-0">?</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-[7px] flex-wrap">
                          <span className="text-[13px] font-semibold text-ink-dim">Community member</span>
                          <span className="mono ml-auto text-xs">{f.pair}</span>
                          <span className={`chip text-[10px] ${f.dir === "long" ? "badge-long" : "badge-short"}`}>{f.dir === "long" ? "Long" : "Short"}</span>
                        </div>
                        <p className="text-[13.5px] text-ink leading-[1.55] mt-[7px]">{f.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Geography */}
      <section className="section dark">
        <div className="container">
          <div className="sec-head center reveal">
            <div className="eyebrow">Where we are</div>
            <h2>Rooted in Zambia, growing across Africa</h2>
            <div className="rule bg-gold mx-auto" />
            <p className="lead">Started as a WhatsApp group in Lusaka. Now traders from across the continent are trading together on the same desk.</p>
          </div>
          <div className="reveal flex gap-2.5 flex-wrap justify-center mt-10">
            {["🇿🇲 Zambia", "🇿🇦 South Africa", "🇰🇪 Kenya", "🇿🇼 Zimbabwe", "🇳🇬 Nigeria", "🇹🇿 Tanzania", "🇬🇭 Ghana", "🇺🇬 Uganda"].map((c) => (
              <span key={c} className="country-pill">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="reveal text-center max-w-[560px] mx-auto">
            <h2 style={{ fontSize: "clamp(28px,4vw,40px)" }}>Pull up a seat at the desk</h2>
            <p className="lead mt-3.5">The Starter plan is free. Introduce yourself in the feed and start your streak today.</p>
            <div className="flex gap-3.5 justify-center mt-[26px] flex-wrap">
              <Button href="/signup" size="lg" iconRight="arrow_forward">Join the community</Button>
              <Button href="/about" size="lg" variant="ghost">Meet Kondwani</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
