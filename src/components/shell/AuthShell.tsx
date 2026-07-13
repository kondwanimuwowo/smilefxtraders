import type { ReactNode } from "react";
import { Avatar, Icon } from "@/components/ui";
import { prisma } from "@/lib/prisma";

const FEATURES = [
  { icon: "menu_book",            text: "Journal & analytics that find your edge" },
  { icon: "checklist",            text: "Rules Validator built on the SMC model" },
  { icon: "notifications_active", text: "Live setup alerts from your instructor" },
];

const AVATAR_SEEDS = [11, 7, 2, 4];

export async function AuthShell({ children }: { children: ReactNode }) {
  let memberCount = 0;
  try {
    memberCount = await prisma.user.count();
  } catch (err) {
    console.error("[auth-shell] member count unavailable", err);
  }

  const memberLabel = memberCount === 0
    ? "Be the first to join"
    : memberCount < 10
    ? `${memberCount} traders and growing`
    : `${memberCount.toLocaleString()}+ traders growing across Africa`;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel — full version, desktop+ only ── */}
      <div className="hidden md:flex flex-col justify-between p-12 min-h-screen bg-[linear-gradient(160deg,#0B425D_0%,#082A3B_70%)]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <BrandMarkAuth />
          <div className="leading-[1.05]">
            <div className="font-display font-bold text-xl text-white">Smile FX</div>
            <div className="font-semibold tracking-[0.24em] uppercase mt-0.5 text-[10px] text-teal-bright">
              Traders
            </div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1 className="font-display font-semibold text-white leading-tight text-[34px] tracking-[-0.02em]">
            Trade smart money.<br />Together.
          </h1>
          <p className="mt-4 leading-relaxed max-w-[380px] text-[15px] text-[rgba(255,255,255,0.7)]">
            A professional desk for SMC &amp; Supply-and-Demand traders. Journal your edge, validate every setup, and follow live calls from Kondwani.
          </p>

          {/* Feature rows */}
          <div className="flex flex-col gap-3 mt-7">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-[13.5px] text-[rgba(255,255,255,0.88)]">
                <span className="flex items-center justify-center rounded-[8px] shrink-0 size-[30px] bg-[rgba(8,174,170,0.18)]">
                  <Icon name={icon} size={17} className="text-teal-bright" />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Avatar stack + real count */}
        <div className="flex items-center gap-3">
          <div className="flex">
            {AVATAR_SEEDS.map((seed, i) => (
              <div key={seed} className={i ? "-ml-2.5" : "ml-0"}>
                <Avatar seed={seed} name="FX" size={30} ring="var(--navy-deep)" />
              </div>
            ))}
          </div>
          <span className="text-[13px] text-[rgba(255,255,255,0.7)]">
            {memberLabel}
          </span>
        </div>
      </div>

      {/* ── Brand header — compact version, mobile only ── */}
      <div className="flex md:hidden items-center gap-3 px-5 py-6 bg-[linear-gradient(160deg,#0B425D_0%,#082A3B_70%)]">
        <BrandMarkAuth size={38} />
        <div className="leading-[1.05]">
          <div className="font-display font-bold text-base text-white">Smile FX Traders</div>
          <div className="text-xs text-[rgba(255,255,255,0.7)]">
            Trade smart money. Together.
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex items-center justify-center px-5 sm:px-8 py-8 md:py-12 min-h-0 md:min-h-screen bg-app-bg">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}

function BrandMarkAuth({ size = 48 }: { size?: number }) {
  return (
    <div
      className="overflow-hidden shrink-0 bg-[linear-gradient(135deg,#08AEAA,#0B425D)]"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/smile-fx-logo-wht.png"
        alt=""
        className="w-full h-full object-contain"
      />
    </div>
  );
}
