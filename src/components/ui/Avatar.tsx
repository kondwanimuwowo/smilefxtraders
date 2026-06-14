const GRADIENTS: [string, string][] = [
  ["#08AEAA", "#1672A1"],
  ["#EA523D", "#F8B93D"],
  ["#1672A1", "#0B425D"],
  ["#F8B93D", "#EA523D"],
  ["#45D8D1", "#08AEAA"],
  ["#0B425D", "#1672A1"],
];

interface AvatarProps {
  seed?: number;
  name?: string;
  size?: number;
  ring?: string;
  className?: string;
}

export function Avatar({ seed = 1, name = "?", size = 36, ring, className = "" }: AvatarProps) {
  const [from, to] = GRADIENTS[seed % GRADIENTS.length];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`shrink-0 rounded-full grid place-items-center font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        color: "#fff",
        fontSize: size * 0.38,
        letterSpacing: "-0.02em",
        boxShadow: ring ? `0 0 0 2px var(--app-bg), 0 0 0 4px ${ring}` : undefined,
      }}
    >
      {initials}
    </div>
  );
}
