// Billing / subscription lifecycle emails — all transactional (never pref-gated).

import { emailShell, para, receiptTable, centeredCard, APP } from "../layout";

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
  const first = p.name.split(" ")[0];

  const rows = [
    { label: "Plan",      value: `${label} (${p.billingCycle})` },
    { label: "Amount",    value: p.amount, valueColor: "#1B807B" },
    { label: "Reference", value: p.reference },
    ...(p.renewsAt ? [{ label: "Renews", value: fmtDate(p.renewsAt) }] : []),
  ];

  const bodyHtml = [
    para(`Hey ${first}, your payment went through — your ${label} plan is now active. 🎉`),
    receiptTable(rows),
    para(`Everything in your plan is unlocked now — live alerts, the full Academy, AI trade reviews, and more.`),
  ].join("");

  return {
    subject: `Your ${label} plan is active — receipt inside`,
    html: emailShell({
      preheader:  `Payment confirmed — ${label} is live on your account.`,
      eyebrow:    "Payment confirmed",
      heading:    `You're on ${label} now`,
      sub:        "Thanks for supporting the community.",
      bodyHtml,
      ctaLabel:   "Explore your plan →",
      ctaHref:    `${APP}/dashboard`,
    }),
  };
}

// ── Payment failed ────────────────────────────────────────────────────────────

export function paymentFailedEmail(p: { name: string; plan: string }): { subject: string; html: string } {
  const label = planLabel(p.plan);
  const first = p.name.split(" ")[0];

  const bodyHtml = [
    para(`Hey ${first}, we couldn't process your payment for the ${label} plan.`),
    para(`No charge was made. This usually happens when the mobile-money prompt times out or there's insufficient balance — you can retry in a minute.`),
  ].join("");

  return {
    subject: `Payment issue with your ${label} plan`,
    html: emailShell({
      preheader:   "Your payment didn't go through — no charge was made.",
      accentColor: "#EA523D",
      eyebrow:     "Payment issue",
      heading:     "That payment didn't go through",
      bodyHtml,
      ctaLabel:    "Try again →",
      ctaHref:     `${APP}/pricing`,
      ctaColor:    "#EA523D",
    }),
  };
}

// ── Cancellation confirmation ─────────────────────────────────────────────────

export function cancellationEmail(p: {
  name:        string;
  plan:        string;
  accessUntil: Date | null;
}): { subject: string; html: string } {
  const label = planLabel(p.plan);
  const first = p.name.split(" ")[0];
  const until = p.accessUntil ? fmtDate(p.accessUntil) : "the end of your billing period";

  const bodyHtml = [
    para(`Hey ${first}, your ${label} subscription has been cancelled — sorry to see you go.`),
    centeredCard("Access until", until),
    para(`You keep full ${label} access until then. After that your account moves to the free Starter plan — your journal and progress stay safe.`),
    para(`Changed your mind? You can resubscribe any time and pick up right where you left off.`),
  ].join("");

  return {
    subject: `Subscription cancelled — access until ${until}`,
    html: emailShell({
      preheader:    `Your ${label} plan is cancelled. Access continues until ${until}.`,
      eyebrow:      "Subscription cancelled",
      eyebrowColor: "#5C6B73",
      heading:      "Your subscription is cancelled",
      bodyHtml,
      ctaLabel:     "Resubscribe →",
      ctaHref:      `${APP}/pricing`,
    }),
  };
}

// ── Renewal reminder (T-3 days) ───────────────────────────────────────────────

export function renewalReminderEmail(p: {
  name:     string;
  plan:     string;
  renewsAt: Date;
}): { subject: string; html: string } {
  const label = planLabel(p.plan);
  const first = p.name.split(" ")[0];
  const date  = fmtDate(p.renewsAt);

  const bodyHtml = [
    para(`Hey ${first}, a quick heads-up: your ${label} plan renews on <strong style="color:#082A3B;">${date}</strong>.`),
    para(`Make sure your mobile-money line has balance so the renewal goes through smoothly. If you'd like to change or cancel your plan, you can do that in Settings before the renewal date.`),
  ].join("");

  return {
    subject: `Your ${label} plan renews on ${date}`,
    html: emailShell({
      preheader:    `A quick heads-up before your renewal date.`,
      accentColor:  "#F8B93D",
      eyebrow:      "Renewal reminder",
      eyebrowColor: "#D49E34",
      heading:      "Your plan renews soon",
      bodyHtml,
      ctaLabel:     "Manage subscription →",
      ctaHref:      `${APP}/settings`,
    }),
  };
}

// ── Plan expired ──────────────────────────────────────────────────────────────

export function planExpiredEmail(p: { name: string; plan: string }): { subject: string; html: string } {
  const label = planLabel(p.plan);
  const first = p.name.split(" ")[0];

  const bodyHtml = [
    para(`Hey ${first}, your ${label} plan has expired and your account is now on the free Starter plan.`),
    para(`Your journal, stats, and progress are all safe — but live alerts, the full Academy, and AI reviews are paused until you renew.`),
  ].join("");

  return {
    subject: `Your ${label} plan has expired`,
    html: emailShell({
      preheader:   "Your account is now on the free Starter plan.",
      accentColor: "#EA523D",
      eyebrow:     "Plan expired",
      heading:     "Your plan has expired",
      bodyHtml,
      ctaLabel:    "Renew your plan →",
      ctaHref:     `${APP}/pricing`,
      ctaColor:    "#EA523D",
    }),
  };
}
