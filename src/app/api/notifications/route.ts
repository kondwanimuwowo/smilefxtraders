import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getDbUserId(): Promise<string | null> {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { id: true },
  }).catch(() => null);
  return dbUser?.id ?? null;
}

// ── GET /api/notifications — latest visible + unread count ───────────────────

export async function GET() {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ notifications: [], unreadCount: 0 });

  const now = new Date();
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where:   { userId, visibleAt: { lte: now } },
      orderBy: { visibleAt: "desc" },
      take:    50,
    }),
    prisma.notification.count({
      where: { userId, visibleAt: { lte: now }, readAt: null },
    }),
  ]);

  return NextResponse.json({
    notifications: rows.map((n) => ({
      id:     n.id,
      icon:   n.icon,
      tone:   n.tone,
      title:  n.title,
      body:   n.body,
      href:   n.href ?? undefined,
      time:   n.visibleAt.toISOString(),
      unread: n.readAt === null,
    })),
    unreadCount,
  });
}

// ── PATCH /api/notifications — mark read ({ id } or { all: true }) ───────────

export async function PATCH(req: NextRequest) {
  const userId = await getDbUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { id?: string; all?: boolean };
  const now = new Date();

  if (body.all) {
    const res = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data:  { readAt: now },
    });
    return NextResponse.json({ marked: res.count });
  }

  if (body.id) {
    const res = await prisma.notification.updateMany({
      where: { id: body.id, userId, readAt: null },
      data:  { readAt: now },
    });
    return NextResponse.json({ marked: res.count });
  }

  return NextResponse.json({ error: "Provide { id } or { all: true }" }, { status: 400 });
}
