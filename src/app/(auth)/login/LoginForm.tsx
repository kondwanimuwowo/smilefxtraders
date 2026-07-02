"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Field, Button } from "@/components/ui";
import { loginAction, demoLoginAction } from "../actions";

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

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDemo, setIsDemo] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(data);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  function handleDemo() {
    setIsDemo(true);
    setError(null);
    startTransition(async () => {
      const result = await demoLoginAction();
      if (result?.error) {
        setError(result.error);
        setIsDemo(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  async function signInWithProvider(provider: "google" | "facebook", setLoading: (v: boolean) => void) {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch {
      setError(`${provider === "google" ? "Google" : "Facebook"} sign-in failed. Please try again.`);
      setLoading(false);
    }
  }

  const handleGoogle = () => signInWithProvider("google", setGoogleLoading);
  // Facebook OAuth disabled until Meta business verification is complete —
  // re-enable by restoring the SocialButton below.

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

      {/* Social */}
      <div className="flex flex-col gap-2.5">
        <SocialButton loading={googleLoading} onClick={handleGoogle} icon="/google.svg" label="Continue with Google" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
        <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
      </div>

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
        <Link href="/forgot-password" className="text-[13px] font-medium hover:underline" style={{ color: "var(--teal)" }}>
          Forgot password?
        </Link>
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
