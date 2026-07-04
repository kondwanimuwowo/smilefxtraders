"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Field, Button } from "@/components/ui";

type Status = "verifying" | "ready" | "invalid" | "success";

// One verifyOtp call per token, shared across mounts. React Strict Mode
// double-invokes the mount effect in dev — without this, the remount would
// re-submit the one-time token the first call already consumed, and fail.
// Module state survives the unmount → remount cycle.
const verifyAttempts = new Map<string, Promise<boolean>>();

export function ResetPasswordForm() {
  const router  = useRouter();
  const searchParams = useSearchParams();
  const isInvite = searchParams.get("type") === "invite";

  const [status,    setStatus]    = useState<Status>("verifying");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  // Establish the session. Two entry paths:
  // 1. token_hash in the URL (invite / recovery email links, forwarded
  //    unconsumed by /auth/callback) — verify it here, client-side, so email
  //    link-scanners prefetching the URL can't burn the one-time token.
  // 2. No token but an existing session (e.g. the pre-token_hash email links
  //    still in flight, where the callback already exchanged a code).
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function establish() {
      const tokenHash = searchParams.get("token_hash");
      const type      = searchParams.get("type");

      if (searchParams.get("error_code") || searchParams.get("error_description")) {
        if (!cancelled) setStatus("invalid");
        return;
      }

      if (tokenHash && (type === "recovery" || type === "invite")) {
        let attempt = verifyAttempts.get(tokenHash);
        if (!attempt) {
          attempt = supabase.auth
            .verifyOtp({ token_hash: tokenHash, type })
            .then(({ error: verifyError }) => !verifyError);
          verifyAttempts.set(tokenHash, attempt);
        }
        const ok = await attempt;
        if (cancelled) return;
        setStatus(ok ? "ready" : "invalid");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setStatus(session ? "ready" : "invalid");
    }

    establish();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      setStatus("success");
      // Brief pause so the user sees the success state, then continue —
      // invited users haven't onboarded yet, everyone else goes to dashboard
      setTimeout(() => router.push(isInvite ? "/onboarding" : "/dashboard"), 1800);
    }
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-10">
        <span
          className="rounded-full border-2 border-[var(--teal)] border-t-transparent animate-spin inline-block"
          style={{ width: 28, height: 28 }}
        />
        <p style={{ fontSize: 14.5, color: "var(--ink-mid)" }}>
          {isInvite ? "Verifying your invite…" : "Verifying your reset link…"}
        </p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div
          className="size-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(234,82,61,0.10)", border: "2px solid rgba(234,82,61,0.25)" }}
        >
          <span className="material-symbols-rounded ic-fill" style={{ fontSize: 32, color: "var(--coral)" }}>link_off</span>
        </div>
        <div>
          <h1 className="font-display font-semibold mb-2" style={{ fontSize: 24, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
            Link expired or invalid
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6 }}>
            {isInvite
              ? "This invite link is no longer valid. Ask Kondwani to send you a fresh invite."
              : "This reset link is no longer valid. Links expire after one use or one hour."}
          </p>
        </div>
        {!isInvite && (
          <Button href="/forgot-password" variant="primary" size="lg" iconRight="refresh">
            Request a new link
          </Button>
        )}
        <Link
          href="/login"
          className="text-[13.5px] font-semibold hover:underline"
          style={{ color: "var(--teal)" }}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div
          className="size-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(8,174,170,0.12)", border: "2px solid rgba(8,174,170,0.3)" }}
        >
          <span className="material-symbols-rounded ic-fill" style={{ fontSize: 32, color: "var(--teal)" }}>lock_open</span>
        </div>
        <div>
          <h1 className="font-display font-semibold mb-2" style={{ fontSize: 24, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
            Password set
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--ink-mid)" }}>
            {isInvite ? "Taking you to onboarding…" : "Taking you to your dashboard…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--teal)" }}>
        {isInvite ? "Welcome" : "New password"}
      </div>

      <h1 className="font-display font-semibold mb-6" style={{ fontSize: 26, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
        {isInvite ? "Set your password" : "Set a new password"}
      </h1>

      <div className="grid gap-4 mb-5">
        <Field label="New password" hint="At least 8 characters">
          <Input
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password">
          <Input
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px]" style={{ background: "rgba(234,82,61,0.10)", color: "var(--coral-bright)", border: "1px solid rgba(234,82,61,0.2)" }}>
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth size="lg" loading={saving} iconRight="lock">
        {isInvite ? "Set password" : "Update password"}
      </Button>
    </form>
  );
}
