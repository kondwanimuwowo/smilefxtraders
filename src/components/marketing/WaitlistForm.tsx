"use client";

import { useState, useTransition } from "react";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { subscribeToWaitlist } from "@/app/(marketing)/waitlist/actions";

interface WaitlistFormProps {
  source: "waitlist" | "maintenance";
  /** Pass a lighter palette when this sits on a dark splash background. */
  onDark?: boolean;
}

export function WaitlistForm({ source, onDark = false }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await subscribeToWaitlist(data);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-2xl px-5 py-4 text-[14.5px] font-medium",
          onDark ? "bg-[rgba(255,255,255,0.08)] text-white" : "bg-teal-tint-soft text-teal-deep"
        )}
      >
        <Icon name="check_circle" size={18} />
        You&apos;re on the list — we&apos;ll email you at launch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input type="hidden" name="source" value={source} />
      <div className="flex-1">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={cn(
            "w-full rounded-full px-5 py-3 text-[14.5px] outline-none transition-shadow",
            onDark
              ? "bg-[rgba(255,255,255,0.1)] text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/40"
              : "bg-panel-2 text-ink-strong placeholder:text-ink-dim focus:ring-2 focus:ring-teal-deep"
          )}
        />
        {error && (
          <p className={cn("text-[12.5px] mt-2 px-1", onDark ? "text-[#FF9B8C]" : "text-coral-deep")}>
            {error}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" loading={isPending} iconRight="arrow_forward">
        Join the waitlist
      </Button>
    </form>
  );
}
