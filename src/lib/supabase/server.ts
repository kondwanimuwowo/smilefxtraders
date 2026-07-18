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

// getUser() throws (rather than returning a null user) when the session
// cookie itself is broken — e.g. an invalid/expired refresh token. Route
// handlers that call it directly turn that into an unhandled 500 instead of
// the graceful 401/empty-response they already have for "no user". Use this
// wherever a route just needs "who is this, if anyone" for reading/gating.
export async function getAuthedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
