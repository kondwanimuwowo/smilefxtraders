import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { prefEnabled } from "@/lib/notif-prefs";
import { sendEmail } from "@/lib/email/send";
import { communityCommentEmail } from "@/lib/email/templates/community-comment";

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

  // Notify the post author — in-app for every reply; email only for the first
  // reply while they have no unread reply-notification on this post (organic
  // batching: once they read the notification, the next reply emails again).
  void (async () => {
    const post = await prisma.post.findUnique({
      where:  { id: postId },
      select: {
        authorId: true,
        text:     true,
        author:   { select: { name: true, email: true, notifPrefs: true } },
      },
    });
    if (!post || post.authorId === dbUser.id) return;
    if (!prefEnabled(post.author.notifPrefs, "communityNotif")) return;

    const href = `/community?post=${postId}`;
    const hasUnread = await prisma.notification.findFirst({
      where:  { userId: post.authorId, type: "POST_COMMENT", href, readAt: null },
      select: { id: true },
    });

    await createNotification(post.authorId, {
      type:  "POST_COMMENT",
      title: "New reply to your post",
      body:  `${dbUser.name}: ${comment.text.slice(0, 120)}`,
      icon:  "chat_bubble",
      tone:  "teal",
      href,
    });

    if (!hasUnread) {
      const { subject, html } = communityCommentEmail({
        name:          post.author.name,
        commenterName: dbUser.name,
        commentText:   comment.text,
        postExcerpt:   post.text,
      });
      await sendEmail({ from: "hello", to: post.author.email, subject, html });
    }
  })().catch((e) => console.error("[community/comments] notify failed:", e instanceof Error ? e.message : e));

  return NextResponse.json({
    id:         comment.id,
    name:       comment.author.name,
    avatarSeed: seedFromId(comment.author.id),
    text:       comment.text,
    time:       comment.createdAt.toISOString(),
  }, { status: 201 });
}
