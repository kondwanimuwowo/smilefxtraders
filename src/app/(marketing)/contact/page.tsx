import type { Metadata } from "next";
import { Icon } from "@/components/ui";
import { SOCIAL_LINKS } from "@/lib/social-links";

export const metadata: Metadata = {
  title: "Contact Us | Smile FX Traders",
  description: "Get in touch with the Smile FX Traders team.",
};

export default function ContactPage() {
  return (
    <>
      <section className="dark py-32 pb-16 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head center reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Contact Us</h2>
            <p className="lead mt-[18px]">Questions about the platform, a plan, or something you saw on the site? We&apos;re easy to reach.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-[560px] mx-auto text-center">
          <a
            href="mailto:support@smilefxtraders.com"
            className="reveal inline-flex items-center gap-3 rounded-2xl px-6 py-5 bg-[var(--bg-soft)] hover:opacity-90 transition-opacity"
          >
            <Icon name="mail" size={22} className="text-teal" />
            <span className="font-display font-semibold text-[16px] text-ink-strong">support@smilefxtraders.com</span>
          </a>

          <p className="reveal text-[14px] text-ink-mid mt-8 mb-4">Or find us here:</p>
          <div className="reveal flex gap-3 justify-center">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-[42px] h-[42px] rounded-[12px] grid place-items-center transition-all hover:-translate-y-0.5 bg-[var(--bg-soft)] text-ink-mid"
              >
                <Icon name={s.icon} size={19} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
