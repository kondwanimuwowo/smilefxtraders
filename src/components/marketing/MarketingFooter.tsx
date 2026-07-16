import Link from "next/link";
import { Icon } from "@/components/ui";
import { SOCIAL_LINKS } from "@/lib/social-links";

const LINKS: [string, string][] = [
  ["Features",  "/features"],
  ["Pricing",   "/pricing"],
  ["Academy",   "/learn"],
  ["Community", "/our-community"],
  ["About",     "/about"],
  ["Contact",   "/contact"],
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="text-white/70 bg-[var(--navy-deep,#082A3B)] border-t border-[rgba(255,255,255,0.06)] overflow-hidden">
      <div className="mx-auto px-5 max-w-[1000px] pt-14 pb-14">
        {/* Logo lockup */}
        <Link href="/" className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/smile-fx-logo-wht.png"
            alt=""
            width={120}
            height={120}
            className="rounded-3xl object-contain shrink-0"
            style={{ width: "clamp(56px, 10vw, 120px)", height: "clamp(56px, 10vw, 120px)" }}
          />
          <span
            className="font-display font-extrabold tracking-tight text-white leading-none"
            style={{ fontSize: "clamp(34px, 8vw, 78px)" }}
          >
            Smile FX Traders
          </span>
        </Link>

        {/* Social */}
        <div className="flex items-center justify-center gap-3 mt-7">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-11 h-11 rounded-full grid place-items-center transition-colors hover:bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:text-white"
            >
              <Icon name={s.icon} size={20} />
            </a>
          ))}
        </div>

        {/* Links */}
        <nav className="flex items-center justify-center gap-x-7 gap-y-2 flex-wrap text-center mt-7">
          {LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-[14px] transition-colors hover:text-white text-[rgba(255,255,255,0.65)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="text-[12px] leading-relaxed mt-6 text-justify text-[rgba(255,255,255,0.35)]">
          <strong className="font-bold text-[rgba(255,255,255,0.5)]">Risk Warning:</strong> Trading forex, CFDs, and other leveraged instruments carries a high level of risk and may not suit every investor. Leverage can work against you as well as for you, and you could lose some or all of your capital. Only trade with money you can afford to lose, and speak with an independent financial advisor if you&apos;re unsure.
        </p>

        <p className="text-[12px] leading-relaxed mt-4 text-justify text-[rgba(255,255,255,0.35)]">
          <strong className="font-bold text-[rgba(255,255,255,0.5)]">Disclaimer:</strong> Smile FX Traders provides educational content, analysis tools, and community discussion. Nothing on this site is financial advice, and no result shown by any trader, tool, or feature is a promise of future performance. By visiting or using this website, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-white">Terms of Service</Link>,{" "}
          <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>, and{" "}
          <Link href="/risk-disclosure" className="underline hover:text-white">Risk Disclosure</Link>.
        </p>

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap mt-9 pt-6 text-[12.5px] border-t border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.4)]">
          <span>© {year} Smile FX Traders</span>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/risk-disclosure" className="hover:text-white transition-colors">Risk Disclosure</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
