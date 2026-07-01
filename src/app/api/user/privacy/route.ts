import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { showOnLeaderboard?: boolean; showWinRate?: boolean } | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { showOnLeaderboard, showWinRate } = body;

  await prisma.user.update({
    where: { supabaseId: user.id },
    data:  { privacyPrefs: { showOnLeaderboard: !!showOnLeaderboard, showWinRate: !!showWinRate } },
  });

  return NextResponse.json({ ok: true });
}
