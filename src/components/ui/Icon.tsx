import type { CSSProperties } from "react";

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

// Outline and filled states are two separate subsetted static font files
// (src/app/material-symbols.css), not one variable font switched via
// fontVariationSettings — the variable Material Symbols font is ~5MB
// unsubsetted, which caused a visible flash of raw ligature text
// ("menu_book") before it finished loading.
export function Icon({ name, size = 20, fill = false, className = "", style }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{
        fontSize: size,
        fontFamily: fill ? '"Material Symbols Rounded Fill"' : '"Material Symbols Rounded"',
        ...style,
      }}
    >
      {name}
    </span>
  );
}
