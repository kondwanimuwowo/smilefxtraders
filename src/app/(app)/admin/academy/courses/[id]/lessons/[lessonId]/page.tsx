import { notFound } from "next/navigation";
import Link from "next/link";
import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { LessonEditorClient } from "./LessonEditorClient";

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  await requireInstructor();
  const { id, lessonId } = await params;

  const [course, lesson] = await Promise.all([
    prisma.course.findUnique({ where: { id }, select: { id: true, title: true } }),
    prisma.lesson.findUnique({ where: { id: lessonId } }),
  ]);

  if (!course || !lesson) notFound();

  return (
    <div className="view">
      <div className="mb-6 flex items-center gap-2 flex-wrap text-[13px]">
        <Link href="/admin/academy" className="hover:opacity-70 transition-opacity text-ink-dim">
          Course Builder
        </Link>
        <span className="text-line">›</span>
        <Link href={`/admin/academy/courses/${id}`} className="hover:opacity-70 transition-opacity text-ink-dim">
          {course.title}
        </Link>
        <span className="text-line">›</span>
        <span className="text-ink-strong">{lesson.title}</span>
      </div>

      <LessonEditorClient courseId={id} lesson={lesson} />
    </div>
  );
}
