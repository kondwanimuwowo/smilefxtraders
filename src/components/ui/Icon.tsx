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
  return (
    <Component
      className={className}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    />
  );
}
