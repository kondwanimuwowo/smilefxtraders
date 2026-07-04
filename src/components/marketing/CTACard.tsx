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
      className="reveal"
      style={{
        background: "linear-gradient(155deg, #0C4E6B 0%, #082A3B 60%)",
        borderRadius: 32,
        padding: "clamp(32px, 8vw, 64px) clamp(20px, 6vw, 48px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* teal glow — top-left */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 12% 18%, rgba(8,174,170,0.45) 0%, transparent 52%)", pointerEvents: "none" }} />
      {/* gold glow — bottom-right */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 88% 88%, rgba(248,185,61,0.32) 0%, transparent 48%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ color: "#fff", fontSize: "clamp(28px,4vw,42px)", textShadow: "0 2px 16px rgba(0,0,0,0.35)" }}>
          {heading}
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", marginTop: 16 }}>{sub}</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
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
