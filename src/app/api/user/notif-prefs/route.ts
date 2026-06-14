import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type InputJsonValue = Prisma.InputJsonValue;

export interface NotifPrefs {
  alertNotif:     boolean;
  communityNotif: boolean;
  weeklyReport:   boolean;
  emailAlerts:    boolean;
}

const DEFAULTS: NotifPrefs = {
  alertNotif:     true,
  communityNotif: true,
  weeklyReport:   true,
  emailAlerts:    false,
};

// ── GET /api/user/notif-prefs ─────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(DEFAULTS);

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { notifPrefs: true },
  }).catch(() => null);

  const saved = dbUser?.notifPrefs as Partial<NotifPrefs> | null;
  return NextResponse.json({ ...DEFAULTS, ...saved });
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
    alertNotif:     body.alertNotif     ?? true,
    communityNotif: body.communityNotif ?? true,
    weeklyReport:   body.weeklyReport   ?? true,
    emailAlerts:    body.emailAlerts    ?? false,
  };

  await prisma.user.update({
    where: { id: dbUser.id },
    data:  { notifPrefs: prefs as unknown as InputJsonValue },
  });

  return NextResponse.json(prefs);
}
