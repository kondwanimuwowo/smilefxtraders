"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input, Field, Button } from "@/components/ui";
import { loginAction, demoLoginAction } from "../actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDemo, setIsDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(data);
      if (result?.error) setError(result.error);
    });
  }

  function handleDemo() {
    setIsDemo(true);
    setError(null);
    startTransition(async () => {
      const result = await demoLoginAction();
      if (result?.error) { setError(result.error); setIsDemo(false); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Eyebrow */}
      <div
        className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2"
        style={{ color: "var(--teal)" }}
      >
        Welcome back
      </div>

      <h1
        className="font-display font-semibold mb-6"
        style={{ fontSize: 26, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}
      >
        Sign in to your desk
      </h1>

      {/* Fields */}
      <div className="grid gap-4 mb-2">
        <Field label="Email">
          <Input type="email" name="email" placeholder="you@email.com" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <Input type="password" name="password" placeholder="••••••••" required autoComplete="current-password" />
        </Field>
      </div>

      {/* Remember + forgot */}
      <div className="flex items-center justify-between mb-5">
        <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: "var(--ink-mid)" }}>
          <input type="checkbox" name="remember" defaultChecked style={{ accentColor: "var(--teal)" }} />
          Remember me
        </label>
        <button type="button" className="text-[13px] font-medium hover:underline" style={{ color: "var(--teal)" }}>
          Forgot password?
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px]" style={{ background: "rgba(234,82,61,0.10)", color: "var(--coral-bright)", border: "1px solid rgba(234,82,61,0.2)" }}>
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth loading={isPending && !isDemo} size="lg">
        Sign in
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
        <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
      </div>

      <Button
        type="button"
        variant="ghost"
        fullWidth
        size="lg"
        loading={isPending && isDemo}
        icon="bolt"
        onClick={handleDemo}
        style={{ borderColor: "var(--line)", color: "var(--ink-mid)" }}
      >
        Continue as demo trader
      </Button>

      <p className="text-center text-[13.5px] mt-6" style={{ color: "var(--ink-mid)" }}>
        New here?{" "}
        <Link href="/signup" className="font-semibold hover:underline" style={{ color: "var(--teal)" }}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
