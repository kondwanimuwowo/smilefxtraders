import { Icon } from "./Icon";

interface DirPillProps {
  dir: "long" | "short";
  size?: "sm" | "md";
}

export function DirPill({ dir, size = "md" }: DirPillProps) {
  const isLong = dir === "long";
  const sm = size === "sm";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide"
      style={{
        padding: sm ? "2px 8px" : "3px 10px",
        fontSize: sm ? 10.5 : 11.5,
        letterSpacing: "0.06em",
        color: isLong ? "var(--teal-bright)" : "var(--coral-bright)",
        background: isLong ? "rgba(48,232,223,0.12)" : "rgba(255,89,66,0.12)",
      }}
    >
      <Icon name={isLong ? "trending_up" : "trending_down"} size={sm ? 13 : 15} />
      {isLong ? "Long" : "Short"}
    </span>
  );
}
