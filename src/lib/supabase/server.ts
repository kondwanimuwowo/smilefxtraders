import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions } from "./cookie-options";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component — mutations ignored
          }
        },
      },
    }
  );
}

/**
 * Three-way auth result, because "we could not determine who this is" is not
 * the same answer as "nobody is signed in" and must not be treated as one.
 *
 * The distinction is reliable, and it maps onto how getUser() reports things:
 *
 * - no session cookie at all → *returns* `{ user: null }`      → "anonymous"
 * - session present but unverifiable → *throws*                → "unknown"
 *
 * "unknown" is common enough to matter. src/middleware.ts documents why (see
 * SKIP_AUTH_PREFIXES): a dashboard mounts a burst of parallel /api fetches,
 * getUser() refreshes the token when it is near expiry, and Supabase
 * invalidates a refresh token the moment one request spends it — so every
 * sibling request racing the same refresh throws "Invalid Refresh Token".
 * Middleware avoids this by not authenticating /api at all; any route doing
 * its own auth inherits the race.
 *
 * Collapsing that into "anonymous" is what made a *paying* member get the COT
 * upgrade wall and 4-hour-delayed alerts for a few seconds. Callers should
 * treat "unknown" as retryable (503), never as a denial and never as a pass —
 * a malformed cookie can be planted deliberately to force this state, so
 * failing open here would be a way through the paid gate.
 */
export type AuthState =
  | { state: "authenticated"; user: NonNullable<Awaited<ReturnType<typeof getAuthedUser>>> }
  | { state: "anonymous";     user: null }
  | { state: "unknown";       user: null };

export async function getAuthState(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<AuthState> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { state: "authenticated", user } : { state: "anonymous", user: null };
  } catch (err) {
    // Previously swallowed silently, which is why the failure above was
    // invisible in production for as long as it has been happening.
    console.error("[auth] could not verify session:", err instanceof Error ? err.message : err);
    return { state: "unknown", user: null };
  }
}

// getUser() throws (rather than returning a null user) when the session
// cookie itself is broken — e.g. an invalid/expired refresh token. Route
// handlers that call it directly turn that into an unhandled 500 instead of
// the graceful 401/empty-response they already have for "no user". Use this
// wherever a route just needs "who is this, if anyone" for reading/gating.
//
// Prefer getAuthState() for anything that gates access; this helper cannot
// tell "signed out" from "auth unavailable" and will answer null for both.
export async function getAuthedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
