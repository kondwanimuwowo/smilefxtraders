"use client";

import { useEffect } from "react";
import { EmptyState, Button } from "@/components/ui";

// Marketing pages had no error boundary at all — a throw in any of them
// (several read from Prisma for pricing/community content) fell through to
// Next's generic "A server error occurred" screen. That screen is unbranded
// and offers no recovery, which is a bad first impression on the public site.
export default function MarketingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[marketing-error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <EmptyState
        icon="error"
        title="This page didn't load"
        body="Something went wrong on our side. Try again, since it usually works on a second attempt."
        action={
          <Button variant="primary" size="md" icon="refresh" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
