"use client";

import { EmptyState, Button } from "@/components/ui";

/**
 * Shown when (app)/layout.tsx can't load its data.
 *
 * The layout can't delegate this to (app)/error.tsx: in Next.js an error.tsx
 * only catches errors thrown by its segment's *children*, never by the
 * layout at that same level. Throwing from the layout escaped all the way to
 * global-error.tsx, which replaces the whole document and drops the styling.
 * Rendering this instead keeps the failure inside the normal page, on-brand,
 * and recoverable.
 */
export function AppUnavailable() {
  return (
    <div className="min-h-screen grid place-items-center bg-app-bg px-6">
      <EmptyState
        icon="error"
        title="Can't reach our servers right now"
        body="Your account is safe. This is a connection problem on our side, and it usually clears within a few seconds. If it keeps happening, contact support@smilefxtraders.com."
        action={
          <Button variant="primary" size="md" icon="refresh" onClick={() => window.location.reload()}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
