"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input, Field, Button, Icon } from "@/components/ui";

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

    const supabase = createClient();

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
        <div className="size-16 rounded-full flex items-center justify-center bg-[rgba(8,174,170,0.12)] border-2 border-[rgba(8,174,170,0.3)]">
          <Icon name="mark_email_read" size={32} className="text-teal" />
        </div>
        <div>
          <h1 className="font-display font-medium mb-2 text-[24px] tracking-[-0.01em] text-ink-strong">
            Check your inbox
          </h1>
          <p className="text-[14.5px] leading-[1.6] text-ink-mid">
            We sent a reset link to <strong className="text-ink">{email}</strong>.
            It expires in 1 hour. Check your spam folder if you don&apos;t see it.
          </p>
        </div>
        <Link href="/login" className="text-[13.5px] font-semibold hover:underline text-teal">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2 text-teal">
        Password reset
      </div>

      <h1 className="font-display font-medium mb-2 text-[26px] tracking-[-0.01em] text-ink-strong">
        Forgot your password?
      </h1>
      <p className="mb-6 text-[14.5px] leading-[1.6] text-ink-mid">
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
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px] bg-[rgba(234,82,61,0.10)] text-coral-bright border border-[rgba(234,82,61,0.2)]">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth size="lg" loading={state === "loading"} iconRight="send">
        Send reset link
      </Button>

      <p className="text-center text-[13.5px] mt-6 text-ink-mid">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold hover:underline text-teal">
          Sign in
        </Link>
      </p>
    </form>
  );
}
