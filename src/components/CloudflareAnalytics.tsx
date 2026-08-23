"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasAnalyticsConsent, CONSENT_CHANGED_EVENT } from "@/lib/cookie-consent";

/**
 * Cloudflare Web Analytics.
 *
 * Gated behind the analytics toggle in the cookie banner, matching how the
 * Trustpilot script is handled. Cloudflare's beacon is cookieless and does no
 * cross-site tracking or fingerprinting, so it would very likely be defensible
 * without consent at all -- but the banner already tells visitors they get to
 * decide whether anything measures their use of the platform, and shipping a
 * tracker that ignores that switch would make the banner untrue.
 *
 * The practical cost of that choice is real: most visitors never open a consent
 * banner, so the numbers will undercount, and the shape of the undercount is
 * not random. Treat the figures as a floor and a trend, not a headcount.
 *
 * Renders nothing when the token is missing, so it is safe in local dev and in
 * any environment where the variable has not been set yet.
 */
const BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export function CloudflareAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => setConsented(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  if (!BEACON_TOKEN || !consented) return null;

  return (
    <Script
      id="cf-web-analytics"
      strategy="lazyOnload"
      // Cloudflare ships the beacon as a module; matching their snippet.
      type="module"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: BEACON_TOKEN })}
    />
  );
}
