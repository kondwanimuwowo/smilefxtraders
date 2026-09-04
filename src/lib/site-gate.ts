// Pre-launch site gate — waiting-list mode and maintenance mode. Server-only:
// reads plain (non-NEXT_PUBLIC_) env vars so flipping them on Cloudflare
// takes effect on the next request, no rebuild needed. `=== "1"` matches the
// one existing boolean-flag convention in this codebase (lib/prisma.ts's
// DB_BYPASS_HYPERDRIVE). The one client component that needs this (MarketingNav)
// fetches it from GET /api/site-gate rather than reading env directly, since
// a plain env var isn't available in client-side code.

export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "1";
}

// Maintenance always wins if both are somehow set at once -- fails toward
// the more restrictive state rather than the more permissive one.
export function isWaitlistMode(): boolean {
  return process.env.WAITLIST_MODE === "1" && !isMaintenanceMode();
}
