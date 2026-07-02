// Cross-subdomain auth cookies.
//
// The platform serves marketing on smilefxtraders.com and the app on
// app.smilefxtraders.com. For the marketing nav to know the user is logged
// in (and for sign-out to clear the same cookie), the Supabase auth cookie
// must be scoped to the parent domain.
//
// Set NEXT_PUBLIC_COOKIE_DOMAIN=".smilefxtraders.com" in production.
// Leave it unset locally and on Vercel previews so cookies stay host-only.
export const authCookieOptions = process.env.NEXT_PUBLIC_COOKIE_DOMAIN
  ? { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }
  : undefined;
