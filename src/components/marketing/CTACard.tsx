import { Button } from "@/components/ui";

interface CTACardProps {
  heading: string;
  sub: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryStyle?: React.CSSProperties;
}

export function CTACard({
  heading,
  sub,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  secondaryStyle,
}: CTACardProps) {
  return (
    <div
      className="reveal text-center relative overflow-hidden rounded-[32px] bg-[linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)] py-[clamp(32px,8vw,64px)] px-[clamp(20px,6vw,48px)]"
    >
      {/* teal glow — top-left */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%)]" />
      {/* gold glow — bottom-right */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%)]" />

      <div className="relative z-2 max-w-[600px] mx-auto">
        <h2 className="text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.35)] text-[clamp(28px,4vw,42px)]">
          {heading}
        </h2>
        <p className="text-[15px] text-white/88 mt-4">{sub}</p>
        <div className="flex gap-3.5 justify-center mt-7 flex-wrap">
          <Button href={primaryHref} size="lg" iconRight="arrow_forward">
            {primaryLabel}
          </Button>
          {secondaryLabel && secondaryHref && (
            <Button
              href={secondaryHref}
              size="lg"
              variant="ghost"
              style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", ...secondaryStyle }}
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
