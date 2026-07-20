interface GavoIconProps {
  size?: number;
  className?: string;
  /** Color of the eyes/mouth cutout — must contrast with currentColor at the call site. */
  cutoutColor?: string;
}

// Gavo's mascot mark — a solid bot glyph, deliberately outside ICON_REGISTRY
// since this is a one-off brand mark for the AI coach, not a general-purpose
// glyph. Traced from the robot.png reference to match ICON_REGISTRY's solid
// (fill, not stroke) convention. Eyes/mouth are a separate cutout fill (not
// currentColor) since they read as "carved out" of the body, not part of it —
// default white works on the teal icon-chip; pass cutoutColor on dark/white
// backgrounds where the body itself is already white.
export function GavoIcon({ size = 20, className = "", cutoutColor = "white" }: GavoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="3.4" r="2" />
      <rect x="11.1" y="5.6" width="1.8" height="2.6" rx="0.6" />
      <rect x="4" y="8" width="16" height="12.4" rx="3.2" />
      <rect x="1" y="10.6" width="2.6" height="6.6" rx="1.3" />
      <rect x="20.4" y="10.6" width="2.6" height="6.6" rx="1.3" />
      <circle cx="9" cy="13.6" r="1.7" fill={cutoutColor} />
      <circle cx="15" cy="13.6" r="1.7" fill={cutoutColor} />
      <rect x="8.4" y="17.1" width="7.2" height="1.6" rx="0.8" fill={cutoutColor} />
    </svg>
  );
}
