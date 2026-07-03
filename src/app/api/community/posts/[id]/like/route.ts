import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { prefEnabled } from "@/lib/notif-prefs";

// ── POST /api/community/posts/[id]/like — toggle like ────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, name: true } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: dbUser.id } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    const count = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked: false, likes: count });
  } else {
    await prisma.postLike.create({ data: { postId, userId: dbUser.id } });
    const count = await prisma.postLike.count({ where: { postId } });

    // Notify the post author (in-app only, never for self-likes; the
    // dedupeKey means like→unlike→like doesn't re-notify)
    void (async () => {
      const post = await prisma.post.findUnique({
        where:  { id: postId },
        select: { authorId: true, author: { select: { notifPrefs: true } } },
      });
      if (!post || post.authorId === dbUser.id) return;
      if (!prefEnabled(post.author.notifPrefs, "communityNotif")) return;
      await createNotification(post.authorId, {
        type:      "POST_LIKE",
        title:     "New like on your post",
        body:      `${dbUser.name} liked your post.`,
        icon:      "favorite",
        tone:      "teal",
        href:      "/community",
        dedupeKey: `like:${postId}:${dbUser.id}`,
      });
    })().catch((e) => console.error("[community/like] notify failed:", e instanceof Error ? e.message : e));

    return NextResponse.json({ liked: true, likes: count });
  }
}
