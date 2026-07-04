// Shared viewport-clamping for `position:fixed` popovers positioned from a
// trigger's getBoundingClientRect() — Select/Form's dropdown, Sidebar's
// profile dropup, and Topbar's NotifBell panel all had this exact bug
// independently: naive left/top math with no boundary check, so a popover
// triggered near a screen edge (guaranteed on a 375px phone) renders
// partially or fully off-screen. Not a React hook (no state/effect) — just
// named to match how it reads at the call site.

export interface ClampPositionOptions {
  triggerRect: DOMRect;
  width: number;
  /** Rough popover height used to decide whether it fits below the trigger. */
  estimatedHeight?: number;
  /** Minimum gap kept from any viewport edge. */
  margin?: number;
  /** Which edge of the popover aligns to the trigger horizontally. */
  align?: "left" | "right";
  /** "down" opens below the trigger (default), "up" opens above it (a dropup). */
  direction?: "down" | "up";
}

export interface ClampedPosition {
  left: number;
  top?: number;
  bottom?: number;
}

export function clampPosition(opts: ClampPositionOptions): ClampedPosition {
  const { triggerRect: r, width, estimatedHeight = 240, margin = 8, align = "left", direction = "down" } = opts;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let left = align === "right" ? r.right - width : r.left;
  if (left + width > vw - margin) left = vw - margin - width;
  if (left < margin) left = margin;

  if (direction === "up") {
    let bottom = vh - r.top + 8;
    if (bottom + estimatedHeight > vh - margin) bottom = Math.max(margin, vh - estimatedHeight - margin);
    return { left, bottom };
  }

  const top = r.bottom + 8;
  if (top + estimatedHeight > vh - margin) {
    // Not enough room below — flip to opening above the trigger instead.
    return { left, bottom: Math.max(margin, vh - r.top + 8) };
  }
  return { left, top };
}
