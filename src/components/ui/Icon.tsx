import type { CSSProperties } from "react";
import { ICON_REGISTRY } from "./icons/registry";

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

// `fill` is accepted but unused — every icon in ICON_REGISTRY is a single
// solid/bold SVG (no separate outline variant), so there's nothing left for
// it to toggle. Kept only so the ~40 existing call sites that still pass it
// don't need editing; it's a no-op, not a bug.
export function Icon({ name, size = 20, className = "", style }: IconProps) {
  const Component = ICON_REGISTRY[name];
  // An unregistered name must never crash the page (React #130). Render an
  // empty placeholder of the same footprint and complain in the console.
  if (!Component) {
    console.error(`[Icon] "${name}" is not in ICON_REGISTRY — rendering placeholder`);
    return <span aria-hidden="true" className={className} style={{ display: "inline-block", width: size, height: size, ...style }} />;
  }
  return (
    <Component
      className={className}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    />
  );
}
