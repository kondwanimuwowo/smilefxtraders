# Mobile-First Responsive Redesign

**Status:** Planned, not yet started. Phases below are meant to be worked through in order, likely across multiple sessions — check off `Done when:` criteria as each phase ships.

## Context

Smile FX Traders is currently built with a desktop-first mental model (the shell's own CLAUDE.md docs say "Platform is desktop-first"), but the real user base is ~80% mobile (Zambia/Africa market). A 3-agent codebase audit confirmed this isn't just "needs some breakpoints" — it's a mix of genuine bugs (grids that never collapse, a Drawer component literally wider than a phone screen, email tables that squeeze to 85px columns) and missing mobile-native patterns (no bottom tab bar, dense data screens rendered as shrunk desktop tables instead of cards). The goal isn't incremental patching — it's making the mobile experience feel *better than* desktop, matching how the majority of the userbase will actually meet the product.

This plan covers three surfaces: the authenticated dashboard `(app)`, the public marketing site `(marketing)`, and transactional emails (`src/lib/email/` + `supabase/email-templates/`).

Two product decisions are locked in (confirmed with Kondwani):
1. **Dashboard mobile nav** → bottom tab bar (Dashboard/Journal/Alerts/Community/More), not just a polished hamburger drawer. The existing off-canvas drawer becomes the "More" overflow, not the primary nav.
2. **Dense data screens** (Journal list, Validator form, Alerts stat tiles, admin Students table) → restructure into stacked cards on mobile, not shrunk tables.

Note on CLAUDE.md: its "sidebar hides below 760px, desktop-first" description is already stale — `Sidebar.tsx` has a working off-canvas drawer today. Phase 2 corrects this doc once the tab bar ships.

---

## Phase order

**Foundation → Marketing quick-wins → Dashboard bottom tab bar → Dense-page cards → UI primitives hardening → Email fixes → Polish/QA.**

Foundation first because everything else consumes its tokens (safe-area vars, touch-target convention, fluid type). Marketing is batched right after foundation because its three bugs are pure CSS-wiring fixes sharing Phase 0's work — cheap, visible win before the riskier shell surgery. UI primitives hardening comes *after* the dense-page cards (not before) because the card rewrites are what actually exercise Drawer/Modal/Select on mobile and will surface which primitive fixes are truly blocking. Emails are second-to-last since they're isolated and can't block the app experience.

---

## Phase 0 — Foundation & Tokens

**Breakpoint convention (decision, not code):** Tailwind's default scale (`sm=640 md=768 lg=1024 xl=1280` — confirmed via `globals.css`'s `@theme inline` block, no custom `--breakpoint-*` overrides exist) is the single source of truth for component-level chrome (nav, footer, dashboard shell, grids). The ad-hoc `marketing.css` breakpoints (900px/560px) stay as-is for marketing content-reflow — they're tuned to prose line-length, not device width — but must get a comment block explaining why they diverge, so nobody "fixes" them into Tailwind defaults later.

**Viewport meta** — `src/app/layout.tsx:27`: add an explicit Next.js `viewport` export (`width=device-width, initialScale=1`, no `maximumScale`/`userScalable=false`) instead of relying on Next's implicit default. Confirms pinch-zoom is never accidentally disabled.

**Safe-area support** — `src/app/globals.css`: add `--safe-top/bottom/left/right: env(safe-area-inset-*, 0px)` custom properties + `.pb-safe`/`.pt-safe` utility classes. Consumed by Phase 2's tab bar and Phase 4's Modal/Drawer. Zero `safe-area` usage exists anywhere in `src/` today.

**Fluid type extended past marketing headings** — today only 2 marketing headings use `clamp()` (`globals.css:283,347`); everything else is fixed px:
- `globals.css:336,391` — `.stat .num` 44px→34px single breakpoint becomes `clamp(28px, 5vw, 44px)`.
- `src/components/ui/StatTile.tsx:40` — `text-[26px]` → clamp-based or a new `@theme` token.
- `src/components/ui/Form.tsx:40` — **critical fix**: base input text is `text-[13.5px]`, below the 16px iOS Safari needs to avoid auto-zoom-on-focus. Bump `<input>`/`<select>`/`<textarea>` specifically to 16px minimum; labels/hints can stay smaller.
- `src/components/ui/Button.tsx:35-39` — lower priority; note as nice-to-have, not blocking (buttons aren't focus-zoom-prone like inputs).

**44px touch-target convention** — define once (a `.tap-target{min-height:44px;min-width:44px}` utility, or a Tailwind `@theme` spacing token), apply to the tap area not necessarily the visual icon size. Consider Tailwind v4's `pointer-coarse:` variant so desktop doesn't get needlessly enlarged buttons. Apply to:
- `src/components/shell/Topbar.tsx:153-167` (search button, ~30-32px today)
- `src/components/shell/Topbar.tsx:248-264` (notif bell, theme toggle, ~30-32px)
- `src/components/shell/Topbar.tsx:189` (user chip — 28px avatar only on mobile via `hidden sm:block`)
- `src/components/ui/Button.tsx` `sm`/`md` variants (currently ~28-36px tall)

**Marketing quick-win bugs** (batched here — same root cause: CSS classes exist but are disconnected):
- `src/app/(marketing)/pricing/PricingContent.tsx:58-61` — remove inline `style={{gridTemplateColumns:"repeat(3,1fr)"}}`, apply the already-written `.price-grid` class (`marketing.css:184`, mobile fallback already at `:197` — just unused).
- `src/components/marketing/MarketingFooter.tsx:13-16` — remove inline `style={{gridTemplateColumns:"1.6fr 1fr 1fr"}}`, apply the already-written `.footer-grid` class (`marketing.css:202-205`, fallbacks already written, just unused).
- `src/app/(marketing)/page.tsx:26` — `.hero-grid` class is referenced but **has zero CSS rule**. Add one to `marketing.css` (base `1.05fr 1fr`, collapsing to `1fr` at the file's existing 900px convention), remove the inline `gridTemplateColumns` so the class is authoritative.

**Done when:** viewport export confirmed via view-source; no `<input>` renders under 16px; pricing/footer/hero all collapse to single column below their fallback breakpoint in devtools; zero visual regression at desktop widths (screenshot diff at 1280+).

**Critical files:** `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/Form.tsx`, `src/app/(marketing)/pricing/PricingContent.tsx`, `src/components/marketing/MarketingFooter.tsx`, `src/app/(marketing)/page.tsx`, `src/app/(marketing)/marketing.css`

---

## Phase 1 — Marketing Site Polish

Small scope, remaining items beyond Phase 0's quick wins.

- `src/app/(marketing)/page.tsx:198-215` — floating price-ticker decorative labels (`.fx-wrap`/`.fx-float`, absolute-positioned, no mobile handling). Simplest fix: `hidden sm:block` rather than trying to reposition decorative chrome at every breakpoint.
- `src/components/marketing/CTACard.tsx:28,35-37` — fixed `48px` padding consumes ~25% of a 375px screen's width. Replace with `clamp(20px,5vw,48px)` or a Tailwind `p-6 sm:p-10 md:p-12` stack.
- `src/app/(marketing)/features/page.tsx:60-79` — journal-row mock's model-name text is `flex:1` with no `min-width:0`/truncation; add both plus `overflow-hidden text-ellipsis` to stop uncontrolled wrap on narrow screens.
- Re-confirm `MarketingNav.tsx`'s existing hamburger → full-screen drawer (already solid, lines ~161-231) gets safe-area top/bottom padding now that Phase 0 adds those vars, since it's `fixed inset-0`.

**Done when:** all 5 marketing pages (home, about, features, learn, our-community, pricing) render with no horizontal scroll, no squeezed hero, no overlapping decorative elements at 375/390/414/768px.

**Critical files:** `src/app/(marketing)/page.tsx`, `src/components/marketing/CTACard.tsx`, `src/app/(marketing)/features/page.tsx`, `src/app/(marketing)/marketing.css`

---

## Phase 2 — Dashboard Shell: Bottom Tab Bar

**New component** — `src/components/shell/BottomTabBar.tsx`: `fixed bottom-0 inset-x-0 z-40`, visible only below `md` (768px, matching Sidebar's existing `matchMedia` breakpoint at `Sidebar.tsx:69-78`). 5 items: Dashboard, Journal, Alerts, Community, More. Height ~56-64px + `.pb-safe` for the iOS home-indicator area.
- Active-state styling reuses the existing documented convention (CLAUDE.md: teal gradient bg, `inset 0 0 0 1px rgba(8,174,170,0.3)`, icon FILL-variant switch) — extract the FILL-toggle logic already in `Sidebar.tsx` (~line 492) into a small shared helper so Sidebar and BottomTabBar don't duplicate it.
- "More" doesn't navigate — it flips the same `mobileSidebarOpen` Zustand flag (`src/lib/store.ts`) that Topbar's hamburger (`Topbar.tsx:102-110`) already writes to. No new state, just a second trigger for the existing drawer.
- Everything not promoted to the tab bar (Academy, Trend, Calendar, COT, Validator, Sessions, FX Orders, Pairs, Profile, Settings, Admin, Membership) stays in Sidebar's existing drawer content, structurally unchanged.
- Decide: hide Topbar's hamburger (`Topbar.tsx:102-110`) below `md` once "More" exists, to avoid two competing triggers for the same drawer. Topbar's search/notif/theme icons stay, with freed-up width.

**Z-index / overlap coordination** — this is the single most common "fixed bottom bar" bug (content clipped underneath), so treat it as first-class work, not an afterthought:
- `src/components/ui/ToastHost.tsx:10` — currently `fixed bottom-6 ... z-[100]` (confirmed). Will collide with the new tab bar on mobile. Fix with a conditional Tailwind class: raise the mobile bottom offset to clear tab-bar height + safe-area (e.g. `bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6`), not JS, to avoid hydration mismatch.
- Full-screen modal overlays (`InstrumentsManager.tsx:323`, `Alerts.tsx:247`, `fx-orders/page.tsx:42`, all `fixed inset-0 z-50`) already sit above a `z-40` tab bar — no fix needed, just confirm numeric z-order holds (tab bar 40 < modals 50 < `SearchModal.tsx` 200).
- `Topbar.tsx:271` (search/notif panel, `position:"fixed"`) needs its own clamp fix — see Phase 4 — but also confirm it doesn't render below the fold under the tab bar's mobile layout.

**Layout integration** — `src/app/(app)/layout.tsx:130-142`: add bottom padding to the scrollable main content area on mobile (`pb-20 md:pb-0`, sized to tab-bar height + safe-area) so content never hides behind the fixed bar. Apply at the shared layout level, not per-page.
- `Sidebar.tsx`'s pre-hydration flash (`isMobile` starts `false` before the `useEffect`/`matchMedia` check at `:69-78` runs, so `onNavigate` close-handler isn't wired until after hydration) — fix if cheap (`useSyncExternalStore`-style read), otherwise document as an accepted tradeoff. Judgment call, not a hard requirement.

**Doc correction** — once shipped, update `CLAUDE.md`'s Shell Layout section (currently states "below 760px sidebar hides... desktop-first") to describe reality: bottom tab bar is primary mobile nav, off-canvas drawer is the "More" overflow, platform is mobile-first for the dashboard shell.

**Done when:** tab bar renders only <768px; all 5 tap targets ≥44px; active state matches Sidebar's convention; "More" opens the same drawer as the old hamburger; ToastHost and Topbar panel no longer clip under the tab bar; main content has correct bottom padding on every `(app)` route (spot check Dashboard, Journal, Alerts, Validator, Trend, Admin); CLAUDE.md updated.

**Critical files:** `src/components/shell/BottomTabBar.tsx` (new), `src/components/shell/Sidebar.tsx`, `src/components/shell/Topbar.tsx`, `src/app/(app)/layout.tsx`, `src/components/ui/ToastHost.tsx`, `CLAUDE.md`

---

## Phase 3 — Dense Pages → Stacked Mobile Cards

**Decision rule** (avoids one universal component trying to do two different jobs):
- **If the row IS the data unit** (one journal trade, one student, one validator check) → new reusable `src/components/ui/ResponsiveRow.tsx`: accepts `{label, value}[]` pairs, renders the existing CSS-grid row on `md:`+ (desktop visuals stay pixel-identical — pass the page's current `gridTemplateColumns` string through as a prop), and a bordered card with stacked `label: value` pairs below `md`.
- **If the grid item is already a card** (StatTile) → just fix the grid's column classes (`grid-cols-1 sm:grid-cols-2 md:grid-cols-4` progressive enhancement), no wrapper needed.

**File-specific changes:**
- `src/app/(app)/admin/students/page.tsx:44-70` — clearest `ResponsiveRow` candidate: literal `style={{gridTemplateColumns:"1fr 1fr 80px 60px 60px 80px"}}` header + matching rows, some columns as narrow as 60px. Convert to `ResponsiveRow`, keep the existing grid on `md:`+ untouched.
- `src/app/(app)/journal/Journal.tsx` — the list is a `ResponsiveRow` candidate (each row = one trade, many columns). It already has the good `overflow-x-auto` + "← Scroll to see all" hint pattern (borrowed from `TrendMatrix.tsx:386-389`) — keep horizontal-scroll as the desktop option, switch to stacked cards below `md` via `ResponsiveRow`.
- `src/app/(app)/journal/[id]/page.tsx:372,421` (`grid-cols-2`), `:451` (`grid-cols-3`) — these are field-group grids, not record lists; use progressive-enhancement classes (`grid-cols-1 sm:grid-cols-2` / `sm:grid-cols-3`) — confirm against the actual JSX before choosing, in case any of these are secretly record lists.
- `src/app/(app)/validator/Validator.tsx:360,391,506,518,537` (all `grid-cols-2`) — progressive enhancement (`grid-cols-1 sm:grid-cols-2`); these are form field groups, not records.
- `src/app/(app)/alerts/Alerts.tsx:263,288` (`grid-cols-2`), `:300` (`grid-cols-3`), `:645` (`grid-cols-4`, 4 stat tiles) — progressive-enhancement grid classes; these are StatTile-style cards already, no `ResponsiveRow` needed per the decision rule above.

**Done when:** all 4 areas render as either progressive grids or stacked cards, no column narrower than a readable width at 375px, no data loss (every field still visible, just reflowed), desktop (`≥1024px`) pixel-parity confirmed against current screenshots.

**Critical files:** `src/components/ui/ResponsiveRow.tsx` (new), `src/app/(app)/admin/students/page.tsx`, `src/app/(app)/journal/Journal.tsx`, `src/app/(app)/journal/[id]/page.tsx`, `src/app/(app)/validator/Validator.tsx`, `src/app/(app)/alerts/Alerts.tsx`

---

## Phase 4 — Shared UI Primitives Hardening

Comes after Phase 3 because the card rewrites are the actual consumers exercising these primitives on mobile.

- `src/components/ui/Drawer.tsx:16,43` — **highest priority, outright bug**: fixed `width=460` px with zero viewport clamp — literally wider than a 375-414px phone. Fix to `w-full sm:w-[460px]` or an equivalent `min(460px,100vw)` clamp. Grep every `<Drawer` caller afterward to confirm nothing assumed the old fixed width.
- `src/components/ui/Modal.tsx:17` — `width=560` default works acceptably today (via `p-4` backdrop padding), but harden explicitly to `min(560px,92vw)` and add `.pb-safe` to bottom padding, since mobile-first means Modal usage on phones goes up.
- Three instances of the same underlying bug — `fixed`-positioned popovers computed from `getBoundingClientRect()` with no boundary clamping, so they can render off-screen near an edge:
  - `src/components/ui/Select.tsx` / `Form.tsx:173` (dropdown, `minWidth: compact?160:(rect?.width??200)`)
  - `src/components/shell/Sidebar.tsx` (~386-453, profile dropup, `width:220`)
  - `src/components/shell/Topbar.tsx` (~266-280, NotifBell panel, `width:340`)
  Fix all three with one shared utility (`src/lib/hooks/useClampedPosition.ts`) that clamps `left`/`top` to stay within `window.innerWidth`/`innerHeight`, flipping above the trigger if there's insufficient space below — rather than three bespoke fixes for the same pattern.

**Done when:** Drawer never exceeds viewport width at 375px; Modal keeps an 8px minimum gutter at any width down to 320px; Select/Form dropdown, Sidebar profile dropup, and Topbar NotifBell panel all stay fully on-screen when triggered from the rightmost/bottommost achievable position in the UI.

**Critical files:** `src/components/ui/Drawer.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/Form.tsx`, `src/components/ui/Select.tsx`, `src/lib/hooks/useClampedPosition.ts` (new), `src/components/shell/Sidebar.tsx`, `src/components/shell/Topbar.tsx`

---

## Phase 5 — Email Templates

- `src/lib/email/layout.ts:54` — the existing `@media(max-width:620px)` block only shrinks `.container`/`.inner` padding, never touches inner tables. Extend it with standard email-safe stacking: force `td` cells carrying explicit `width="25%"` (or similar) attributes to `display:block!important;width:100%!important}` under the media query. (Note: Outlook desktop ignores `@media` entirely — out of scope, this fix targets mobile mail clients which do honor it: Gmail, Apple Mail, Outlook mobile.)
- `layout.ts:173` `statGrid4` — apply the fix; verify via `weekly-report.ts` (consumes it for the 4 stat cards).
- `layout.ts:244` `tradeCard` — apply the fix; verify via `instructor-alert.ts` (Entry/SL/TP1/R:R row).
- `layout.ts:145-148` `receiptTable` — lower priority (2-col, least broken) but add `word-break`/`overflow-wrap` safety for long labels vs. monospace amounts while touching this file.
- `winLossBar` — already fine, no change.
- Fix lives entirely in the shared `emailShell()`/media-query block in `layout.ts`, so `welcome.ts`, `billing.ts`, `community-comment.ts` need no code changes, only visual re-verification.
- `supabase/email-templates/{confirm-signup,reset-password,invite-user,change-email}.html` — these are **static files pasted into the Supabase dashboard**, not generated by `layout.ts`. The same `@media` stacking CSS must be manually duplicated into each file's `<style>` tag. Document this as an ongoing manual-sync risk (add a comment in `layout.ts` flagging it) since there's no build step connecting them.

**Done when:** `weekly-report` and `instructor-alert` previews (via the existing `/api/emails/preview` route) show single-column stacked stat cards at mobile width; all 4 Supabase auth HTML files updated in parallel; `receiptTable` wrap-safety confirmed with a deliberately long test label.

**Critical files:** `src/lib/email/layout.ts`, `src/lib/email/templates/weekly-report.ts`, `src/lib/email/templates/instructor-alert.ts`, `supabase/email-templates/confirm-signup.html`, `reset-password.html`, `invite-user.html`, `change-email.html`

---

## Phase 6 — Polish & Verification

**Regression sweep:** re-check Phase 2's ToastHost/Topbar z-index fixes still hold after Phase 4's Modal/Drawer clamps ship; re-check Phase 3's `ResponsiveRow` against Phase 4's Modal (any row opening a detail Modal on tap should render correctly at the new clamped width).

**Manual verification protocol:**
- **Viewport emulation** — Chrome/Edge DevTools device toolbar at 375 (iPhone SE/mini), 390 (iPhone 12/13/14), 414 (Plus/Pro Max, older Android), and both 767px/768px (the exact `md` snap point) — for every `(app)` route plus all 5 marketing pages.
- **Touch/scroll interaction** — DevTools touch simulation (not just resize) to confirm 44px tap areas feel right, and that Lenis smooth-scroll (used on the marketing site) doesn't fight the new fixed bottom tab bar or produce janky momentum scroll — specifically test Journal's long list and Dashboard's scroll containers.
- **Bottom tab bar overlap regression** — for every `fixed`-positioned element found in the audit (`InstrumentsManager.tsx:323`, `Alerts.tsx:247`, `fx-orders/page.tsx:42`, `ToastHost.tsx`, `Topbar.tsx:271`, `SearchModal.tsx:73`), open each on a 375px emulated viewport and confirm nothing clips under the tab bar.
- **Email real-device check** — devtools can't fully emulate mail-client CSS quirks. Use `/api/emails/preview` to send to a real inbox and open on an actual Android/iOS mail app (Gmail, Apple Mail) for the 4-column stacking fix specifically.
- **Regression diffing** — before/after screenshots at desktop widths (1280/1440) after every phase, confirming zero unintended visual change above `md`/`lg` — this is a mobile-first *addition*, not a desktop redesign.

---

## Summary

| Phase | Scope | Risk | New files |
|---|---|---|---|
| 0 | Foundation: viewport, safe-area, fluid type, touch targets, marketing quick-wins | Low | — |
| 1 | Marketing polish | Low | — |
| 2 | Bottom tab bar + shell z-index coordination | Medium-High (touches every `(app)` page) | `BottomTabBar.tsx` |
| 3 | Dense pages → stacked cards | Medium | `ResponsiveRow.tsx` |
| 4 | UI primitives hardening | Medium (shared across app) | `useClampedPosition.ts` |
| 5 | Email 4-col stacking fix | Low (isolated, manual-sync risk on Supabase HTML) | — |
| 6 | Polish/QA/verification | — | — |
