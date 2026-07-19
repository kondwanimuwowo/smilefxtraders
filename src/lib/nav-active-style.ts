// Shared nav active-state convention (documented in CLAUDE.md's Shell Layout
// section): teal gradient background, icon switches to teal. Used by both
// the desktop/mobile-drawer Sidebar and the mobile BottomTabBar so the two
// never drift apart.

export function navActiveRowClass(active: boolean): string {
  return active
    ? "bg-[linear-gradient(135deg,rgba(8,174,170,0.22),rgba(8,174,170,0.08))] text-ink-strong"
    : "text-ink-mid";
}

export function navActiveIconClass(active: boolean): string {
  return active ? "text-teal" : "text-inherit";
}
