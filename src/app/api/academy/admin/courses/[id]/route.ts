import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";
import { prefEnabled } from "@/lib/notif-prefs";

async function getInstructor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, role: true } });
  if (!dbUser || dbUser.role !== "INSTRUCTOR") return null;
  return dbUser;
}

// GET /api/academy/admin/courses/[id] — single course + all lessons
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" } } },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

// PATCH /api/academy/admin/courses/[id] — update course fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json() as Partial<{
    title: string; description: string; tier: string;
    icon: string; color: string; order: number; published: boolean;
  }>;

  // Detect the unpublished → published transition before writing
  const before = body.published === true
    ? await prisma.course.findUnique({ where: { id }, select: { published: true } })
    : null;

  const course = await prisma.course.update({ where: { id }, data: body });

  // Fan out "new course" to everyone with academy notifications on (in-app
  // only, once per course — dedupeKey blocks re-publish spam)
  if (body.published === true && before && !before.published) {
    void (async () => {
      const users = await prisma.user.findMany({ select: { id: true, notifPrefs: true } });
      const ids = users.filter((u) => prefEnabled(u.notifPrefs, "academyNotif")).map((u) => u.id);
      const count = await createNotifications(ids, {
        type:      "COURSE_PUBLISHED",
        title:     "New course in the Academy",
        body:      `${course.title} is now available.`,
        icon:      "auto_stories",
        tone:      "teal",
        href:      "/academy",
        dedupeKey: `course-published:${course.id}`,
      });
      console.info(`[academy] course-published fan-out: ${count} notifications`);
    })().catch((e) => console.error("[academy] publish fan-out failed:", e instanceof Error ? e.message : e));
  }

  return NextResponse.json(course);
}

// DELETE /api/academy/admin/courses/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
