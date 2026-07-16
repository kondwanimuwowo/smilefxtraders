"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Field, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { loginAction, demoLoginAction } from "../actions";
import { CHECKOUT_PLANS, setPendingPlan } from "@/lib/pending-plan";

// Friendly copy for the ?error= codes /auth/callback redirects here with —
// without this, someone clicking an expired/consumed email link lands on a
// bare login page with no explanation of what happened.
const CALLBACK_ERRORS: Record<string, string> = {
  missing_code: "That link was invalid or already used. If you were confirming your email, it may already be confirmed, so try signing in below.",
  auth_failed:  "That link has expired or was already used. Request a new one and try again.",
  oauth_failed: "Sign-in didn't complete. Please try again.",
};

function SocialButton({ loading, onClick, icon, label }: { loading: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-3 w-full rounded-full font-semibold transition-all active:scale-[0.98] h-[46px] text-[14.5px] bg-panel-2 border border-line text-ink-strong",
        loading ? "cursor-not-allowed opacity-60" : "cursor-pointer opacity-100"
      )}
    >
      {loading ? (
        <Icon name="progress_activity" size={18} className="animate-spin text-ink-dim" />
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
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = planParam && CHECKOUT_PLANS.includes(planParam) ? planParam : null;

  useEffect(() => {
    setPendingPlan(plan);
  }, [plan]);

  const [error, setError] = useState<string | null>(() => {
    const code = searchParams.get("error");
    return code ? CALLBACK_ERRORS[code] ?? "Something went wrong signing you in. Please try again." : null;
  });
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
        router.push(plan ? `/checkout/${plan}` : "/dashboard");
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
        options: { redirectTo: `${window.location.origin}/auth/callback${plan ? `?plan=${plan}` : ""}` },
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
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2 text-teal">
        Welcome back
      </div>

      <h1 className="font-display font-semibold mb-6 text-[26px] tracking-[-0.01em] text-ink-strong">
        Sign in to your desk
      </h1>

      {/* Social */}
      <div className="flex flex-col gap-2.5">
        <SocialButton loading={googleLoading} onClick={handleGoogle} icon="/google.svg" label="Continue with Google" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-line" />
        <span className="text-[12px] text-ink-dim">or</span>
        <div className="flex-1 h-px bg-line" />
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
        <label className="flex items-center gap-2 text-[13px] cursor-pointer text-ink-mid">
          <input type="checkbox" name="remember" defaultChecked className="accent-teal" />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-[13px] font-medium hover:underline text-teal">
          Forgot password?
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px] bg-[rgba(234,82,61,0.10)] text-coral-bright border border-[rgba(234,82,61,0.2)]">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth loading={isPending && !isDemo} size="lg">
        Sign in
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-line" />
        <span className="text-[12px] text-ink-dim">or</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <Button
        type="button"
        variant="ghost"
        fullWidth
        size="lg"
        loading={isPending && isDemo}
        icon="bolt"
        onClick={handleDemo}
        className="border-line text-ink-mid"
      >
        Continue as demo trader
      </Button>

      <p className="text-center text-[13.5px] mt-6 text-ink-mid">
        New here?{" "}
        <Link href={`/signup${plan ? `?plan=${plan}` : ""}`} className="font-semibold hover:underline text-teal">
          Create an account
        </Link>
      </p>
    </form>
  );
}
