"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Input, Field, Button } from "@/components/ui";

type State = "idle" | "loading" | "sent" | "error";

export function ForgotPasswordForm() {
  const [email, setEmail]   = useState("");
  const [state, setState]   = useState<State>("idle");
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setError("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (err) {
      setError(err.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div
          className="size-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(8,174,170,0.12)", border: "2px solid rgba(8,174,170,0.3)" }}
        >
          <span className="material-symbols-rounded ic-fill" style={{ fontSize: 32, color: "var(--teal)" }}>mark_email_read</span>
        </div>
        <div>
          <h1 className="font-display font-semibold mb-2" style={{ fontSize: 24, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
            Check your inbox
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6 }}>
            We sent a reset link to <strong style={{ color: "var(--ink)" }}>{email}</strong>.
            It expires in 1 hour — check your spam folder if you don&apos;t see it.
          </p>
        </div>
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--teal)" }}>
        Password reset
      </div>

      <h1 className="font-display font-semibold mb-2" style={{ fontSize: 26, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
        Forgot your password?
      </h1>
      <p className="mb-6" style={{ fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.6 }}>
        Enter your email and we&apos;ll send you a link to set a new one.
      </p>

      <div className="mb-5">
        <Field label="Email">
          <Input
            type="email"
            name="email"
            placeholder="you@email.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </div>

      {(state === "error") && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px]" style={{ background: "rgba(234,82,61,0.10)", color: "var(--coral-bright)", border: "1px solid rgba(234,82,61,0.2)" }}>
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth size="lg" loading={state === "loading"} iconRight="send">
        Send reset link
      </Button>

      <p className="text-center text-[13.5px] mt-6" style={{ color: "var(--ink-mid)" }}>
        Remembered it?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--teal)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
