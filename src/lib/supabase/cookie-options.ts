// Cross-subdomain auth cookies.
//
// The platform serves marketing on smilefxtraders.com and the app on
// app.smilefxtraders.com. For the marketing nav to know the user is logged
// in (and for sign-out to clear the same cookie), the Supabase auth cookie
// must be scoped to the parent domain.
//
// Set NEXT_PUBLIC_COOKIE_DOMAIN=".smilefxtraders.com" in production.
// Leave it unset locally and on Vercel previews so cookies stay host-only.
//
// Getting this wrong locally is a silent, 100%-reproducible break: a cookie
// scoped to .smilefxtraders.com is invalid on localhost, so the browser
// accepts it once (on the response that sets it) and then never sends it
// back on any later request — every subsequent navigation looks logged out,
// with no error anywhere. If this warning fires, unset the var in .env.local.
if (
  process.env.NEXT_PUBLIC_COOKIE_DOMAIN &&
  process.env.NODE_ENV !== "production"
) {
  console.warn(
    `[cookie-options] NEXT_PUBLIC_COOKIE_DOMAIN="${process.env.NEXT_PUBLIC_COOKIE_DOMAIN}" is set outside production. ` +
    "This will silently break auth on localhost/previews — remove it from .env.local."
  );
}

export const authCookieOptions = process.env.NEXT_PUBLIC_COOKIE_DOMAIN
  ? { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }
  : undefined;
