import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { prefEnabled } from "@/lib/notif-prefs";
import { handleApiError, readJsonBody, requireString } from "@/lib/api-error";

// ── GET /api/academy/progress — completed lesson IDs for current user ─────────

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return NextResponse.json([], { status: 200 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
    if (!dbUser) return NextResponse.json([], { status: 200 });

    const progress = await prisma.lessonProgress.findMany({
      where:  { userId: dbUser.id, completed: true },
      select: { lessonId: true },
    });

    return NextResponse.json(progress.map((p) => p.lessonId));
  } catch (err) {
    return handleApiError("academy/progress:GET", err);
  }
}

// ── POST /api/academy/progress — mark a lesson complete ──────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await readJsonBody<{ lessonId: string; completed?: boolean }>(req);
    const lessonId = requireString(body.lessonId, "lessonId");
    const completed = body.completed ?? true;

    // An unknown lessonId used to fail the upsert on the foreign key as a 500.
    const lessonExists = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lessonExists) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

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
  } catch (err) {
    return handleApiError("academy/progress:POST", err);
  }
}
