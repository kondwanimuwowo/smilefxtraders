"use client";

import Script from "next/script";
import { useRef } from "react";

// Turnstile site keys are public by design — this string is served in the page
// HTML to every visitor either way, so it lives here rather than in an env var.
// (A NEXT_PUBLIC_* var would also have to be inlined at build time, which a
// Worker runtime secret is not.) The *secret* key never leaves Supabase.
// Widget: Cloudflare dashboard → Turnstile.
export const TURNSTILE_SITE_KEY = "0x4AAAAAAEQrIxtBvC5iBBYz";

// Minimal surface of the Turnstile script we actually call.
declare global {
  interface Window {
    turnstile?: { reset: (container?: string | HTMLElement) => void };
  }
}

/**
 * Cloudflare Turnstile widget for the auth forms.
 *
 * Shared rather than per-form because Supabase's CAPTCHA protection is a
 * PROJECT-WIDE Auth setting: switching it on guards sign-in and password
 * recovery as well as signup. It was originally wired into the signup form
 * only, which left email/password login and password reset rejecting every
 * attempt with "captcha protection: request disallowed (no captcha_token
 * found)" — OAuth kept working because it does not hit those endpoints.
 *
 * Any new call into supabase.auth that takes a password or an email address
 * needs this widget and needs to forward the token.
 */
export function useTurnstile() {
  const ref = useRef<HTMLDivElement>(null);

  return {
    ref,
    /**
     * Tokens are single-use. Without a reset after a failed attempt every
     * retry fails on an already-redeemed token rather than on the real
     * problem, which reads to the user as "my correct password is wrong".
     */
    reset: () => window.turnstile?.reset(ref.current ?? undefined),
    /** True once the widget has produced a token for this form. */
    hasToken: (data: FormData) => Boolean(data.get("cf-turnstile-response")),
    /**
     * The raw token, read straight out of the widget's own hidden input.
     * For controls that are inside the form but do not submit it -- the demo
     * sign-in button -- where there is no FormData to read from.
     */
    token: () =>
      ref.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? "",
  };
}

export function TurnstileWidget({
  innerRef,
  action,
  className = "mb-4 flex justify-center",
}: {
  innerRef: React.RefObject<HTMLDivElement | null>;
  /** Labels the challenge in Cloudflare's analytics, e.g. "login". */
  action: string;
  className?: string;
}) {
  return (
    <>
      {/* Turnstile injects a hidden `cf-turnstile-response` input here, which
          the surrounding form's own FormData picks up — no wiring needed.
          `auto` follows the visitor's colour scheme so it doesn't glare in
          dark mode. */}
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div
        ref={innerRef}
        className={`cf-turnstile ${className}`}
        data-sitekey={TURNSTILE_SITE_KEY}
        data-action={action}
        data-theme="auto"
      />
    </>
  );
}

/** Shown when the widget has not produced a token yet. */
export const TURNSTILE_PENDING_MESSAGE =
  "Please wait a moment for the security check to finish, then try again.";
