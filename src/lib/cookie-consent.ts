// Client-only cookie-consent storage. "necessary" is always implied (Supabase
// auth can't function without a session cookie) — the only category a user
// actually chooses is "analytics".

export const CONSENT_COOKIE = "cc_consent";

export type ConsentCategory = "necessary" | "analytics";

export function getConsent(): ConsentCategory[] | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return value.split(",").filter(Boolean) as ConsentCategory[];
}

export const CONSENT_CHANGED_EVENT = "cc-consent-changed";

export function setConsent(categories: ConsentCategory[]): void {
  if (typeof document === "undefined") return;
  const value = Array.from(new Set(["necessary", ...categories])).join(",");
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.includes("analytics") ?? false;
}
