"use client";

import { useEffect, useState } from "react";
import { Button, Icon, Modal } from "@/components/ui";
import { getConsent, setConsent, type ConsentCategory } from "@/lib/cookie-consent";

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVisible(getConsent() === null);
  }, []);

  function acceptAll() {
    setConsent(["necessary", "analytics"]);
    setVisible(false);
    setPrefsOpen(false);
  }

  function rejectNonEssential() {
    setConsent([]);
    setVisible(false);
    setPrefsOpen(false);
  }

  function savePreferences() {
    const categories: ConsentCategory[] = analytics ? ["necessary", "analytics"] : ["necessary"];
    setConsent(categories);
    setVisible(false);
    setPrefsOpen(false);
  }

  if (!mounted || !visible) return null;

  return (
    <>
      <div
        className="fixed bottom-[calc(4.5rem+var(--safe-bottom))] md:bottom-0 inset-x-0 z-[110] animate-toast-in"
        role="region"
        aria-label="Cookie consent"
      >
        <div className="mx-auto max-w-[1000px] md:mb-4 md:mx-4">
          <div className="flex items-center gap-4 flex-wrap justify-between rounded-t-2xl md:rounded-2xl px-5 py-4 bg-[var(--navy-deep,#082A3B)] border border-[rgba(255,255,255,0.1)] shadow-[0_-8px_30px_rgba(0,0,0,0.35)] md:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-3 min-w-0">
              <Icon name="info" size={20} className="text-gold shrink-0 mt-0.5" />
              <p className="text-[13px] leading-relaxed text-[rgba(255,255,255,0.78)]">
                We use a necessary cookie to keep you signed in. With your permission, we also set an analytics cookie to see how the platform is used. See our{" "}
                <a href="/privacy" className="underline text-white">Privacy Policy</a>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setPrefsOpen(true)}
                className="text-[13px] font-semibold px-3 py-2 rounded-lg text-[rgba(255,255,255,0.75)] hover:text-white transition-colors"
              >
                Preferences
              </button>
              <Button variant="ghost" size="sm" onClick={rejectNonEssential} style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)" }}>
                Reject non-essential
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title="Cookie preferences"
        sub="Choose which cookies Smile FX Traders can set."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPrefsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={savePreferences}>Save preferences</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[14px] text-ink-strong">Necessary</div>
              <p className="text-[12.5px] text-ink-dim mt-0.5">Required to keep you signed in. Always on.</p>
            </div>
            <span className="relative inline-flex h-6 w-11 rounded-full bg-teal opacity-50 shrink-0">
              <span className="inline-block size-5 rounded-full bg-white shadow-sm translate-x-5 mt-0.5" />
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[14px] text-ink-strong">Analytics</div>
              <p className="text-[12.5px] text-ink-dim mt-0.5">Helps us understand how the platform is used.</p>
            </div>
            <button
              type="button"
              onClick={() => setAnalytics((v) => !v)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors shrink-0 ${analytics ? "bg-teal" : "bg-track"}`}
            >
              <span className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${analytics ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
