import type { ReactNode } from "react";
import { Avatar } from "@/components/ui";

const FEATURES = [
  { icon: "menu_book", text: "Journal & analytics that find your edge" },
  { icon: "checklist", text: "Rules Validator built on the ICT model" },
  { icon: "notifications_active", text: "Live setup alerts from your instructor" },
];

const AVATAR_SEEDS = [11, 7, 2, 4];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel — full version, desktop+ only ── */}
      <div
        className="hidden md:flex flex-col justify-between p-12 min-h-screen"
        style={{ background: "linear-gradient(160deg, #0B425D 0%, #082A3B 70%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <BrandMarkAuth />
          <div style={{ lineHeight: 1.05 }}>
            <div className="font-display font-bold text-xl text-white">Smile FX</div>
            <div
              className="font-semibold tracking-[0.24em] uppercase mt-0.5"
              style={{ fontSize: 10, color: "var(--teal-bright)" }}
            >
              Traders
            </div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1
            className="font-display font-semibold text-white leading-tight"
            style={{ fontSize: 34, letterSpacing: "-0.02em" }}
          >
            Trade smart money.<br />Together.
          </h1>
          <p className="mt-4 leading-relaxed max-w-[380px]" style={{ fontSize: 15, color: "rgba(255,255,255,0.7)" }}>
            Zambia&apos;s home for ICT &amp; Supply-and-Demand traders. Journal your edge, validate every setup, and follow live calls from Kondwani.
          </p>

          {/* Feature rows */}
          <div className="flex flex-col gap-3 mt-7">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3" style={{ color: "rgba(255,255,255,0.88)", fontSize: 13.5 }}>
                <span
                  className="flex items-center justify-center rounded-[8px] shrink-0"
                  style={{ width: 30, height: 30, background: "rgba(8,174,170,0.18)" }}
                >
                  <span className="material-symbols-rounded text-[17px]" style={{ color: "var(--teal-bright)" }}>
                    {icon}
                  </span>
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Avatar stack */}
        <div className="flex items-center gap-3">
          <div className="flex">
            {AVATAR_SEEDS.map((seed, i) => (
              <div key={seed} style={{ marginLeft: i ? -10 : 0 }}>
                <Avatar seed={seed} name="FX" size={30} ring="var(--navy-deep)" />
              </div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            2,400+ traders growing across Africa
          </span>
        </div>
      </div>

      {/* ── Brand header — compact version, mobile only ── */}
      <div
        className="flex md:hidden items-center gap-3 px-5 py-6"
        style={{ background: "linear-gradient(160deg, #0B425D 0%, #082A3B 70%)" }}
      >
        <BrandMarkAuth size={38} />
        <div style={{ lineHeight: 1.05 }}>
          <div className="font-display font-bold text-base text-white">Smile FX Traders</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            Trade smart money. Together.
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div
        className="flex items-center justify-center px-5 sm:px-8 py-8 md:py-12 min-h-0 md:min-h-screen"
        style={{ background: "var(--app-bg)" }}
      >
        <div className="w-full" style={{ maxWidth: 400 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function BrandMarkAuth({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        overflow: "hidden",
        background: "linear-gradient(135deg, #08AEAA, #0B425D)",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Smile%20FX%20Traders%20Logo%20bg-W.png"
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "invert(1)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
