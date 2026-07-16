"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Field, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { signupAction } from "../actions";

const CHECKOUT_PLANS = ["edge", "pro"];

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

export function SignupForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = planParam && CHECKOUT_PLANS.includes(planParam) ? planParam : null;

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signupAction(data);
      if (result?.error) setError(result.error);
      else if (result && "pendingVerification" in result && result.pendingVerification) {
        setPendingEmail(result.email);
      }
    });
  }

  async function handleResend() {
    if (!pendingEmail || resendCooldown > 0) return;
    setResendLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) { clearInterval(timer); return 0; }
          return s - 1;
        });
      }, 1000);
    } finally {
      setResendLoading(false);
    }
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
      setError(`${provider === "google" ? "Google" : "Facebook"} sign-up failed. Please try again.`);
      setLoading(false);
    }
  }

  const handleGoogle = () => signInWithProvider("google", setGoogleLoading);
  // Facebook OAuth disabled until Meta business verification is complete —
  // re-enable by restoring the SocialButton below.

  // ── "Check your email" state (email confirmation required) ────────────────
  if (pendingEmail) {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <div className="size-14 rounded-2xl flex items-center justify-center mb-5 bg-[rgba(8,174,170,0.08)] border border-[rgba(8,174,170,0.2)]">
          <Icon name="mark_email_unread" size={28} className="text-teal" />
        </div>
        <h1 className="font-display font-semibold mb-2 text-[24px] tracking-[-0.01em] text-ink-strong">
          Check your email
        </h1>
        <p className="text-[14px] leading-relaxed mb-1 text-ink-mid">
          We sent a confirmation link to
        </p>
        <p className="text-[14.5px] font-semibold mb-5 text-teal">
          {pendingEmail}
        </p>
        <p className="text-[13px] leading-relaxed mb-6 max-w-[320px] text-ink-dim">
          Click the link in the email to activate your account. If you don&apos;t see it within a minute, check your spam folder.
        </p>
        <Button
          type="button"
          variant="ghost"
          icon="refresh"
          loading={resendLoading}
          disabled={resendCooldown > 0}
          onClick={handleResend}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
        </Button>
        <p className="text-center text-[13.5px] mt-6 text-ink-mid">
          Already verified?{" "}
          <Link href="/login" className="font-semibold hover:underline text-teal">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2 text-teal">
        Join the community
      </div>

      <h1 className="font-display font-semibold mb-6 text-[26px] tracking-[-0.01em] text-ink-strong">
        Create your account
      </h1>

      {/* Social */}
      <div className="flex flex-col gap-2.5">
        <SocialButton loading={googleLoading} onClick={handleGoogle} icon="/google.svg" label="Continue with Google" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-line" />
        <span className="text-[12px] text-ink-dim">or sign up with email</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <input type="hidden" name="plan" value={plan ?? ""} />

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
        <div className="mb-4 rounded-xl px-4 py-3 text-[13px] bg-[rgba(234,82,61,0.10)] text-coral-bright border border-[rgba(234,82,61,0.2)]">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth size="lg" loading={isPending} icon="person_add">
        Create account &amp; continue
      </Button>

      <p className="text-center text-[13.5px] mt-6 text-ink-mid">
        Already a member?{" "}
        <Link href={`/login${plan ? `?plan=${plan}` : ""}`} className="font-semibold hover:underline text-teal">
          Sign in
        </Link>
      </p>
    </form>
  );
}
