import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Disclosure | Smile FX Traders",
  description: "Understand the risks of trading forex, CFDs, and other leveraged instruments before using Smile FX Traders.",
};

export default function RiskDisclosurePage() {
  return (
    <>
      <section className="dark py-32 pb-16 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head center reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Risk Disclosure</h2>
            <p className="lead mt-[18px]">Trading is a skill built over time, and it also carries real risk of loss. Read this before you trade.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-[760px] mx-auto">
          <div className="reveal text-[15px] text-ink-mid leading-[1.8] space-y-6">
            <p>
              Trading foreign exchange (forex), CFDs, commodities, and stock indices on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage available in these markets can work against you as well as for you.
            </p>
            <p>
              Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. The possibility exists that you could sustain a loss of some or all of your initial capital, and therefore you should not trade with money you cannot afford to lose.
            </p>
            <p>
              You should be aware of all the risks associated with leveraged trading, and seek advice from an independent financial advisor if you have any doubts. Past performance of any trader, strategy, or model shown on this platform, including trades shared in the Journal, Community feed, or Live Alerts, is not indicative of future results.
            </p>
            <p>
              Smile FX Traders is an educational and analytical platform. The Trade Journal, Rules Validator, MacroEdge, COT Reports, Trend Matrix, and Gavo AI Trade Review are tools to help you structure and review your own trading decisions. Nothing on this platform, including instructor commentary, live alerts, or AI-generated feedback, constitutes financial advice or a recommendation to buy or sell any financial instrument.
            </p>
            <p>
              Live alerts and setups shared by Kondwani or other community members are for educational discussion only. You are solely responsible for your own trading decisions, position sizing, and risk management.
            </p>
            <p>
              If you have questions about this disclosure, contact us at{" "}
              <a href="mailto:support@smilefxtraders.com" className="text-teal font-semibold">support@smilefxtraders.com</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
