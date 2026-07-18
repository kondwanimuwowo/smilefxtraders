import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Smile FX Traders",
  description: "How Smile FX Traders collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="dark py-32 pb-16 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head center reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Privacy Policy</h2>
            <p className="lead mt-[18px]">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-[760px] mx-auto">
          <div className="reveal text-[15px] text-ink-mid leading-[1.8] space-y-8">
            <p>
              This policy describes how Smile FX Traders (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects your data.
            </p>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">What we collect</h3>
              <p>
                Account details you provide at signup (name, email, phone), your trade journal entries, community posts, and general usage data (pages visited, features used) collected via Vercel Analytics once you&apos;ve accepted analytics cookies. We do not collect payment card details directly. Mobile money and card payments are processed by Lenco, our payment partner.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">How we use it</h3>
              <p>
                To run your account (authentication, journal, alerts, notifications), to send transactional and billing emails via Resend, to improve the product based on aggregate usage patterns, and to provide AI-generated trade reviews (Gavo) and market commentary. Trade data sent to our AI provider, Anthropic, is used only to generate that review, not to train models.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Third parties</h3>
              <p>
                Supabase (authentication and database hosting), Resend (transactional email), Lenco (payment processing), Anthropic (AI trade review), Twelve Data and Finnhub (market price and economic calendar data), and Vercel Analytics (cookieless-by-default usage analytics, gated behind your cookie consent choice). None of these partners receive more of your data than is necessary to provide their part of the service.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Cookies</h3>
              <p>
                We set a strictly necessary session cookie via Supabase Auth so you stay logged in. The platform cannot function without it. With your consent, given through the cookie banner, we also enable a cookie tied to anonymous analytics. You can change your choice at any time by clearing the <code>cc_consent</code> cookie and reloading the page.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Data retention</h3>
              <p>
                We keep your account and journal data for as long as your account is active. If you delete your account, your personal data is removed from our production database within 30 days, except where we&apos;re required to retain billing records for tax/legal purposes.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Your rights</h3>
              <p>
                You can request a copy of your data, ask us to correct it, or ask us to delete your account entirely by contacting us. Account and privacy preferences can also be managed directly from Settings once logged in.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Contact</h3>
              <p>
                Questions about this policy: <a href="mailto:support@smilefxtraders.com" className="text-teal font-semibold">support@smilefxtraders.com</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
