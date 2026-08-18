"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasAnalyticsConsent, CONSENT_CHANGED_EVENT } from "@/lib/cookie-consent";

// Trustpilot TrustBox — "Micro Review Count", dark theme for the navy footer.
//
// Two things are deliberate here.
//
// 1. The script is gated behind analytics consent, matching
//    ConsentGatedAnalytics: the TrustBox bootstrap sets cookies and reports
//    impressions back to Trustpilot, so it belongs on the same side of the
//    toggle as the beacon. The plain link below renders either way, so
//    declining cookies costs the rating widget, not the link itself — visitors
//    who never touch the banner still get a route to the reviews.
//
// 2. data-min-review-count="10" is Trustpilot's own guard: under ten reviews
//    the widget renders nothing at all and only the fallback link shows. That
//    is Trustpilot's threshold, not ours, and it resolves itself as reviews
//    accumulate.
const TRUSTPILOT = {
  templateId:     "5419b6a8b0d04a076446a9ad",
  businessunitId: "63f9a7b2ff5fe30b53306c45",
  token:          "380fc3e3-83b2-41d6-92bb-166e852cf319",
  reviewUrl:      "https://www.trustpilot.com/review/smilefxtraders.com",
};

export function TrustpilotBadge() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => setConsented(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  return (
    <>
      {consented && (
        <Script
          id="trustpilot-bootstrap"
          strategy="lazyOnload"
          src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        />
      )}
      <div
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id={TRUSTPILOT.templateId}
        data-businessunit-id={TRUSTPILOT.businessunitId}
        data-style-height="24px"
        data-style-width="100%"
        data-theme="dark"
        data-token={TRUSTPILOT.token}
        data-min-review-count="10"
        data-style-alignment="center"
      >
        {/* Trustpilot replaces this once the bootstrap runs; until then (and
            for anyone who declined cookies) it stays as a normal link. */}
        <a
          href={TRUSTPILOT.reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12.5px] text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
        >
          Read our reviews on Trustpilot
        </a>
      </div>
    </>
  );
}
