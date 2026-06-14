import { Icon } from "./Icon";

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
          className="p-0 leading-none"
          style={{
            background: "none",
            border: "none",
            cursor: onChange ? "pointer" : "default",
          }}
        >
          <Icon
            name="star"
            size={size}
            fill={n <= value}
            style={{ color: n <= value ? "var(--gold)" : "var(--ink-dim)" }}
          />
        </button>
      ))}
    </div>
  );
}
