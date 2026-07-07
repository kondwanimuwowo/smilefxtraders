import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

interface StarsProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}

export function Stars({ value, onChange, size = 18 }: StarsProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={cn("p-0 leading-none bg-transparent border-none", onChange ? "cursor-pointer" : "cursor-default")}
        >
          <Icon
            name="star"
            size={size}
            fill={n <= value}
            className={n <= value ? "text-gold" : "text-ink-dim"}
          />
        </button>
      ))}
    </div>
  );
}
