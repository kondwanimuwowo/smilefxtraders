import { notFound } from "next/navigation";
import Link from "next/link";
import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { CourseEditorClient } from "./CourseEditorClient";

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireInstructor();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where:   { id },
    include: { lessons: { orderBy: { order: "asc" } } },
  });

  if (!course) notFound();

  return (
    <div className="view">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/academy"
          className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity text-ink-dim"
        >
          <span className="material-symbols-rounded text-[17px]">arrow_back</span>
          Course Builder
        </Link>
        <span className="text-line">›</span>
        <span className="text-[13px] font-medium text-ink-strong">{course.title}</span>
      </div>

      <CourseEditorClient course={course} />
    </div>
  );
}
