"use client";

import { useState, useEffect, useTransition } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { Panel, PanelHead, Button, Field, SegRow, MonoInput } from "@/components/ui";
import { updateProfileAction, updateTradingAction } from "@/app/(auth)/actions";
import type { NotifPrefs } from "@/app/api/user/notif-prefs/route";
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
      if (!res.ok) { toast("Cancellation failed — please contact support.", "coral", "error"); return; }
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
          <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink-strong)" }}>Current plan: {planLabel}</div>
          <div className="text-[12px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            Manage billing, upgrade, or cancel below.
          </div>
        </div>
        <Button type="button" variant="ghost" icon="upgrade" onClick={() => window.location.href = "/membership"}>
          Change plan
        </Button>
      </div>
      <Divider />
      <div>
        <div className="text-[13px] font-medium mb-1" style={{ color: "var(--ink-strong)" }}>Cancel subscription</div>
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--ink-dim)" }}>
          Your plan stays active until the end of the current billing period. No pro-rata refunds.
        </p>
        {confirmOpen ? (
          <div
            className="rounded-xl p-4 mb-2"
            style={{ background: "rgba(234,82,61,0.06)", border: "1px solid rgba(234,82,61,0.2)" }}
          >
            <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--coral)" }}>
              Cancel {planLabel}? You&apos;ll lose live alerts, AI reviews, and full Academy access.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)} style={{ flex: 1 }}>Keep plan</Button>
              <Button
                type="button"
                variant="ghost"
                loading={cancelling}
                onClick={handleCancel}
                style={{ flex: 1, color: "var(--coral)", borderColor: "rgba(234,82,61,0.3)" }}
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
            style={{ color: "var(--coral)", borderColor: "rgba(234,82,61,0.3)" }}
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
  return <div className="my-4 border-t" style={{ borderColor: "var(--line)" }} />;
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <div className="text-[13.5px] font-medium" style={{ color: "var(--ink-strong)" }}>{label}</div>
        {sub && <div className="text-[12px] mt-0.5" style={{ color: "var(--ink-dim)" }}>{sub}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--teal)" : "var(--track)" }}
      >
        <span
          className="inline-block size-5 rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(2px)", marginTop: 2 }}
        />
      </button>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function Settings() {
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

  // Sync from server on load
  useEffect(() => {
    if (savedPrefs) {
      setAlertNotif(savedPrefs.alertNotif);
      setCommunityNotif(savedPrefs.communityNotif);
      setWeeklyReport(savedPrefs.weeklyReport);
      setEmailAlerts(savedPrefs.emailAlerts);
    }
  }, [savedPrefs]);

  // Privacy (localStorage)
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [showWinRate,       setShowWinRate]        = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("smfx_privacy");
      if (saved) {
        const p = JSON.parse(saved) as { showOnLeaderboard?: boolean; showWinRate?: boolean };
        if (typeof p.showOnLeaderboard === "boolean") setShowOnLeaderboard(p.showOnLeaderboard);
        if (typeof p.showWinRate       === "boolean") setShowWinRate(p.showWinRate);
      }
    } catch {}
  }, []);

  const PAIRS = pairs.length ? pairs : ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"];

  // ── Server action transitions ──────────────────────────────────────────────

  const [profilePending, startProfileTransition] = useTransition();
  const [tradingPending, startTradingTransition] = useTransition();

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

  function savePrivacy() {
    if (typeof window !== "undefined") {
      localStorage.setItem("smfx_privacy", JSON.stringify({ showOnLeaderboard, showWinRate }));
    }
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
    savePrefs({ alertNotif, communityNotif, weeklyReport, emailAlerts });
  }

  function handleDeleteAccount() {
    toast("Contact support@smilefxtraders.com to delete your account", "gold", "info");
  }

  function toggleInstr(pair: string) {
    setInstr((prev) => prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="view">
      <h1 className="font-display font-bold mb-5" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
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
                    className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)]"
                    style={{ background: "var(--panel-2)", borderColor: "var(--line)", color: "var(--ink-strong)" }}
                  />
                </Field>
                <Field label="Username" half>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: "var(--ink-dim)" }}>@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[@\s]/g, "_").toLowerCase())}
                      placeholder="your_handle"
                      className="w-full rounded-[9px] border pl-7 pr-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)]"
                      style={{ background: "var(--panel-2)", borderColor: "var(--line)", color: "var(--ink-strong)" }}
                    />
                  </div>
                </Field>
              </div>
              <Field label="Email address">
                <div
                  className="px-3 py-2.5 rounded-[9px] text-[13.5px] select-all"
                  style={{ background: "var(--track)", border: "1px solid var(--line)", color: "var(--ink-dim)" }}
                >
                  {email || "—"}
                </div>
                <span className="text-[11px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
                  Managed by Supabase — contact support to change
                </span>
              </Field>
              <Field label="Location">
                <input
                  type="text"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  placeholder="e.g. Lusaka, Zambia"
                  className="w-full rounded-[9px] border px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-[rgba(8,174,170,0.25)] focus:border-[var(--teal)]"
                  style={{ background: "var(--panel-2)", borderColor: "var(--line)", color: "var(--ink-strong)" }}
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
                <div className="h-10 rounded-[10px]" style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }} />
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
                <span className="text-[11.5px] mt-1" style={{ color: "var(--ink-dim)" }}>
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
                <span className="text-[11.5px] mt-1" style={{ color: "var(--ink-dim)" }}>
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
                        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                        style={
                          active
                            ? { background: "var(--teal)", color: "#fff" }
                            : { background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }
                        }
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
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--ink-dim)" }}>
              Deleting your account will permanently remove all your trades, journal entries, and settings. This cannot be undone.
            </p>
            <Button
              type="button"
              variant="ghost"
              icon="delete_forever"
              onClick={handleDeleteAccount}
              style={{ color: "var(--coral)", borderColor: "rgba(234,82,61,0.3)" }}
            >
              Delete account
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
