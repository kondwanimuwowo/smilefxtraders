"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Input, Field, Button } from "@/components/ui";
import { signupAction } from "../actions";

function SocialButton({ loading, onClick, icon, label }: { loading: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex items-center justify-center gap-3 w-full rounded-full font-semibold transition-all active:scale-[0.98]"
      style={{
        height: 46,
        fontSize: 14.5,
        background: "var(--panel-2)",
        border: "1px solid var(--line)",
        color: "var(--ink-strong)",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <span className="material-symbols-rounded text-[18px] animate-spin" style={{ color: "var(--ink-dim)" }}>progress_activity</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" width={18} height={18} />
      )}
      {label}
    </button>
  );
}

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signupAction(data);
      if (result?.error) setError(result.error);
    });
  }

  async function signInWithProvider(provider: "google" | "facebook", setLoading: (v: boolean) => void) {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch {
      setError(`${provider === "google" ? "Google" : "Facebook"} sign-up failed. Please try again.`);
      setLoading(false);
    }
  }

  const handleGoogle   = () => signInWithProvider("google",   setGoogleLoading);
  const handleFacebook = () => signInWithProvider("facebook", setFacebookLoading);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--teal)" }}>
        Join the community
      </div>

      <h1 className="font-display font-semibold mb-6" style={{ fontSize: 26, color: "var(--ink-strong)", letterSpacing: "-0.01em" }}>
        Create your account
      </h1>

      {/* Social */}
      <div className="flex flex-col gap-2.5">
        <SocialButton loading={googleLoading}   onClick={handleGoogle}   icon="/google.svg"   label="Continue with Google"   />
        <SocialButton loading={facebookLoading} onClick={handleFacebook} icon="/facebook.svg" label="Continue with Facebook" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
        <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>or sign up with email</span>
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
      </div>

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
