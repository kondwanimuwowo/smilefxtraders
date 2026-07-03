import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NOTIF_PREF_DEFAULTS, resolvePrefs, type NotifPrefs } from "@/lib/notif-prefs";

type InputJsonValue = Prisma.InputJsonValue;

// ── GET /api/user/notif-prefs ─────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(NOTIF_PREF_DEFAULTS);

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { notifPrefs: true },
  }).catch(() => null);

  return NextResponse.json(resolvePrefs(dbUser?.notifPrefs));
}

// ── PUT /api/user/notif-prefs ─────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as Partial<NotifPrefs>;
  const prefs: NotifPrefs = {
    alertNotif:     body.alertNotif     ?? NOTIF_PREF_DEFAULTS.alertNotif,
    communityNotif: body.communityNotif ?? NOTIF_PREF_DEFAULTS.communityNotif,
    weeklyReport:   body.weeklyReport   ?? NOTIF_PREF_DEFAULTS.weeklyReport,
    emailAlerts:    body.emailAlerts    ?? NOTIF_PREF_DEFAULTS.emailAlerts,
    academyNotif:   body.academyNotif   ?? NOTIF_PREF_DEFAULTS.academyNotif,
  };

  await prisma.user.update({
    where: { id: dbUser.id },
    data:  { notifPrefs: prefs as unknown as InputJsonValue },
  });

  return NextResponse.json(prefs);
}
