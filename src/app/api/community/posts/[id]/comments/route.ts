import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// ── POST /api/community/posts/[id]/comments — add a comment ──────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { id: true, name: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return NextResponse.json({ error: "Comment text is required" }, { status: 400 });

  const comment = await prisma.postComment.create({
    data: { postId, authorId: dbUser.id, text: text.trim() },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    id:         comment.id,
    name:       comment.author.name,
    avatarSeed: seedFromId(comment.author.id),
    text:       comment.text,
    time:       comment.createdAt.toISOString(),
  }, { status: 201 });
}
