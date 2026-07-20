import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

interface MarketingCardProps {
  icon?: string;
  iconNode?: ReactNode;
  title: string;
  description: ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
  dataDelay?: number;
}

export function MarketingCard({ icon, iconNode, title, description, href, linkLabel, className, dataDelay }: MarketingCardProps) {
  return (
    <div className={cn("card tool-card", className)} data-delay={dataDelay}>
      <div className="flex items-center gap-3 mb-3">
        <div className="icon-chip shrink-0">
          {iconNode ?? (icon && <Icon name={icon} size={32} className="leading-none" />)}
        </div>
        <h3 className="m-0 font-bold">{title}</h3>
      </div>
      <p>{description}</p>
      {href && (
        <Link href={href} className="link-arrow mt-auto pt-3">
          {linkLabel ?? "Learn more"} <Icon name="arrow_forward" />
        </Link>
      )}
    </div>
  );
}
