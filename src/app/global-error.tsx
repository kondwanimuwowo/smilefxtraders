"use client";

import { useEffect } from "react";

// Last-resort boundary: catches a throw in the ROOT layout itself, which no
// segment-level error.tsx can reach. Next replaces the entire document when
// this renders, so it must supply its own <html>/<body> — and globals.css,
// the font variables, and every Tailwind class are unavailable here.
//
// That is the one place in this codebase where literal hex is correct rather
// than a token violation: the CSS custom properties these tokens resolve
// against are defined in globals.css, which is precisely what hasn't loaded.
// Keep these values in sync with --navy-deep / --teal / --gold there.
const NAVY_DEEP = "#082A3B";
const TEAL = "#08AEAA";
const INK_DIM = "#8FA3AD";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error-boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          backgroundColor: NAVY_DEEP,
          color: "#fff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "26rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            Smile FX Traders is temporarily unavailable
          </h1>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: INK_DIM, margin: "0 0 1.5rem" }}>
            Something failed at the very top of the app. Reloading usually fixes
            it. If it keeps happening, contact support@smilefxtraders.com.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: TEAL,
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: INK_DIM, marginTop: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
