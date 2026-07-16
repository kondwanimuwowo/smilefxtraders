"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { hasAnalyticsConsent, CONSENT_CHANGED_EVENT } from "@/lib/cookie-consent";

// Vercel Analytics is cookieless by default, but we still gate it behind the
// "analytics" consent category — the toggle should have a real effect, not
// just describe one.
export function ConsentGatedAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => setEnabled(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  if (!enabled) return null;
  return <Analytics />;
}
