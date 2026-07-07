import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

interface DirPillProps {
  dir: "long" | "short";
  size?: "sm" | "md";
}

export function DirPill({ dir, size = "md" }: DirPillProps) {
  const isLong = dir === "long";
  const sm = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-[0.06em]",
        sm ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-[3px] text-[11.5px]",
        isLong ? "text-teal-bright bg-[rgba(48,232,223,0.12)]" : "text-coral-bright bg-[rgba(255,89,66,0.12)]"
      )}
    >
      <Icon name={isLong ? "trending_up" : "trending_down"} size={sm ? 13 : 15} />
      {isLong ? "Long" : "Short"}
    </span>
  );
}
