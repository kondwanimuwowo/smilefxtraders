"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// theme: 0 = light, 1 = dark
function TradaysWidget({ theme }: { theme: 0 | 1 }) {
  const src = `https://www.tradays.com/en/economic-calendar/widget/?mode=2&lang=en&theme=${theme}`;
  return (
    <iframe
      src={src}
      className="w-full h-full border-none block"
      title="Economic Calendar"
    />
  );
}

export function Calendar() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const widgetTheme: 0 | 1 | null = !mounted ? null : resolvedTheme === "light" ? 0 : 1;

  return (
    <div className="view flex flex-col min-h-[calc(100vh-60px)]">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em] text-ink-strong">
          Economic Calendar
        </h1>
        <p className="text-[13px] mt-0.5 text-ink-dim">
          High-impact events that move the pairs: USD, EUR, GBP, NZD. All times UTC.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden h-[calc(100vh-220px)] min-h-[600px] border border-line">
        {widgetTheme !== null && <TradaysWidget key={widgetTheme} theme={widgetTheme} />}
      </div>
    </div>
  );
}
