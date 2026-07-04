import type { CSSProperties } from "react";

// Shared nav active-state convention (documented in CLAUDE.md's Shell Layout
// section): teal gradient background + inset ring on the row, icon switches
// to the FILL material-symbol variant. Used by both the desktop/mobile-drawer
// Sidebar and the mobile BottomTabBar so the two never drift apart.

export function navActiveRowStyle(active: boolean): CSSProperties {
  return active
    ? {
        background: "linear-gradient(135deg, rgba(8,174,170,0.22), rgba(8,174,170,0.08))",
        color: "var(--ink-strong)",
        boxShadow: "inset 0 0 0 1px rgba(8,174,170,0.3)",
      }
    : { color: "var(--ink-mid)" };
}

export function navActiveIconStyle(active: boolean, size: number): CSSProperties {
  return {
    fontSize: size,
    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
    color: active ? "var(--teal)" : "inherit",
  };
}
