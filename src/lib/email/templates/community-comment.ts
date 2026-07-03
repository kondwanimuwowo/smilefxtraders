import { emailLayout, paragraph, noteCard, APP } from "../layout";

function truncate(s: string, max = 140): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function communityCommentEmail(p: {
  name:          string; // post author
  commenterName: string;
  commentText:   string;
  postExcerpt:   string;
}): { subject: string; html: string } {
  const bodyHtml = `
    ${paragraph(`Hey ${p.name.split(" ")[0]}, <strong style="color:#F0F8FF;">${escapeHtml(p.commenterName)}</strong> replied to your post:`)}
    ${noteCard("Your post", escapeHtml(truncate(p.postExcerpt)))}
    ${noteCard("Their reply", escapeHtml(truncate(p.commentText, 240)), "rgba(8,174,170,0.25)", "#08AEAA")}`;

  return {
    subject: `${p.commenterName} replied to your post`,
    html: emailLayout({
      preheader: truncate(p.commentText, 90),
      eyebrow:   "Community",
      heading:   "You've got a reply",
      bodyHtml,
      cta:       { label: "View the conversation →", href: `${APP}/community` },
      footerNote: `You're receiving community emails because they're enabled in your <a href="${APP}/settings" style="color:#08AEAA;">Settings</a>.`,
    }),
  };
}
