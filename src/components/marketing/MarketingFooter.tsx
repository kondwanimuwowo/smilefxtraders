import Link from "next/link";
import { Icon } from "@/components/ui";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="text-white/70 bg-[var(--navy-deep,#082A3B)] pt-[72px] pb-8">
      <div className="mx-auto px-5 max-w-[1200px]">
        {/* Grid */}
        <div className="footer-grid">
          {/* Brand col */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/smile-fx-logo-wht.png"
                alt="Smile FX Traders"
                width={38}
                height={38}
                className="rounded-[10px] object-contain"
              />
              <span className="font-display font-bold text-[19px] text-white">
                Smile FX Traders
              </span>
            </Link>
            <p className="text-sm leading-relaxed mt-3.5 max-w-[280px] text-[rgba(255,255,255,0.7)]">
              Trade smart money. Together. · Zambia &amp; Africa. A professional desk for SMC &amp; Supply-and-Demand traders: journal your edge, validate every setup, and follow live calls from Kondwani.
            </p>
            {/* Social */}
            <div className="flex gap-2.5 mt-5">
              {[
                { label: "WhatsApp", icon: "chat" },
                { label: "Instagram", icon: "photo_camera" },
                { label: "YouTube", icon: "play_circle" },
                { label: "Telegram", icon: "send" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-[38px] h-[38px] rounded-[10px] grid place-items-center transition-all hover:-translate-y-0.5 bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)]"
                >
                  <Icon name={s.icon} size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-[12px] uppercase tracking-widest font-bold mb-4 text-[rgba(255,255,255,0.5)]">
              Platform
            </h4>
            {[
              ["Features",   "/features"],
              ["Academy",    "/learn"],
              ["Community",  "/our-community"],
              ["Pricing",    "/pricing"],
              ["About",      "/about"],
              ["Launch app", "/login"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block text-[14.5px] py-1.5 transition-colors hover:text-white text-[rgba(255,255,255,0.72)]"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[12px] uppercase tracking-widest font-bold mb-4 text-[rgba(255,255,255,0.5)]">
              Company
            </h4>
            {[
              ["About Kondwani", "/about"],
              ["Contact",        "/contact"],
              ["Risk disclosure", "#"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="block text-[14.5px] py-1.5 transition-colors hover:text-white text-[rgba(255,255,255,0.72)]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-5 flex-wrap mt-12 pt-7 text-[13px] border-t border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)]">
          <span>© {year} Smile FX Traders · Lusaka, Zambia</span>
          <span className="max-w-[500px]">
            Trading involves substantial risk. Educational content only, not financial advice. Never risk money you can&apos;t afford to lose.
          </span>
        </div>
      </div>
    </footer>
  );
}
