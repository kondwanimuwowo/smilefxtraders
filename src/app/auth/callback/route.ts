import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const sbUser = data.user;

  // Check if a Prisma user row already exists
  const existing = await prisma.user.findUnique({
    where: { supabaseId: sbUser.id },
    select: { id: true },
  }).catch(() => null);

  if (!existing) {
    // New Google user — create Prisma row and send to onboarding
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

  return NextResponse.redirect(`${origin}/dashboard`);
}
