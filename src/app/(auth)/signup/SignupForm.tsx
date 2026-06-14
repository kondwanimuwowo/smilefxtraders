"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input, Field, Button } from "@/components/ui";
import { signupAction } from "../actions";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signupAction(data);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--teal)" }}>
        Join the community
      </div>

      <h1 className="font-display font-semibold mb-6" style={{ fontSize: 26, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
        Create your account
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="Full name" half>
          <Input name="name" placeholder="Mwila Kunda" required autoComplete="name" />
        </Field>
        <Field label="Username" half>
          <Input name="username" placeholder="@mwila_ict" required />
        </Field>
        <Field label="Email" style={{ gridColumn: "1 / -1" }}>
          <Input type="email" name="email" placeholder="you@email.com" required autoComplete="email" />
        </Field>
        <Field label="Password" hint="At least 8 characters" style={{ gridColumn: "1 / -1" }}>
          <Input type="password" name="password" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
        </Field>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px]" style={{ background: "rgba(234,82,61,0.10)", color: "var(--coral-bright)", border: "1px solid rgba(234,82,61,0.2)" }}>
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth size="lg" loading={isPending} icon="person_add">
        Create account &amp; continue
      </Button>

      <p className="text-center text-[13.5px] mt-6" style={{ color: "var(--ink-mid)" }}>
        Already a member?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--teal)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
