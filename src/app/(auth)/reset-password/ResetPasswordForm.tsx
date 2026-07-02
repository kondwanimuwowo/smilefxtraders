"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Field, Button } from "@/components/ui";

type State = "idle" | "loading" | "success" | "error";

export function ResetPasswordForm() {
  const router  = useRouter();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [state,     setState]     = useState<State>("idle");
  const [error,     setError]     = useState("");

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

    setState("loading");

    const supabase = createClient();

    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setState("error");
    } else {
      setState("success");
      // Brief pause so the user sees the success state, then go to dashboard
      setTimeout(() => router.push("/dashboard"), 1800);
    }
  }

  if (state === "success") {
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
            Password updated
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--ink-mid)" }}>
            Taking you to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--teal)" }}>
        New password
      </div>

      <h1 className="font-display font-semibold mb-6" style={{ fontSize: 26, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
        Set a new password
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

      <Button type="submit" variant="primary" fullWidth size="lg" loading={state === "loading"} iconRight="lock">
        Update password
      </Button>
    </form>
  );
}
