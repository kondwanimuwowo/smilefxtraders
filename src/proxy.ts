import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions } from "@/lib/supabase/cookie-options";

const PUBLIC_PREFIXES = ["/login", "/signup", "/onboarding", "/forgot-password", "/reset-password", "/api", "/auth", "/features", "/pricing", "/about", "/learn", "/our-community", "/insights", "/contact", "/stories", "/resources"];
// Note: /api is already public, so /api/webhooks/lenco is covered — no extra entry needed.
const PUBLIC_EXACT    = ["/"]; // exact match only

// Paths that never need the session result at all — each does its own auth
// independently (route handlers via the request-scoped server client, OAuth
// callback/webhooks via their own verification). Skipped before touching
// Supabase, unlike the rest of PUBLIC_PREFIXES below (login/signup etc. are
// public in the sense of not requiring a session, but still need the
// session check to redirect an already-authenticated visitor away).
const SKIP_AUTH_PREFIXES = ["/api", "/auth"];

// ── Host-based domain split ──────────────────────────────────────────
// smilefxtraders.com      → marketing/public pages only
// app.smilefxtraders.com  → the app (dashboard, auth, checkout, api)
// Any other host (localhost, *.vercel.app previews) serves everything,
// so local dev and preview deployments are unaffected.
const MARKETING_HOST = process.env.NEXT_PUBLIC_MARKETING_HOST ?? "smilefxtraders.com";
const APP_HOST       = process.env.NEXT_PUBLIC_APP_HOST       ?? "app.smilefxtraders.com";

const MARKETING_PREFIXES = ["/features", "/pricing", "/about", "/learn", "/our-community"];

function isMarketingPath(pathname: string) {
  return (
    pathname === "/" ||
    MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

function crossHostRedirect(request: NextRequest, host: string, pathname?: string) {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = host;
  url.port = "";
  if (pathname) url.pathname = pathname;
  return NextResponse.redirect(url, 308);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  // Canonicalise www → apex
  if (host === `www.${MARKETING_HOST}`) {
    return crossHostRedirect(request, MARKETING_HOST);
  }

  // App/auth/api traffic on the marketing domain → send to the app subdomain
  if (host === MARKETING_HOST && !isMarketingPath(pathname)) {
    return crossHostRedirect(request, APP_HOST);
  }

  if (host === APP_HOST && isMarketingPath(pathname)) {
    // app root goes to the dashboard (auth guard below bounces to /login if needed)
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // marketing pages live on the apex
    return crossHostRedirect(request, MARKETING_HOST);
  }

  // Skip Supabase entirely for paths whose result is never used here. This
  // matters beyond avoiding wasted work: a dashboard page mounts a burst of
  // ~15 parallel /api/* fetches, and getSession() isn't purely local — when
  // the access token is near expiry it refreshes over the network via the
  // setAll callback. Running that on every one of those parallel requests
  // raced them all against the same refresh token; Supabase invalidates a
  // refresh token the instant one request uses it, so every other
  // concurrent request failed with "Invalid Refresh Token" — and if the
  // actual page navigation lost that race, the guard below saw no session
  // and bounced the whole page back to /login.
  if (SKIP_AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession reads the JWT from the cookie locally when the token is still
  // valid, but refreshes over the network when it's expired. We use it here
  // only for route protection (fast path). The layout server component calls
  // getUser() for proper server-side validation before DB work.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Only redirect authenticated users away from auth pages — not marketing pages
  const isAuthPage = ["/login", "/signup"].some((p) => pathname.startsWith(p));
  if (session && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
