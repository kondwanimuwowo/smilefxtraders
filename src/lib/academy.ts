import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Published courses (with their published lessons) plus the current user's
 * completed lesson ids.
 *
 * Server-only. Lives here rather than inside the route handler so the page's
 * server component and /api/academy/courses run the *same* query rather than
 * two implementations that can drift. The page prefetches this directly; the
 * route exists for the client's own refetches after a lesson is completed.
 *
 * Deliberately not called over HTTP from the server component: that would
 * make the Worker issue a subrequest to itself, paying a full network round
 * trip to reach a database it can already talk to.
 */
export async function loadAcademyCourses() {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);

  // courses and the user lookup are independent -- were sequential, each
  // one an extra round trip the request could stall on. Running them
  // together halves the sequential DB hops before completedIds (which does
  // genuinely depend on dbUser.id) can even start. See 2026-08-14
  // query-volume audit.
  const [courses, dbUser] = await Promise.all([
    prisma.course.findMany({
      where:   { published: true },
      orderBy: { order: "asc" },
      select: {
        id: true, slug: true, title: true, description: true,
        tier: true, icon: true, color: true, order: true,
        lessons: {
          where:   { published: true },
          orderBy: { order: "asc" },
          select: {
            id: true, slug: true, title: true, duration: true,
            body: true, summary: true, points: true, order: true,
          },
        },
      },
    }),
    user
      ? prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  let completedIds: string[] = [];
  if (dbUser) {
    const progress = await prisma.lessonProgress.findMany({
      where:  { userId: dbUser.id, completed: true },
      select: { lessonId: true },
    });
    completedIds = progress.map((p) => p.lessonId);
  }

  return { courses, completedIds };
}
