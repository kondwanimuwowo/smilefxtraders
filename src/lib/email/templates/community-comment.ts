import { emailShell, para, postCard, replyCard, APP } from "../layout";

function truncate(s: string, max = 140): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function communityCommentEmail(p: {
  name:          string; // post author
  commenterName: string;
  commentText:   string;
  postExcerpt:   string;
}): { subject: string; html: string } {
  const bodyHtml = [
    para(`Hey ${p.name.split(" ")[0]}, <strong style="color:#082A3B;">${escapeHtml(p.commenterName)}</strong> replied to your post:`),
    postCard(escapeHtml(truncate(p.postExcerpt))),
    replyCard(
      escapeHtml(p.commenterName),
      initials(p.commenterName),
      escapeHtml(truncate(p.commentText, 240)),
    ),
  ].join("");

  return {
    subject: `${p.commenterName} replied to your post`,
    html: emailShell({
      preheader:  `"${truncate(p.commentText, 90)}"`,
      eyebrow:    "Community",
      heading:    "You've got a reply",
      bodyHtml,
      ctaLabel:   "View the conversation →",
      ctaHref:    `${APP}/community`,
      footerNote: `You're receiving community emails because they're enabled in your <a href="${APP}/settings" style="color:#1B807B;">Settings</a>.`,
    }),
  };
}
