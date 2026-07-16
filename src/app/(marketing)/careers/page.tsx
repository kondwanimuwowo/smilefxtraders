import type { Metadata } from "next";
import { Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Careers | Smile FX Traders",
  description: "Join the Smile FX Traders team.",
};

export default function CareersPage() {
  return (
    <>
      <section className="dark py-32 pb-16 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head center reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Careers</h2>
            <p className="lead mt-[18px]">We&apos;re not actively hiring right now.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-[560px] mx-auto text-center">
          <Icon name="rocket_launch" size={40} className="reveal text-ink-dim mb-4" />
          <p className="reveal text-[15px] text-ink-mid leading-[1.7]">
            We&apos;re a small team building tools for African traders, and we&apos;re not running open roles at the moment. If you trade, build, or teach and think you&apos;d be useful here, send us a note anyway. We do read them.
          </p>
          <a
            href="mailto:support@smilefxtraders.com?subject=Careers%20at%20Smile%20FX%20Traders"
            className="reveal inline-flex items-center gap-2 mt-6 font-semibold text-teal"
          >
            <Icon name="mail" size={18} />
            Reach out anyway
          </a>
        </div>
      </section>
    </>
  );
}
