// Tracks a plan chosen before the user has an account, independent of
// Supabase's email-confirmation / OAuth redirect handling — those don't
// reliably preserve extra query params appended to emailRedirectTo/redirectTo,
// so we own this decision via a same-origin cookie instead of trusting a
// third party to echo a query string back intact.

export const PENDING_PLAN_COOKIE = "pending_plan";
export const CHECKOUT_PLANS = ["edge", "pro"];

export type CheckoutPlan = "edge" | "pro";

function isValidPlan(value: string | null | undefined): value is CheckoutPlan {
  return !!value && CHECKOUT_PLANS.includes(value);
}

// ── Client (browser) ─────────────────────────────────────────────────────────

export function getPendingPlan(): CheckoutPlan | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${PENDING_PLAN_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return isValidPlan(value) ? value : null;
}

export function setPendingPlan(plan: string | null | undefined): void {
  if (typeof document === "undefined" || !isValidPlan(plan)) return;
  const maxAge = 60 * 60; // 1 hour — a stale abandoned checkout shouldn't resurface days later
  document.cookie = `${PENDING_PLAN_COOKIE}=${encodeURIComponent(plan)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearPendingPlan(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PENDING_PLAN_COOKIE}=; path=/; max-age=0`;
}

// ── Server (Server Actions / Route Handlers) ─────────────────────────────────
// Callers pass in the value read via next/headers' cookies() — kept
// dependency-free here so this file works in both client and server bundles.

export function resolvePendingPlan(value: string | undefined | null): CheckoutPlan | null {
  return isValidPlan(value) ? value : null;
}
