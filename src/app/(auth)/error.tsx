"use client";

import { useEffect } from "react";
import { EmptyState, Button } from "@/components/ui";

// Auth pages had no error boundary. A Supabase blip during login or signup
// dropped the user on Next's generic error screen with no way back to the
// form — the worst possible place to strand someone, since they can't reach
// the app at all from there.
export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[auth-error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <EmptyState
        icon="error"
        title="We couldn't load this step"
        body="The connection to our servers hiccuped. Try again, or head back to sign in."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="primary" size="md" icon="refresh" onClick={reset}>
              Try again
            </Button>
            <Button variant="ghost" size="md" href="/login">
              Back to sign in
            </Button>
          </div>
        }
      />
    </div>
  );
}
