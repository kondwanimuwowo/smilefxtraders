import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { prefEnabled } from "@/lib/notif-prefs";

// ── GET /api/academy/progress — completed lesson IDs for current user ─────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 200 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
  if (!dbUser) return NextResponse.json([], { status: 200 });

  const progress = await prisma.lessonProgress.findMany({
    where:  { userId: dbUser.id, completed: true },
    select: { lessonId: true },
  });

  return NextResponse.json(progress.map((p) => p.lessonId));
}

// ── POST /api/academy/progress — mark a lesson complete ──────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { lessonId, completed = true } = await req.json() as { lessonId: string; completed?: boolean };

  // Upsert — create or update the progress record
  const progress = await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId: dbUser.id, lessonId } },
    update: { completed, completedAt: completed ? new Date() : null },
    create: { userId: dbUser.id, lessonId, completed, completedAt: completed ? new Date() : null },
  });

  // If this completion finished the course, celebrate (in-app only, once —
  // dedupeKey blocks repeats)
  if (completed && prefEnabled(dbUser.notifPrefs, "academyNotif")) {
    void (async () => {
      const lesson = await prisma.lesson.findUnique({
        where:  { id: lessonId },
        select: { courseId: true, course: { select: { title: true } } },
      });
      if (!lesson?.courseId) return;

      const [totalLessons, completedLessons] = await Promise.all([
        prisma.lesson.count({ where: { courseId: lesson.courseId, published: true } }),
        prisma.lessonProgress.count({
          where: {
            userId:    dbUser.id,
            completed: true,
            lesson:    { courseId: lesson.courseId, published: true },
          },
        }),
      ]);

      if (totalLessons > 0 && completedLessons >= totalLessons) {
        await createNotification(dbUser.id, {
          type:      "COURSE_COMPLETED",
          title:     "Course completed 🎉",
          body:      `You finished ${lesson.course?.title ?? "a course"}. Well done!`,
          icon:      "school",
          tone:      "gold",
          href:      "/academy",
          dedupeKey: `course-completed:${lesson.courseId}`,
        });
      }
    })().catch((e) => console.error("[academy/progress] notify failed:", e instanceof Error ? e.message : e));
  }

  return NextResponse.json({ lessonId: progress.lessonId, completed: progress.completed });
}
