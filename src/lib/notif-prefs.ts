// Canonical notification-preference shape stored in User.notifPrefs (JSON).
// Single source of truth — import this everywhere instead of redeclaring.
// Payment/account emails are transactional and are never gated by these prefs.

export interface NotifPrefs {
  alertNotif:     boolean; // in-app: instructor alerts
  communityNotif: boolean; // in-app + email: community replies
  weeklyReport:   boolean; // email: weekly performance report
  emailAlerts:    boolean; // email: instructor alerts
  academyNotif:   boolean; // in-app: academy milestones
  macroNotif:     boolean; // in-app: MacroEdge pair-bias flips
  cotNotif:       boolean; // in-app: COT signal flips / positioning extremes
}

export const NOTIF_PREF_DEFAULTS: NotifPrefs = {
  alertNotif:     true,
  communityNotif: true,
  weeklyReport:   true,
  emailAlerts:    false,
  academyNotif:   true,
  macroNotif:     true,
  cotNotif:       true,
};

// Merge stored JSON over defaults. Users saved before a new key existed
// get that key's default — no migration needed when adding prefs.
export function resolvePrefs(json: unknown): NotifPrefs {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return { ...NOTIF_PREF_DEFAULTS, ...(json as Partial<NotifPrefs>) };
  }
  return { ...NOTIF_PREF_DEFAULTS };
}

export function prefEnabled(json: unknown, key: keyof NotifPrefs): boolean {
  return resolvePrefs(json)[key];
}
