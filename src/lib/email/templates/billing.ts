// Billing / subscription lifecycle emails — all transactional (never pref-gated).

import { emailLayout, paragraph, noteCard, APP } from "../layout";

const PLAN_LABELS: Record<string, string> = {
  PRO:    "Pro Trader",
  FUNDED: "Funded Track",
  FREE:   "Starter",
};

function planLabel(plan: string): string {
  return PLAN_LABELS[plan] ?? plan;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ── Payment confirmed / receipt ───────────────────────────────────────────────

export function paymentConfirmedEmail(p: {
  name:         string;
  plan:         string;
  amount:       string; // preformatted, e.g. "K750" or "$29"
  billingCycle: string; // "monthly" | "annual"
  reference:    string;
  renewsAt:     Date | null;
}): { subject: string; html: string } {
  const label = planLabel(p.plan);

  const bodyHtml = `
    ${paragraph(`Hey ${p.name.split(" ")[0]}, your payment went through — your <strong style="color:#F8B93D;">${label}</strong> plan is now active. 🎉`)}
    ${noteCard("Receipt", `
      <div style="font-size:13px;font-weight:400;color:#D1E5F0;line-height:2;">
        Plan — <strong style="color:#F0F8FF;">${label} (${p.billingCycle})</strong><br/>
        Amount — <strong style="color:#F0F8FF;">${p.amount}</strong><br/>
        Reference — <span style="font-family:ui-monospace,monospace;color:#7EB8D4;">${p.reference}</span><br/>
        ${p.renewsAt ? `Renews — <strong style="color:#F0F8FF;">${fmtDate(p.renewsAt)}</strong>` : ""}
      </div>`, "rgba(248,185,61,0.2)", "#F8B93D")}
    ${paragraph(`Everything in your plan is unlocked now — live alerts, the full Academy, AI trade reviews, and more.`)}`;

  return {
    subject: `Your ${label} plan is active — receipt inside`,
    html: emailLayout({
      preheader: `Payment confirmed — ${label} is live on your account.`,
      eyebrow:   "Payment confirmed",
      heading:   `You're on ${label} now`,
      sub:       "Thanks for supporting the community.",
      bodyHtml,
      cta:       { label: "Explore your plan →", href: `${APP}/dashboard` },
    }),
  };
}

// ── Payment failed ────────────────────────────────────────────────────────────

export function paymentFailedEmail(p: { name: string; plan: string }): { subject: string; html: string } {
  const label = planLabel(p.plan);

  const bodyHtml = `
    ${paragraph(`Hey ${p.name.split(" ")[0]}, we couldn't process your payment for the <strong style="color:#F0F8FF;">${label}</strong> plan.`)}
    ${paragraph(`No charge was made. This usually happens when the mobile-money prompt times out or there's insufficient balance — you can retry in a minute.`)}`;

  return {
    subject: `Payment issue with your ${label} plan`,
    html: emailLayout({
      preheader: "Your payment didn't go through — no charge was made.",
      eyebrow:   "Payment issue",
      heading:   "That payment didn't go through",
      bodyHtml,
      cta:       { label: "Try again →", href: `${APP}/pricing` },
    }),
  };
}

// ── Cancellation confirmation ─────────────────────────────────────────────────

export function cancellationEmail(p: { name: string; plan: string; accessUntil: Date | null }): { subject: string; html: string } {
  const label = planLabel(p.plan);
  const until = p.accessUntil ? fmtDate(p.accessUntil) : "the end of your billing period";

  const bodyHtml = `
    ${paragraph(`Hey ${p.name.split(" ")[0]}, your <strong style="color:#F0F8FF;">${label}</strong> subscription has been cancelled — sorry to see you go.`)}
    ${noteCard("Access until", `${until}`, "rgba(234,82,61,0.2)", "#EA523D")}
    ${paragraph(`You keep full ${label} access until then. After that your account moves to the free Starter plan — your journal and progress stay safe.`)}
    ${paragraph(`Changed your mind? You can resubscribe any time and pick up right where you left off.`)}`;

  return {
    subject: `Subscription cancelled — access until ${until}`,
    html: emailLayout({
      preheader: `Your ${label} plan is cancelled. Access continues until ${until}.`,
      eyebrow:   "Subscription cancelled",
      heading:   "Your subscription is cancelled",
      bodyHtml,
      cta:       { label: "Resubscribe →", href: `${APP}/pricing` },
    }),
  };
}

// ── Renewal reminder (T-3 days) ───────────────────────────────────────────────

export function renewalReminderEmail(p: { name: string; plan: string; renewsAt: Date }): { subject: string; html: string } {
  const label = planLabel(p.plan);

  const bodyHtml = `
    ${paragraph(`Hey ${p.name.split(" ")[0]}, a quick heads-up: your <strong style="color:#F0F8FF;">${label}</strong> plan renews on <strong style="color:#F8B93D;">${fmtDate(p.renewsAt)}</strong>.`)}
    ${paragraph(`Make sure your mobile-money line has balance so the renewal goes through smoothly. If you'd like to change or cancel your plan, you can do that in Settings before the renewal date.`)}`;

  return {
    subject: `Your ${label} plan renews on ${fmtDate(p.renewsAt)}`,
    html: emailLayout({
      preheader: `Renewal coming up on ${fmtDate(p.renewsAt)}.`,
      eyebrow:   "Renewal reminder",
      heading:   "Your plan renews soon",
      bodyHtml,
      cta:       { label: "Manage subscription →", href: `${APP}/settings` },
    }),
  };
}

// ── Plan expired ──────────────────────────────────────────────────────────────

export function planExpiredEmail(p: { name: string; plan: string }): { subject: string; html: string } {
  const label = planLabel(p.plan);

  const bodyHtml = `
    ${paragraph(`Hey ${p.name.split(" ")[0]}, your <strong style="color:#F0F8FF;">${label}</strong> plan has expired and your account is now on the free Starter plan.`)}
    ${paragraph(`Your journal, stats, and progress are all safe — but live alerts, the full Academy, and AI reviews are paused until you renew.`)}`;

  return {
    subject: `Your ${label} plan has expired`,
    html: emailLayout({
      preheader: "Your paid plan has ended — renew to pick up where you left off.",
      eyebrow:   "Plan expired",
      heading:   "Your plan has expired",
      bodyHtml,
      cta:       { label: "Renew your plan →", href: `${APP}/pricing` },
    }),
  };
}
