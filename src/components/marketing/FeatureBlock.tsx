import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

interface FeatureBlockCta {
  label: string;
  href: string;
  variant?: "link" | "button";
}

interface FeatureBlockProps {
  icon: string;
  title: string;
  lead: string;
  bullets: string[];
  cta?: FeatureBlockCta;
  className?: string;
}

export function FeatureBlock({ icon, title, lead, bullets, cta, className }: FeatureBlockProps) {
  return (
    <div className={cn("feature-text reveal", className)}>
      <div className="flex items-center gap-3">
        <div className="icon-chip">
          <Icon name={icon} />
        </div>
        <h3 className="m-0">{title}</h3>
      </div>
      <p className="lead">{lead}</p>
      <ul className="feature-list">
        {bullets.map((b) => (
          <li key={b}>
            <Icon name="check_circle" size={22} className="text-teal shrink-0" />
            {b}
          </li>
        ))}
      </ul>
      {cta && (cta.variant === "button" ? (
        <Button href={cta.href} hardNav size="lg" iconRight="arrow_forward">
          {cta.label}
        </Button>
      ) : (
        <Link href={cta.href} className="link-arrow">
          {cta.label} <Icon name="arrow_forward" />
        </Link>
      ))}
    </div>
  );
}
