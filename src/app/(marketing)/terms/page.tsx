import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Smile FX Traders",
  description: "The terms that govern your use of Smile FX Traders.",
};

export default function TermsPage() {
  return (
    <>
      <section className="dark py-32 pb-16 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head center reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Terms of Service</h2>
            <p className="lead mt-[18px]">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-[760px] mx-auto">
          <div className="reveal text-[15px] text-ink-mid leading-[1.8] space-y-8">
            <p>
              These terms govern your use of Smile FX Traders.
            </p>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Acceptance</h3>
              <p>
                By creating an account or using Smile FX Traders, you agree to these terms. If you don&apos;t agree, please don&apos;t use the platform.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Your account</h3>
              <p>
                You&apos;re responsible for keeping your login credentials secure and for all activity under your account. Tell us immediately if you suspect unauthorized access.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Subscriptions & billing</h3>
              <p>
                Smile FX Traders offers a free Starter plan and paid Edge and Pro plans, billed monthly or annually (annual billing saves 20%). Paid plans renew automatically until cancelled; cancelling keeps your access until the end of the current billing period. Prices are shown in ZMW and USD at checkout. See our <a href="/pricing" className="text-teal font-semibold">Pricing</a> page for current plan details.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Educational content only</h3>
              <p>
                Nothing on Smile FX Traders, including the Academy curriculum, live alerts, community posts, Trend Matrix, MacroEdge commentary, or Gavo AI trade reviews, constitutes financial advice. See our <a href="/risk-disclosure" className="text-teal font-semibold">Risk Disclosure</a> for details on the risks of leveraged trading.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Acceptable use</h3>
              <p>
                Don&apos;t use the platform to share illegal content, harass other members, misrepresent trading results, or attempt to access another user&apos;s account or data. We may suspend or terminate accounts that violate these terms.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Termination</h3>
              <p>
                You can close your account at any time from Settings. We may suspend or terminate access for violations of these terms, non-payment, or fraudulent activity.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Changes to these terms</h3>
              <p>
                We may update these terms as the platform evolves. Material changes will be communicated by email or in-app notification before they take effect.
              </p>
            </div>

            <div>
              <h3 className="font-display font-medium text-[19px] text-ink-strong mb-2">Contact</h3>
              <p>
                Questions about these terms: <a href="mailto:support@smilefxtraders.com" className="text-teal font-semibold">support@smilefxtraders.com</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
