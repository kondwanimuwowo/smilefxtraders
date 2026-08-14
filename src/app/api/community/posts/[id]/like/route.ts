import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { prefEnabled } from "@/lib/notif-prefs";
import { handleApiError } from "@/lib/api-error";
import { Prisma } from "@/generated/prisma/client";

// ── POST /api/community/posts/[id]/like — toggle like ────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, name: true } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Liking a deleted post used to reach postLike.create and fail on the
    // foreign key (P2003) as a 500 — a stale feed in an open tab is a 404.
    const postExists = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!postExists) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: dbUser.id } },
    });

    if (existing) {
      // deleteMany, not delete: a double-click racing itself would otherwise
      // hit "record not found" (P2025) on the second request.
      await prisma.postLike.deleteMany({ where: { postId, userId: dbUser.id } });
      const count = await prisma.postLike.count({ where: { postId } });
      return NextResponse.json({ liked: false, likes: count });
    } else {
      // Same race in the other direction: two concurrent likes both miss the
      // findUnique above, and the loser violates the unique constraint. That's
      // the desired end state anyway, so treat it as success.
      await prisma.postLike.create({ data: { postId, userId: dbUser.id } }).catch((e) => {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null;
        throw e;
      });
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
  } catch (err) {
    return handleApiError("community/like", err);
  }
}
