"use client";

import { useEffect } from "react";
import { EmptyState, Button } from "@/components/ui";

// The checkout route group sits outside (app), so the shell's error boundary
// never covered it — a throw here showed Next's generic error screen in the
// middle of a payment flow, with no indication of whether money had moved.
// The copy below is deliberate: never imply the charge failed, because a
// render error tells us nothing about the collection's state. /settings
// shows the authoritative plan status.
export default function CheckoutError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[checkout-error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <EmptyState
        icon="error"
        title="This page didn't load"
        body="If you already approved a payment, don't pay again. Check your plan on the settings page first, and contact support if it hasn't updated."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="primary" size="md" icon="refresh" onClick={reset}>
              Try again
            </Button>
            <Button variant="ghost" size="md" href="/settings">
              Check my plan
            </Button>
          </div>
        }
      />
    </div>
  );
}
