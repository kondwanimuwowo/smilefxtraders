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
      <section className="dark" style={{ padding: "128px 0 96px", background: "radial-gradient(ellipse at 12% 18%, rgba(8,174,170,0.45) 0%, transparent 52%), radial-gradient(ellipse at 88% 88%, rgba(248,185,61,0.32) 0%, transparent 48%), linear-gradient(155deg, #0C4E6B 0%, #082A3B 60%)" }}>
        <div className="container">
          <div className="sec-head reveal">
            <h2 style={{ fontSize: "clamp(28px,3.8vw,46px)", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.18, margin: 0 }}>Discipline is easier together</h2>
            <p className="lead" style={{ marginTop: 18 }}>Share setups, climb the monthly leaderboard, and keep your streak alive alongside traders who take this as seriously as you do.</p>
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
              <div key={title} className="card" style={{ padding: 28 }}>
                <div className="icon-chip"><span className="material-symbols-rounded">{icon}</span></div>
                <h3 style={{ fontSize: 19, margin: "16px 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard + Feed preview */}
      <section className="section soft">
        <div className="container">
          <div className="sec-head center reveal" style={{ marginBottom: 48 }}>
            <div className="eyebrow">How it looks inside</div>
            <h2>Your community desk</h2>
            <div className="rule" style={{ marginLeft: "auto", marginRight: "auto" }} />
            <p className="lead" style={{ fontSize: 14.5, color: "var(--ink-dim)" }}>Illustrative preview. Sign up to see real members and live activity.</p>
          </div>
          <div className="comm-grid">
            {/* Leaderboard mockup */}
            <div className="reveal">
              <div className="card" style={{ padding: 6 }}>
                <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)" }}>
                  <span className="material-symbols-rounded" style={{ color: "var(--gold-dark)", fontSize: 18 }}>leaderboard</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>Monthly Leaderboard</span>
                </div>
                {[
                  { rank: 1, init: "—", name: "Top trader", loc: "Lusaka", pnl: "+R", streak: "—", rankBg: "var(--gold)", rankFg: "var(--navy-deep)" },
                  { rank: 2, init: "—", name: "2nd place",  loc: "Kitwe",  pnl: "+R", streak: "—", rankBg: "#C7D0D6",    rankFg: "var(--navy-deep)" },
                  { rank: 3, init: "—", name: "3rd place",  loc: "Ndola",  pnl: "+R", streak: "—", rankBg: "#C8855A",    rankFg: "#fff" },
                  { rank: 4, init: "—", name: "4th place",  loc: "—",      pnl: "+R", streak: "—", rankBg: "var(--bg-soft)", rankFg: "var(--ink-mid)" },
                  { rank: 5, init: "—", name: "5th place",  loc: "—",      pnl: "+R", streak: "—", rankBg: "var(--bg-soft)", rankFg: "var(--ink-mid)" },
                ].map((m, i) => (
                  <div key={m.rank} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", borderTop: i ? "1px solid var(--line)" : undefined }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, background: m.rankBg, color: m.rankFg }}>{m.rank}</span>
                    <span className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: "var(--bg-soft)", color: "var(--ink-dim)" }}>?</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{m.loc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontWeight: 700, color: "var(--teal-dark)", fontSize: 13 }}>{m.pnl}</div>
                      <div style={{ fontSize: 11.5, color: "var(--gold-dark)" }}>🔥 {m.streak}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feed mockup */}
            <div className="reveal" data-delay="100">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { pair: "XAUUSD", dir: "long",  text: "London open FVG fill. TP1 hit, runners on. Patience pays." },
                  { pair: "GBPUSD", dir: "short", text: "BOS on the 15m after Asian sweep. Textbook. Journal updated." },
                  { pair: "EURUSD", dir: "short", text: "Missed the entry waiting for confirmation. No FOMO, next setup." },
                ].map((f, i) => (
                  <div key={i} className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", gap: 11 }}>
                      <span className="avatar" style={{ width: 38, height: 38, fontSize: 13, background: "var(--bg-soft)", color: "var(--ink-dim)", flexShrink: 0 }}>?</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-dim)" }}>Community member</span>
                          <span className="mono" style={{ marginLeft: "auto", fontSize: 12 }}>{f.pair}</span>
                          <span className={`chip ${f.dir === "long" ? "badge-long" : "badge-short"}`} style={{ fontSize: 10 }}>{f.dir === "long" ? "Long" : "Short"}</span>
                        </div>
                        <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, marginTop: 7 }}>{f.text}</p>
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
            <div className="rule" style={{ background: "var(--gold)", marginLeft: "auto", marginRight: "auto" }} />
            <p className="lead">Started as a WhatsApp group in Lusaka. Now traders from across the continent are trading together on the same desk.</p>
          </div>
          <div className="reveal" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 40 }}>
            {["🇿🇲 Zambia", "🇿🇦 South Africa", "🇰🇪 Kenya", "🇿🇼 Zimbabwe", "🇳🇬 Nigeria", "🇹🇿 Tanzania", "🇬🇭 Ghana", "🇺🇬 Uganda"].map((c) => (
              <span key={c} className="country-pill">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,40px)" }}>Pull up a seat at the desk</h2>
            <p className="lead" style={{ marginTop: 14 }}>The Starter plan is free. Introduce yourself in the feed and start your streak today.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
              <Button href="/signup" size="lg" iconRight="arrow_forward">Join the community</Button>
              <Button href="/about" size="lg" variant="ghost">Meet Kondwani</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
