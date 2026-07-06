"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Panel, PanelHead, Button, Field, SegRow, MonoInput } from "@/components/ui";
import { updateProfileAction, updateTradingAction, changeEmailAction } from "@/app/(auth)/actions";
import type { NotifPrefs } from "@/lib/notif-prefs";
import { useInstrumentSymbols } from "@/lib/hooks/useInstruments";

// ── Membership section ────────────────────────────────────────────────────────

function MembershipSection() {
  const { user, setUser, toast } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, startCancel] = useTransition();

  if (!user || user.plan === "free") return null;

  const PLAN_LABELS: Record<string, string> = { pro: "Pro Trader", PRO: "Pro Trader", funded: "Funded Track", FUNDED: "Funded Track" };
  const planLabel = PLAN_LABELS[user.plan] ?? user.plan;

  function handleCancel() {
    if (!user) return;
    const snapshot = user;
    startCancel(async () => {
      const res = await fetch("/api/checkout/cancel", { method: "POST" });
      if (!res.ok) { toast("Cancellation failed. Please contact support.", "coral", "error"); return; }
      setUser({ ...snapshot, role: snapshot.role ?? "student", plan: "free" });
      toast("Subscription cancelled. You keep access until end of billing period.", "gold", "schedule");
      setConfirmOpen(false);
    });
  }

  return (
    <Panel>
      <PanelHead title="Membership" icon="workspace_premium" />
      <div className="flex items-center justify-between gap-4 py-2">
        <div>
          <div className="text-[13.5px] font-semibold text-ink-strong">Current plan: {planLabel}</div>
          <div className="text-[12px] mt-0.5 text-ink-dim">
            Manage billing, upgrade, or cancel below.
          </div>
        </div>
        <Button type="button" variant="ghost" icon="upgrade" onClick={() => window.location.href = "/membership"}>
          Change plan
        </Button>
      </div>
      <Divider />
      <div>
        <div className="text-[13px] font-medium mb-1 text-ink-strong">Cancel subscription</div>
        <p className="text-[12px] leading-relaxed mb-3 text-ink-dim">
          Your plan stays active until the end of the current billing period. No pro-rata refunds.
        </p>
        {confirmOpen ? (
          <div
            className="rounded-xl p-4 mb-2"
            style={{ background: "rgba(234,82,61,0.06)", border: "1px solid rgba(234,82,61,0.2)" }}
          >
            <p className="text-[13px] font-semibold mb-3 text-coral">
              Cancel {planLabel}? You&apos;ll lose live alerts, AI reviews, and full Academy access.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)} className="flex-1">Keep plan</Button>
              <Button
                type="button"
                variant="ghost"
                loading={cancelling}
                onClick={handleCancel}
                className="flex-1 !text-coral !border-[rgba(234,82,61,0.3)]"
              >
                Confirm cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            icon="cancel"
            onClick={() => setConfirmOpen(true)}
            className="!text-coral !border-[rgba(234,82,61,0.3)]"
          >
            Cancel subscription
          </Button>
        )}
      </div>
    </Panel>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <Panel>
      <PanelHead title={title} icon={icon} />
      {children}
    </Panel>
  );
}

function Divider() {
  return <div className="my-4 border-t border-line" />;
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <div className="text-[13.5px] font-medium text-ink-strong">{label}</div>
        {sub && <div className="text-[12px] mt-0.5 text-ink-dim">{sub}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-teal" : "bg-track"}`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function Settings() {
  const router = useRouter();
  const { user, setUser, toast } = useStore();
  const { theme, setTheme } = useTheme();
  const pairs = useInstrumentSymbols();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => setThemeMounted(true), []);

  // Profile fields — initialized empty; synced once the store user loads
  const [name,   setName]   = useState("");
  const [handle, setHandle] = useState(""); // stored without @
  const [email,  setEmail]  = useState("");
  const [loc,    setLoc]    = useState("");

  // Trading fields
  const [riskPct,     setRiskPct]   = useState("0.5");
  const [instruments, setInstr]     = useState<string[]>(["EURUSD", "XAUUSD"]);
  const [experience,  setExperience] = useState<string>("intermediate");
  const [framework,   setFramework]  = useState<string>("SMC");

  // Sync all fields once the store user becomes available (StoreHydrator runs async)
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (user && !synced) {
      setName(user.name ?? "");
      setHandle((user.handle ?? "").replace(/^@/, "")); // strip @ for the input
      setEmail(user.email ?? "");
      setLoc(user.loc ?? "");
      setRiskPct(String(user.riskPct ?? 0.5));
      setInstr(user.instruments?.length ? user.instruments : ["EURUSD", "XAUUSD"]);
      setExperience(user.experience ?? "intermediate");
      setFramework(user.framework ?? "SMC");
      setSynced(true);
    }
  }, [user, synced]);

  // Notifications — loaded from and saved to DB
  const { data: savedPrefs } = useQuery<NotifPrefs>({
    queryKey: ["notif-prefs"],
    queryFn:  () => fetch("/api/user/notif-prefs").then((r) => r.json()),
  });
  const { mutate: savePrefs, isPending: notifPending } = useMutation({
    mutationFn: (prefs: NotifPrefs) =>
      fetch("/api/user/notif-prefs", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(prefs),
      }).then((r) => r.json()),
    onSuccess: () => toast("Notification settings saved", "teal", "check_circle"),
    onError:   () => toast("Failed to save notifications", "coral", "error"),
  });

  const [alertNotif,     setAlertNotif]     = useState(true);
  const [communityNotif, setCommunityNotif] = useState(true);
  const [weeklyReport,   setWeeklyReport]   = useState(true);
  const [emailAlerts,    setEmailAlerts]    = useState(false);
  const [academyNotif,   setAcademyNotif]   = useState(true);

  // Sync from server on load
  useEffect(() => {
    if (savedPrefs) {
      setAlertNotif(savedPrefs.alertNotif);
      setCommunityNotif(savedPrefs.communityNotif);
      setWeeklyReport(savedPrefs.weeklyReport);
      setEmailAlerts(savedPrefs.emailAlerts);
      setAcademyNotif(savedPrefs.academyNotif ?? true);
    }
  }, [savedPrefs]);

  // Privacy — seeded from user.privacyPrefs (DB) with localStorage fallback
  const storedPrivacy = user?.privacyPrefs as { showOnLeaderboard?: boolean; showWinRate?: boolean } | null | undefined;
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(storedPrivacy?.showOnLeaderboard ?? true);
  const [showWinRate,       setShowWinRate]        = useState(storedPrivacy?.showWinRate       ?? true);

  useEffect(() => {
    if (storedPrivacy) return; // already seeded from DB
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("smfx_privacy");
      if (saved) {
        const p = JSON.parse(saved) as { showOnLeaderboard?: boolean; showWinRate?: boolean };
        if (typeof p.showOnLeaderboard === "boolean") setShowOnLeaderboard(p.showOnLeaderboard);
        if (typeof p.showWinRate       === "boolean") setShowWinRate(p.showWinRate);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PAIRS = pairs.length ? pairs : ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"];

  // ── Server action transitions ──────────────────────────────────────────────

  const [profilePending, startProfileTransition] = useTransition();
  const [tradingPending, startTradingTransition] = useTransition();
  const [emailPending,   startEmailTransition]   = useTransition();

  // Change password
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);

  function saveProfile() {
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("username", handle.trim());
    fd.set("location", loc.trim());

    startProfileTransition(async () => {
      const result = await updateProfileAction(fd);
      if (result?.error) {
        toast(result.error, "coral", "error");
      } else {
        if (user) setUser({ ...user, name: name.trim(), handle: handle.trim(), loc: loc.trim() || undefined });
        toast("Profile saved", "teal", "check_circle");
      }
    });
  }

  function saveEmail() {
    const trimmed = email.trim();
    if (!trimmed || trimmed.toLowerCase() === (user?.email ?? "").toLowerCase()) return;

    startEmailTransition(async () => {
      const result = await changeEmailAction(trimmed);
      if (result?.error) {
        toast(result.error, "coral", "error");
      } else {
        toast("Confirmation link sent. Check your new inbox to complete the change.", "gold", "mail");
      }
    });
  }

  async function savePassword() {
    if (newPassword.length < 8) {
      toast("Password must be at least 8 characters", "coral", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Passwords don't match", "coral", "error");
      return;
    }

    setPasswordPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordPending(false);

    if (error) {
      toast(error.message, "coral", "error");
    } else {
      setNewPassword("");
      setConfirmPassword("");
      toast("Password updated", "teal", "check_circle");
    }
  }

  function savePrivacy() {
    if (typeof window !== "undefined") {
      localStorage.setItem("smfx_privacy", JSON.stringify({ showOnLeaderboard, showWinRate }));
    }
    fetch("/api/user/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showOnLeaderboard, showWinRate }),
    }).catch(() => null);
    toast("Privacy settings saved", "teal", "check_circle");
  }

  function saveTrading() {
    const fd = new FormData();
    instruments.forEach((ins) => fd.append("instruments", ins));
    fd.set("riskPct", riskPct);
    fd.set("experience", experience);
    fd.set("framework", framework);

    startTradingTransition(async () => {
      const result = await updateTradingAction(fd);
      if (result?.error) {
        toast(result.error, "coral", "error");
      } else {
        if (user) {
          setUser({
            ...user,
            riskPct: parseFloat(riskPct) || 0.5,
            instruments,
            experience: experience as "beginner" | "intermediate" | "advanced",
            framework,
          });
        }
        toast("Trading preferences saved", "teal", "check_circle");
      }
    });
  }

  function saveNotifications() {
    savePrefs({ alertNotif, communityNotif, weeklyReport, emailAlerts, academyNotif });
  }

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTyped,       setDeleteTyped]       = useState("");
  const [deleting,          setDeleting]          = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res  = await fetch("/api/user/delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Could not delete account", "coral", "error");
        setDeleting(false);
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      toast("Could not reach the server", "coral", "error");
      setDeleting(false);
    }
  }

  function toggleInstr(pair: string) {
    setInstr((prev) => prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="view">
      <h1 className="font-display font-bold mb-5 text-2xl tracking-[-0.02em] text-ink-strong">
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-5">

          {/* Profile */}
          <Section title="Profile" icon="person">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name" half>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)] bg-panel-2 border-line text-ink-strong"
                  />
                </Field>
                <Field label="Username" half>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-dim">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[@\s]/g, "_").toLowerCase())}
                      placeholder="your_handle"
                      className="w-full rounded-[9px] border pl-7 pr-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)] bg-panel-2 border-line text-ink-strong"
                    />
                  </div>
                </Field>
              </div>
              <Field label="Email address">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)] bg-panel-2 border-line text-ink-strong"
                />
                <div className="flex items-center justify-between gap-3 mt-1.5">
                  <span className="text-[11px] text-ink-dim">
                    Changing this sends a confirmation link to the new address.
                  </span>
                  {email.trim().toLowerCase() !== (user?.email ?? "").toLowerCase() && (
                    <Button
                      type="button"
                      variant="ghost"
                      icon="mail"
                      loading={emailPending}
                      onClick={saveEmail}
                      style={{ padding: "5px 12px", fontSize: 12, flexShrink: 0 }}
                    >
                      Confirm change
                    </Button>
                  )}
                </div>
              </Field>
              <Field label="Location">
                <input
                  type="text"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  placeholder="e.g. Lusaka, Zambia"
                  className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)] bg-panel-2 border-line text-ink-strong"
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  icon="save"
                  loading={profilePending}
                  onClick={saveProfile}
                >
                  Save profile
                </Button>
              </div>
            </div>
          </Section>

          {/* Appearance */}
          <Section title="Appearance" icon="palette">
            <Field label="Theme">
              {themeMounted ? (
                <SegRow
                  value={theme ?? "dark"}
                  onChange={setTheme}
                  options={[
                    { v: "light",  l: "Light"  },
                    { v: "dark",   l: "Dark"   },
                    { v: "system", l: "System" },
                  ]}
                />
              ) : (
                <div className="h-10 rounded-[10px] bg-panel-2 border border-line" />
              )}
            </Field>
          </Section>

          {/* Privacy */}
          <Section title="Privacy" icon="lock">
            <ToggleRow
              label="Show on leaderboard"
              sub="Your rank and stats are visible to other community members"
              checked={showOnLeaderboard}
              onChange={setShowOnLeaderboard}
            />
            <Divider />
            <ToggleRow
              label="Show win rate publicly"
              sub="Other traders can see your win rate on your profile"
              checked={showWinRate}
              onChange={setShowWinRate}
            />
            <div className="flex justify-end mt-4">
              <Button type="button" variant="primary" icon="save" onClick={savePrivacy}>
                Save privacy
              </Button>
            </div>
          </Section>

          {/* Security */}
          <Section title="Security" icon="lock">
            <div className="flex flex-col gap-4">
              <Field label="New password" hint="At least 8 characters">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)] bg-panel-2 border-line text-ink-strong"
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)] bg-panel-2 border-line text-ink-strong"
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  icon="lock_reset"
                  loading={passwordPending}
                  disabled={!newPassword || !confirmPassword}
                  onClick={savePassword}
                >
                  Update password
                </Button>
              </div>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Trading preferences */}
          <Section title="Trading preferences" icon="tune">
            <div className="flex flex-col gap-4">
              <Field label="Default risk per trade (%)">
                <MonoInput
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                  placeholder="0.5"
                />
                <span className="text-[11.5px] mt-1 text-ink-dim">
                  Used as the default when logging trades. Recommended: 0.5–1%.
                </span>
              </Field>

              <Field label="Trading framework">
                <SegRow
                  value={framework}
                  onChange={setFramework}
                  options={[
                    { v: "SMC", l: "Smart Money Concepts" },
                    { v: "SnD", l: "Supply & Demand" },
                  ]}
                />
                <span className="text-[11.5px] mt-1 text-ink-dim">
                  Sets your default system in the journal and validator.
                </span>
              </Field>

              <Field label="Experience level">
                <SegRow
                  value={experience}
                  onChange={setExperience}
                  options={[
                    { v: "beginner",     l: "Beginner"     },
                    { v: "intermediate", l: "Intermediate" },
                    { v: "advanced",     l: "Advanced"     },
                  ]}
                />
              </Field>

              <Field label="Instruments I trade">
                <div className="flex flex-wrap gap-2 pt-1">
                  {PAIRS.map((pair) => {
                    const active = instruments.includes(pair);
                    return (
                      <button
                        key={pair}
                        type="button"
                        onClick={() => toggleInstr(pair)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          active ? "bg-teal text-white" : "bg-panel-2 text-ink-dim border border-line"
                        }`}
                      >
                        {pair}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  icon="save"
                  loading={tradingPending}
                  onClick={saveTrading}
                >
                  Save preferences
                </Button>
              </div>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications" icon="notifications">
            <ToggleRow
              label="Setup alerts"
              sub="Notify me when Kondwani posts a new trade alert"
              checked={alertNotif}
              onChange={setAlertNotif}
            />
            <Divider />
            <ToggleRow
              label="Community replies"
              sub="Notify me when someone replies to my post"
              checked={communityNotif}
              onChange={setCommunityNotif}
            />
            <Divider />
            <ToggleRow
              label="Weekly performance report"
              sub="Receive a summary of your journal stats every Sunday"
              checked={weeklyReport}
              onChange={setWeeklyReport}
            />
            <Divider />
            <ToggleRow
              label="Email alerts"
              sub="Receive alert notifications by email as well"
              checked={emailAlerts}
              onChange={setEmailAlerts}
            />
            <Divider />
            <ToggleRow
              label="Academy updates"
              sub="Course milestones and new course releases"
              checked={academyNotif}
              onChange={setAcademyNotif}
            />
            <div className="flex justify-end mt-4">
              <Button type="button" variant="primary" icon="save" loading={notifPending} onClick={saveNotifications}>
                Save notifications
              </Button>
            </div>
          </Section>

          {/* Membership */}
          <MembershipSection />

          {/* Danger zone */}
          <Panel style={{ border: "1px solid rgba(234,82,61,0.25)" }}>
            <PanelHead title="Danger zone" icon="warning" style={{ color: "var(--coral)" }} />
            <p className="text-[13px] leading-relaxed mb-4 text-ink-dim">
              Deleting your account will permanently remove all your trades, journal entries, community posts, and settings. This cannot be undone, and your email address can&apos;t be used to create another account afterward.
            </p>
            {deleteConfirmOpen ? (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(234,82,61,0.06)", border: "1px solid rgba(234,82,61,0.2)" }}
              >
                <p className="text-[13px] font-semibold mb-3 text-coral">
                  Type your username (@{handle || "…"}) to confirm.
                </p>
                <input
                  type="text"
                  value={deleteTyped}
                  onChange={(e) => setDeleteTyped(e.target.value)}
                  placeholder={handle}
                  className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none mb-3 bg-panel-2 border-line text-ink-strong"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setDeleteConfirmOpen(false); setDeleteTyped(""); }}
                    className="flex-1"
                  >
                    Keep account
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    loading={deleting}
                    disabled={deleteTyped.trim().toLowerCase() !== handle.trim().toLowerCase() || !handle}
                    onClick={handleDeleteAccount}
                    className="flex-1 !text-coral !border-[rgba(234,82,61,0.3)]"
                  >
                    Permanently delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                icon="delete_forever"
                onClick={() => setDeleteConfirmOpen(true)}
                className="!text-coral !border-[rgba(234,82,61,0.3)]"
              >
                Delete account
              </Button>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
