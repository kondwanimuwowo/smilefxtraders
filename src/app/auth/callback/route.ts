import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authCookieOptions } from "@/lib/supabase/cookie-options";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get("code");
  const next       = searchParams.get("next"); // e.g. /reset-password (from forgot-password flow)
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type"); // "invite" | "recovery" — from our custom email template links

  // Supabase's hosted /verify endpoint reports failures (expired or
  // already-consumed links) via error params on the redirect, not a code —
  // surface those as "link expired" rather than the generic missing-code copy.
  if (searchParams.get("error_code") || searchParams.get("error_description")) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (!code && !token_hash) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* route handler — cookie mutations may be ignored */ }
        },
      },
    }
  );

  // Invite/recovery links carry token_hash+type instead of a PKCE code (see
  // supabase/email-templates/*.html). Forward the token to the set-password
  // page UNCONSUMED — the page verifies it client-side in JS. Verifying here
  // (server-side) would let an email link-scanner's prefetch GET burn the
  // one-time token before the user ever clicks; scanners fetch URLs but
  // don't execute scripts, so client-side verification survives them.
  if (token_hash && (type === "invite" || type === "recovery")) {
    const url = new URL("/reset-password", origin);
    url.searchParams.set("token_hash", token_hash);
    url.searchParams.set("type", type);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Password reset flow — redirect to reset page (user is already authenticated)
  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const sbUser = data.user;

  // Check if a Prisma user row already exists. Note: the DB trigger
  // (handle_new_auth_user) now creates a placeholder row the instant
  // auth.users gets a new row — including for brand-new OAuth signups — so
  // `existing` will usually already be truthy here, with an email-prefix
  // name/username rather than the real OAuth identity.
  const existing = await prisma.user.findUnique({
    where: { supabaseId: sbUser.id },
    select: { id: true, instruments: true, email: true },
  }).catch(() => null);

  if (!existing) {
    // Trigger didn't fire for some reason (disabled, migration not applied
    // in this environment, etc) — fall back to creating the row here so
    // OAuth login still works without it.
    const emailPrefix = sbUser.email!.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
    let username = emailPrefix || "trader";
    let suffix = 0;
    while (await prisma.user.findUnique({ where: { username }, select: { id: true } }).catch(() => null)) {
      username = `${emailPrefix}${++suffix}`;
    }

    await prisma.user.create({
      data: {
        supabaseId: sbUser.id,
        email:      sbUser.email!,
        name:       (sbUser.user_metadata?.full_name as string | undefined) ?? emailPrefix,
        username,
        avatarUrl:  (sbUser.user_metadata?.avatar_url as string | undefined) ?? null,
      },
    }).catch(() => null);

    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Trigger already created the row (the common case now) — backfill the
  // real OAuth name/avatar over its email-prefix placeholder while the user
  // hasn't onboarded yet. Once onboarded, leave it alone in case they've
  // since customized their name in Settings.
  if (existing.instruments.length === 0 && sbUser.user_metadata?.full_name) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name:      sbUser.user_metadata.full_name as string,
        avatarUrl: (sbUser.user_metadata?.avatar_url as string | undefined) ?? undefined,
      },
    }).catch(() => null);
  }

  // Confirmed email change — Supabase already updated auth.users; mirror it
  // into Prisma so the rest of the app (Settings, admin student list, etc.)
  // reflects the new address.
  if (sbUser.email && existing.email !== sbUser.email) {
    await prisma.user.update({
      where: { id: existing.id },
      data:  { email: sbUser.email },
    }).catch(() => null);
  }

  // Email-verification signups have a Prisma row (created at signup) but
  // haven't onboarded yet — route by onboarding state, not row existence.
  if (existing.instruments.length === 0) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
