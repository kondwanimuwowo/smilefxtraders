"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasAnalyticsConsent, CONSENT_CHANGED_EVENT } from "@/lib/cookie-consent";

// Cloudflare Web Analytics is cookieless by default, but we still gate it
// behind the "analytics" consent category — the toggle should have a real
// effect, not just describe one.
export function ConsentGatedAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => setEnabled(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!enabled || !token) return null;

  return (
    <Script
      id="cf-analytics"
      strategy="afterInteractive"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
