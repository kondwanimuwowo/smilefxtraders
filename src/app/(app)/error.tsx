"use client";

import { useEffect } from "react";
import { EmptyState, Button } from "@/components/ui";

// Segment-level error boundary for the whole authenticated shell. Without
// this, a failed server component render (e.g. the DB connection blips
// covered in the 2026-08-14 incident) fell through to Next's generic "A
// server error occurred" screen with no recovery but a full page reload.
// reset() re-renders just this segment -- much faster, and often enough on
// its own since these failures are transient (same request usually
// succeeds a second time).
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error-boundary]", error);
  }, [error]);

  return (
    <EmptyState
      icon="error"
      title="Something went wrong loading this page"
      body="This usually clears up on retry — the connection to our servers can occasionally be slow. If it keeps happening, let Kondwani know."
      action={
        <Button variant="primary" size="md" icon="refresh" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
