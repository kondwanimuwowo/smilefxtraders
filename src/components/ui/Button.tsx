import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: string;
  iconRight?: string;
  fullWidth?: boolean;
  children?: ReactNode;
  href?: string;
  style?: CSSProperties;
  // Renders a plain <a> instead of next/link's <Link>. Needed for any link
  // that crosses from the marketing apex to the app subdomain (login,
  // signup, dashboard): Link treats a relative href as an internal route
  // and does a client-side RSC fetch to transition, but the proxy's
  // cross-host redirect for those paths then gets blocked by the browser's
  // CORS policy (a cross-origin redirect can't carry Next's RSC request
  // headers). A plain <a> always triggers a normal top-level browser
  // navigation, which follows cross-origin redirects with no CORS
  // involved at all.
  hardNav?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full cursor-pointer select-none transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(135deg,var(--teal),#069E9A)] hover:brightness-105",
  ghost:
    "border border-[var(--line)] text-[var(--ink-mid)] bg-transparent hover:border-[var(--teal)] hover:bg-[var(--teal)] hover:text-white",
  outline:
    "border border-[var(--teal)] text-white bg-[var(--teal)] hover:brightness-105",
  danger:
    "border border-[var(--coral)] text-[var(--coral)] bg-transparent hover:bg-[var(--coral)] hover:text-white",
};

const SIZES: Record<Size, { cls: string; iconSize: number }> = {
  sm: { cls: "px-3.5 py-1.5 text-[12.5px] gap-1.5", iconSize: 15 },
  md: { cls: "px-4 py-2 text-[13.5px]",              iconSize: 17 },
  lg: { cls: "px-5 py-2.5 text-[14px]",              iconSize: 18 },
  xl: { cls: "px-7 py-3.5 text-[15px]",              iconSize: 19 },
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
  href,
  hardNav = false,
  ...props
}: ButtonProps) {
  const { cls: sizeCls, iconSize } = SIZES[size];
  const className = cn(BASE, VARIANTS[variant], sizeCls, fullWidth && "w-full", props.className);

  const content = (
    <>
      {loading ? <Spinner size={iconSize} /> : icon && <Icon name={icon} size={iconSize} />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </>
  );

  if (href) {
    if (hardNav) {
      return (
        <a href={href} className={className} style={style}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={className} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button {...props} disabled={props.disabled || loading} className={className} style={style}>
      {content}
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
