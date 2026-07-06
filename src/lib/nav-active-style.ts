// Shared nav active-state convention (documented in CLAUDE.md's Shell Layout
// section): teal gradient background + inset ring on the row, icon switches
// to the FILL material-symbol variant. Used by both the desktop/mobile-drawer
// Sidebar and the mobile BottomTabBar so the two never drift apart.

export function navActiveRowClass(active: boolean): string {
  return active
    ? "bg-[linear-gradient(135deg,rgba(8,174,170,0.22),rgba(8,174,170,0.08))] text-ink-strong shadow-[inset_0_0_0_1px_rgba(8,174,170,0.3)]"
    : "text-ink-mid";
}

export function navActiveIconClass(active: boolean): string {
  return active ? "ic-fill text-teal" : "text-inherit";
}
