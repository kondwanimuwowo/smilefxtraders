import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: string;
  iconRight?: string;
  fullWidth?: boolean;
  children?: ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-colors cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary: "text-white",
  ghost: "border",
  outline: "border",
  danger: "border",
};

const SIZES: Record<Size, { cls: string; iconSize: number }> = {
  sm: { cls: "px-3 py-1.5 text-[12.5px] gap-1.5", iconSize: 15 },
  md: { cls: "px-4 py-2 text-[13.5px]", iconSize: 17 },
  lg: { cls: "px-5 py-2.5 text-sm", iconSize: 18 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  style,
  ...props
}: ButtonProps) {
  const { cls: sizeCls, iconSize } = SIZES[size];

  const variantStyle =
    variant === "primary"
      ? {
          background: "linear-gradient(135deg, var(--teal), #069E9A)",
          boxShadow: "0 2px 10px rgba(8,174,170,0.25)",
        }
      : variant === "ghost"
        ? { borderColor: "var(--line)", color: "var(--ink-mid)", background: "transparent" }
        : variant === "danger"
          ? { borderColor: "var(--coral)", color: "var(--coral)", background: "transparent" }
          : { borderColor: "var(--teal)", color: "var(--teal)", background: "transparent" };

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`${BASE} ${VARIANTS[variant]} ${sizeCls} ${fullWidth ? "w-full" : ""} ${props.className ?? ""}`}
      style={{ ...variantStyle, ...style }}
    >
      {loading ? (
        <Spinner size={iconSize} />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}

function Spinner({ size }: { size: number }) {
  return (
    <span
      className="rounded-full border-2 border-current border-t-transparent animate-spin inline-block"
      style={{ width: size, height: size }}
    />
  );
}
