import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions } from "@/lib/supabase/cookie-options";
import { isMaintenanceMode, isWaitlistMode } from "@/lib/site-gate";

const PUBLIC_PREFIXES = ["/login", "/signup", "/onboarding", "/forgot-password", "/reset-password", "/api", "/auth", "/features", "/pricing", "/about", "/learn", "/our-community", "/insights", "/contact", "/stories", "/resources", "/terms", "/privacy", "/risk-disclosure", "/blog", "/careers", "/rulebook", "/waitlist", "/maintenance"];
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

// /rulebook is the apex-only marketing copy of the rulebook. Members read the
// same rules at /rules inside the shell, which is a separate path on purpose:
// route groups are organisational and do not create URL segments, so two pages
// both resolving to /rulebook is a build error regardless of host. Same split
// as /pricing vs /membership and /learn vs /academy.
const MARKETING_PREFIXES = ["/features", "/pricing", "/about", "/learn", "/our-community", "/terms", "/privacy", "/risk-disclosure", "/blog", "/careers", "/contact", "/rulebook", "/waitlist"];

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

// Pre-launch site gate — waiting-list mode and maintenance mode, both
// toggled via env vars (src/lib/site-gate.ts). Checked before anything else
// in this file: a bypass link needs to work regardless of host-split routing
// or which mode is active, including maintenance mode, where nothing else on
// the site is reachable and there's no dependency on being logged in.
const BYPASS_COOKIE = "sfx_gate_bypass";

function checkGateBypass(request: NextRequest): { response: NextResponse | null; bypassed: boolean } {
  const bypassSecret = process.env.SITE_GATE_BYPASS_SECRET;
  if (!bypassSecret) return { response: null, bypassed: false };

  const bypassParam = request.nextUrl.searchParams.get("bypass");
  if (bypassParam === bypassSecret) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("bypass");
    const res = NextResponse.redirect(url);
    res.cookies.set(BYPASS_COOKIE, bypassSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return { response: res, bypassed: true };
  }

  return { response: null, bypassed: request.cookies.get(BYPASS_COOKIE)?.value === bypassSecret };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  const { response: bypassResponse, bypassed } = checkGateBypass(request);
  if (bypassResponse) return bypassResponse;

  // Neither gate ever applies to /api or /auth -- cron/webhook routes must
  // keep running during a launch gate, and GET /api/site-gate itself (which
  // the marketing nav fetches to know whether to show a waitlist CTA) would
  // otherwise redirect to /waitlist and break on non-JSON.
  const skipGate = SKIP_AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // Maintenance mode is a total gate -- skip host-split entirely (bouncing
  // an apex-domain visitor to the app subdomain just to see a splash page is
  // pointless extra latency while the whole site is down anyway) and send
  // every path except the splash itself there, on whichever host it came in on.
  if (!bypassed && !skipGate && isMaintenanceMode() && pathname !== "/maintenance") {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.redirect(url);
  }

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

  // Waiting-list mode: the marketing site stays browsable, but /pricing and
  // the whole authenticated app are unreachable, and no page here leads to
  // login/signup/onboarding. Reuses isMarketingPath (already pathname-only)
  // -- a request passes through untouched only if it's a marketing page and
  // not /pricing; everything else (including /login, /signup, /onboarding,
  // and the entire (app) tree) redirects to /waitlist.
  if (!bypassed && !skipGate && isWaitlistMode() && pathname !== "/waitlist") {
    const allowed = isMarketingPath(pathname) && pathname !== "/pricing";
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/waitlist";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Skip Supabase entirely for paths whose result is never used here. This
  // matters beyond avoiding wasted work: a dashboard page mounts a burst of
  // ~15 parallel /api/* fetches, and getUser() refreshes the token over the
  // network when it's near expiry via the setAll callback. Running that on
  // every one of those parallel requests raced them all against the same
  // refresh token; Supabase invalidates a refresh token the instant one
  // request uses it, so every other concurrent request failed with "Invalid
  // Refresh Token" — and if the actual page navigation lost that race, the
  // guard below saw no user and bounced the whole page back to /login.
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

  // getUser() is the server-verified check (network round-trip to Supabase)
  // — getSession() only decodes the JWT locally and is not guaranteed to
  // reflect a token Supabase has actually revalidated. The layout server
  // component below also calls getUser() before DB work; using it here too
  // keeps both auth checks consistent instead of trusting a local decode in
  // one place and a verified check in the other.
  //
  // This is a network call middleware previously left unguarded -- a
  // transient failure reaching Supabase Auth threw an unhandled exception
  // here, taking down every request through middleware (every page nav)
  // with a generic 500 instead of the page-level handling (app)/layout.tsx
  // already has for the exact same call. Treat a throw the same way: no
  // verified user, so the redirect-to-login-if-not-public path below still
  // applies instead of the whole request blowing up.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    console.error("[middleware]", err);
  }

  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  // Only redirect authenticated users away from auth pages — not marketing pages
  const isAuthPage = ["/login", "/signup"].some((p) => pathname.startsWith(p));
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Static and machine-facing files are excluded from the auth guard.
    // Every request for them arrives anonymous, so without this the guard
    // redirected them to /login and a crawler asking for the sitemap got a
    // login page. Excluding them also skips a Supabase session lookup per
    // crawl.
    //
    // The extension list covers site-verification files too (Bing's
    // BingSiteAuth.xml, Google's google<hash>.html), which is why xml, txt,
    // json and html are in there. The named robots/sitemap/llms entries are
    // now redundant with it but kept as documentation of intent.
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|json|webmanifest|html)$).*)",
  ],
};
