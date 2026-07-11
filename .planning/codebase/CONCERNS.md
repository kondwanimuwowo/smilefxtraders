# Codebase Concerns
**Analysis Date:** 2026-07-11

---

## Tech Debt (per area: issue, files, impact, fix approach)

### 1. Component Size at Product Scale
**Issue:** Multiple page/modal components exceed 700 lines (largest: Dashboard.tsx 904 lines), causing maintainability and testing friction.

**Files:**
- `src/app/(app)/dashboard/Dashboard.tsx` (904 lines)
- `src/app/(app)/validator/Validator.tsx` (722)
- `src/app/(app)/settings/Settings.tsx` (722)
- `src/app/(app)/alerts/Alerts.tsx` (721)
- `src/app/(app)/journal/Journal.tsx` (713)
- `src/app/(app)/community/Community.tsx` (679)

**Impact:** Harder to reason about state, test, and reuse subcomponents. React query integration at single component level means mutation logic tightly coupled to render.

**Fix approach:** Identify and extract sub-panels (e.g., Journal form, Alert filter panel) into `components/` children; pass state via props or context. Start with highest-traffic pages (Dashboard, Journal).

---

### 2. Mobile-First Redesign Not Yet Shipped
**Issue:** MOBILE_FIRST_DESIGN_PLAN.md details 6 phases (Foundation, Marketing Polish, Bottom Tab Bar, Dense-page Cards, UI Primitives, Email, QA) but none are implemented. Platform is ~80% mobile users (Africa market) yet built with desktop-first mental model.

**Files:** `MOBILE_FIRST_DESIGN_PLAN.md` (complete spec), `src/app/globals.css`, `src/components/shell/BottomTabBar.tsx` (missing), `src/components/ui/ResponsiveRow.tsx` (missing), `src/components/shell/Sidebar.tsx`, `src/components/shell/Topbar.tsx`, all `(app)` page components.

**Impact:**
- Phase 0 blocking: `<input>` baseline is 13.5px (below iOS 16px auto-zoom threshold); no safe-area variables; breakpoint documentation missing
- Phase 2 blocking: No bottom tab bar; hamburger drawer overlaps content; no z-index coordination for ToastHost vs. future tab bar
- Phase 3 blocking: Dense pages (Journal list, Validator, Alerts) render as shrunk desktop tables instead of stacked cards on mobile; Table width narrower than 375px viewports
- Phase 4 blocking: Drawer component hard-coded to 460px, wider than most phones; Modal/Select/Topbar panels compute position without viewport clamping

**Fix approach:** Phases are sequenced and individually completable. Phase 0 is foundation (cheap, low-risk); Phase 2 touches every route. Use MOBILE_FIRST_DESIGN_PLAN.md as the roadmap — each phase lists critical files and "Done when:" acceptance criteria.

---

### 3. Icon Registry Crash Class (Mitigated)
**Issue:** Unregistered icon names previously crashed the app. Mitigation exists but recall is expensive.

**Files:** `src/components/ui/Icon.tsx` (lines 16–23), `src/components/ui/icons/registry.tsx`

**Impact:** Covered by fail-soft placeholder render + console.error. No crash risk. However, misspelled icon names silently render blank squares, which is hard to debug during development.

**Fix approach:** Improve DX: add a build-time check (ESLint plugin or type-safe icon name literal type from registry enum) to catch unregistered names at dev-server startup rather than runtime. Alternatively, document the placeholder in component Storybook/JSDoc.

---

### 4. Plan Guard Fails Open on DB Error
**Issue:** `src/lib/plan-guard.ts:15–34` explicitly returns `null` (allows request) when `prisma.user.findUnique()` fails or returns no record, sacrificing feature access to maximize availability. A transient Supabase connection drop would let a FREE user past the paywall.

**Files:** `src/lib/plan-guard.ts`, all routes calling `requirePaidPlan()` (COT detail, paid Academy, AI review).

**Impact:** During Supabase outages, paid features briefly become accessible to all. Trade-off is intentional and documented; minimizes customer impact. Risk increases if Supabase reliability degrades or if a data migration corrupts the user record lookup.

**Fix approach:**
1. Monitor Supabase uptime; alert on SLA violation.
2. Add observability: emit a metric when `requirePaidPlan` fails open (distinct from legitimate "FREE" response).
3. Consider staged rollout: try 1 retry with exponential backoff before failing open. Document the retry window in the code comment.
4. QA: write an integration test that kills the DB and confirms the guard still rejects unauthenticated requests (status 401) before falling back to open.

---

### 5. FX-Orders Scraper URL Scheme Fragility
**Issue:** InvestingLive's URL scheme changed in July 2026 (dropped `-YYYYMMDD` suffix on recent posts). The scraper has two paths: (1) dynamic index lookup to find real post slug, (2) fallback to guessed URL (which 404s for current date).

**Files:** `src/app/api/fx-orders/sync/route.ts` (lines 21–65, `findPostUrl()` and `buildInvestingLiveUrl()`)

**Impact:**
- Index lookup failing (network error, HTML parse error) silently falls back to guessed URL, which returns 404 for recent posts.
- 403 Forbidden (bot protection) is surfaced to the user with fallback advice ("Use Upload Image button instead").
- Historical date lookups may work (older posts still have the `-YYYYMMDD` suffix).
- If InvestingLive changes URL structure again or page casing, the regex at line 57 (`new RegExp(..., "i")`) may stop matching.

**Fix approach:**
1. Add structured logging: log the actual HTML returned when the regex fails to match (sanitize to avoid leaking credentials).
2. Contact InvestingLive for a stable API or RSS feed instead of scraping; document current scrape path as temporary.
3. Add a manual refresh button in the UI + rate limiting (already exists via Upstash) so users can manually retry if the auto-sync fails.
4. Monitor: set up an alert if `sync/route.ts` logs 5+ failed lookups in an hour.
5. Fallback: cache the most recent successfully fetched post URL and use it as a secondary fallback (in case the index is down).

---

## Known Bugs (symptoms, files, trigger, workaround)

### 1. Drawer Width Exceeds Mobile Viewports
**Symptom:** Right-side drawer component is 460px wide; exceeds 375–414px phone widths.

**Files:** `src/components/ui/Drawer.tsx:16,43`, calls in `src/app/(app)/admin/alerts/AlertsManager.tsx`, `src/app/(app)/admin/students/page.tsx`, etc.

**Trigger:** Open any drawer on a device <460px wide (iPhone SE, older Android phones).

**Workaround:** None in production; desktop users unaffected. Mobile users see partially clipped drawer with no scroll path.

**Fix:** Change `width=460` to `w-full sm:w-[460px]` or `min(460px, 100vw)` CSS clamp (Phase 4 of MOBILE_FIRST_DESIGN_PLAN.md).

---

### 2. Input Focus Auto-Zoom on iOS
**Symptom:** iOS Safari auto-magnifies form inputs when focused if text size <16px; UX friction.

**Files:** `src/components/ui/Form.tsx:40` (`text-[13.5px]` base size), affects all `<input>`, `<select>`, `<textarea>`.

**Trigger:** Focus any text input on iPhone (all iOS browsers use Safari rendering engine).

**Workaround:** Use desktop browser DevTools or Android for testing; iOS users experience zoom but form is still usable.

**Fix:** Bump base input text to 16px minimum; labels/hints can stay smaller (Phase 0 of MOBILE_FIRST_DESIGN_PLAN.md).

---

### 3. COT Sign Corruption from 2023-07-03
**Symptom:** COT nets for some pairs show inverted signs; affects large-spec positioning analysis.

**Files:** `src/lib/cot/types.ts` (documents the sign convention), `src/app/api/cot/` routes, database seed logic.

**Trigger:** Data seeded or migrated before the sign convention audit in July 2026. Manifests as inverted bullish/bearish signals for certain pairs.

**Workaround:** Manual sign flip in the database or re-seeding with corrected data.

**Fix:** The codebase now enforces the pair-framed convention (USD-base pairs net-inverted at write time; long/short gross kept raw). Old corrupted data requires a one-time backfill. Audit the seed logic and all sync paths to confirm the convention is applied uniformly. See CLAUDE.md > SMC Domain Vocabulary for reference.

---

## Security Considerations (risk, files, current mitigation, recommendations)

### 1. Rate Limiting Depends on Optional External Service
**Risk:** Signup and auth endpoints depend on Upstash Redis for rate limiting. If Redis is down or misconfigured, the guard fails open.

**Files:** `src/lib/redis.ts`, `src/lib/bot-protection.ts:3–10` (`if (!redis) return true`)

**Current Mitigation:** Explicit fail-open comment in code; local dev and pre-Upstash deployments gracefully degrade (no rate limit, but auth still works).

**Recommendations:**
1. Add a telemetry event when rate limiting is unavailable (distinguish from legitimate bypass).
2. Implement a fallback: in-memory rate limiter with a 5-minute window as secondary protection if Redis is unavailable.
3. Monitor Upstash health; alert if Redis is down for >5 minutes.
4. Document the fail-open behavior in runbooks and incident response.

---

### 2. Signup Security Requires Both IP and Email Rate Limits
**Risk:** Bot can bypass IP-based rate limiting by rotating through proxies, or bypass email-based limiting by rotating email addresses.

**Files:** `src/app/(auth)/actions.ts` (calls `validateSignupSecurity`), `src/lib/bot-protection.ts:31–36` (dual check).

**Current Mitigation:** Both IP and email rate limits must pass; both have separate Redis keys and 3600s windows. Email check uses normalized form (lowercase, trimmed).

**Recommendations:**
1. Add a CAPTCHA (reCAPTCHA v3 or similar) to signup as a stronger signal than rate limits alone.
2. Monitor signup abuse: track signup-to-first-login ratio and alert if it's anomalously high (indicator of bot registrations being abandoned).
3. Implement a honeypot field on the signup form (hidden, should never be filled).

---

### 3. Plan Enforcement Is Backend-Only
**Risk:** Frontend shows paywall modals, but backend only checks at API call time (not at route level). A determined user could craft requests to paid endpoints.

**Files:** `src/lib/plan-guard.ts` (API route guard only), no route-level middleware.

**Current Mitigation:** Every paid API route explicitly calls `requirePaidPlan()`. No data is leaked; the guard returns 403 Forbidden.

**Recommendations:**
1. Add a route-level guard in middleware (future `proxy.ts` evolution) to reject paid-plan routes at the edge before they hit application logic.
2. Audit all paid routes (COT detail, AI review, Premium Academy) to confirm `requirePaidPlan()` is called and not skipped.
3. Write a unit test for each paid route that calls it with a FREE user token and confirms 403 response.

---

## Performance Bottlenecks (problem, files, cause, improvement path)

### 1. Large Page Components Block Code Splitting
**Problem:** Dashboard, Validator, Settings, Alerts each render 700+ lines of TSX. Entire page bundle loads even if user only views one section.

**Files:** `src/app/(app)/dashboard/Dashboard.tsx` (904), `src/app/(app)/validator/Validator.tsx` (722), etc.

**Cause:** React component tree is flat; no dynamic imports or lazy-loaded sub-components.

**Improvement path:**
1. Extract filter/form panels into separate components (e.g., `FilterPanel.tsx`, `LogTradeForm.tsx`).
2. Use `React.lazy()` + `Suspense` for low-priority UI (e.g., instructor card in Sidebar).
3. Use Next.js route groups to split Dashboard subpages if they exist (e.g., `/dashboard/overview`, `/dashboard/detailed-stats`).

---

### 2. Chart Rendering with lightweight-charts
**Problem:** CandleChart component instantiates a full lightweight-charts instance on every render. If the component re-renders (parent state change), chart may re-init unnecessarily.

**Files:** `src/components/ui/CandleChart.tsx:37–38` (does have `useRef` + `useEffect` guard, appears safe), callers in `src/app/(app)/dashboard/Dashboard.tsx`, `src/app/(app)/validator/Validator.tsx`.

**Cause:** Dependency on chart data array; if array identity changes (new reference), useEffect re-runs.

**Improvement path:**
1. Verify candle data is memoized or has stable identity (use `useMemo` if not).
2. Profile the chart component in React DevTools Profiler to confirm no unnecessary re-renders.
3. Consider virtualizing candlestick data if charts display 1000+ candles (lightweight-charts handles this, but verify).

---

### 3. Notifications Polling Without Backoff
**Problem:** `src/components/shell/NotificationsPoller.tsx` likely polls `/api/notifications` at a fixed interval; no adaptive backoff if the app is idle.

**Files:** `src/components/shell/NotificationsPoller.tsx`

**Cause:** Unknown implementation (did not read full file), but polling is a common source of excess requests.

**Improvement path:**
1. Use exponential backoff if the response is 204 No Content (no new notifications).
2. Use server-sent events (SSE) or WebSocket if latency is critical (not recommended for this app's scale today).
3. Integrate React Query's `useQuery` with `staleTime` and `gcTime` to cache notifications.

---

## Fragile Areas (files, why fragile, safe modification, test coverage)

### 1. Host-Based Domain Routing
**Files:** `src/proxy.ts`

**Why fragile:**
- Routing logic depends on `request.headers.get("host")` which can be spoofed in tests or spoofed by reverse proxies if not configured correctly.
- Three separate redirect paths (www to apex, marketing domain to app subdomain, app root to dashboard) with overlapping conditions.
- `crossHostRedirect()` uses `request.nextUrl.clone()` but manually re-sets protocol/host/port; if Next.js changes URL API, this breaks.

**Safe modification:**
1. Write integration tests for each redirect path (www test, marketing→app test, app root test).
2. Add a debug header in responses (`X-Proxy-Route: ` with the matched condition name) to aid troubleshooting in production.
3. Avoid changing the host-header parsing logic without updating the test matrix.

**Test coverage:** None (no test suite exists).

---

### 2. Zustand Store Persistence
**Files:** `src/lib/store.ts`, consumers: `src/app/(app)/layout.tsx` (initializes), `src/components/shell/StoreHydrator.tsx` (hydrates).

**Why fragile:**
- Client state (trades, notifs, feed) must be persisted to Supabase via Prisma. Mismatch between store and DB during a network outage could cause inconsistency.
- Store doesn't auto-sync; reliant on explicit `POST /api/trades`, `/api/alerts`, etc. calls. If a mutation forgets to sync, local state diverges from DB.
- `StoreHydrator.tsx` reads from DB on page load; if DB is slow, hydration is delayed, causing a flash of empty state.

**Safe modification:**
1. Add a `synced` boolean flag to each slice (e.g., `trades`, `notifs`) to track which mutations have been persisted.
2. Use React Query's mutation lifecycle (`onSuccess`, `onError`) to update this flag after every API call.
3. Render a "Syncing..." indicator or toast if a slice is out of sync for >2 seconds.

**Test coverage:** None.

---

### 3. COT Sign Convention
**Files:** `src/lib/cot/types.ts` (documents invariant), all COT sync/seed paths (`src/lib/cot/sync.ts`, `prisma/seed.ts` migration).

**Why fragile:**
- The convention is: nets stored pair-framed (USD-base pairs inverted at write time); gross long/short stay raw. A single inversion in one path (seed, sync, or display) flips all signals.
- Audit in July 2026 found corruption from 2023-07-03, indicating the convention wasn't always followed.
- Comments document the convention, but it's not enforced by types (TypeScript doesn't distinguish `net` from `invertedNet`).

**Safe modification:**
1. Extract inversion logic to a single utility function: `const invertIfUsdBase = (net: number, usdBase: boolean) => usdBase ? -net : net`.
2. Call this utility in exactly two places: (a) sync route before writing to DB, (b) display route before rendering (verify it's not double-inverted).
3. Add a schema check: COT detail response includes both `usdBase` and `largeSpecNet`; a test asserts that for USDJPY (usdBase=true), a positive net represents bullish positioning (short EUR = long USD, which is bullish for USDJPY).
4. Revisit the audit in July 2026 to see what specific rows were corrupted; consider a data migration to fix them.

**Test coverage:** None.

---

### 4. Prisma Connection at Build Time
**Files:** `prisma.config.ts`, Next.js build process.

**Why fragile:**
- Prisma 7 requires connection to the database at `npm run build` if any `@notNull` fields lack defaults (Prisma generates type definitions based on schema introspection).
- Static prerendering routes (if any) would hit Supabase's connection pooler at build time, risking timeout if pooler is overloaded.
- The `DIRECT_URL` (used for migrations) is different from `DATABASE_URL` (used at runtime). If build time uses the wrong URL, it fails.

**Safe modification:**
1. Verify no routes use `revalidateStaticProps` or `getStaticProps` (dynamic routes only in this codebase).
2. Confirm Prisma client generation (in `postinstall`) doesn't require a live DB connection (it shouldn't, but Prisma 7 has quirks).
3. If adding static prerendering, use Supabase pooler's read-only replica to avoid contention.

**Test coverage:** None.

---

## Scaling Limits (current capacity, limit, scaling path)

### 1. Database Connection Pool
**Current capacity:** Supabase pooler (default ~3 connections per API route process on Vercel).

**Limit:** At high concurrency (1000+ simultaneous active users), connection waits could timeout. Symptom: `ECONNREFUSED` on DB queries.

**Scaling path:**
1. Monitor Supabase "Database Health" dashboard for pool contention.
2. Increase Supabase pooler size (settings tab) from default to 10–20 connections.
3. Implement connection pooling on the application side using `@prisma/adapter-pg` (already done; verify `src/lib/prisma.ts` uses it).
4. Use read replicas for read-heavy queries (trades, COT reports, leaderboard).

---

### 2. Real-Time Subscriptions (None Yet)
**Current capacity:** Polling-based notifications (see NotificationsPoller).

**Limit:** Polling creates N*M requests (N users × M poll intervals per hour). At 10k users polling every 30s, that's ~1.2M requests/day, which is fine for Vercel edge but inefficient.

**Scaling path:**
1. Switch to Supabase Realtime (publish-subscribe) for notifications when user base exceeds 1000 concurrent.
2. Use a message queue (e.g., Vercel's new Queues or a self-hosted Redis Pub/Sub) to decouple notification creation from delivery.

---

### 3. Image Storage
**Current capacity:** Avatar URLs, post images, chart screenshots stored in Supabase Storage (unlimited, but depends on bucket configuration).

**Limit:** No size limits currently enforced; a user could upload 1GB images, consuming quota.

**Scaling path:**
1. Add client-side image validation (max 5MB per upload) in form components.
2. Add server-side size check in API routes.
3. Implement image optimization (compress, resize) before storing (Vercel Image Optimization or a serverless function).

---

## Dependencies at Risk (package, risk, impact, migration plan)

### 1. Prisma 7 (Adapter Pattern)
**Package:** `@prisma/client@^7.8.0`

**Risk:** Prisma 7 introduced breaking changes (shadow DB unavailable on Supabase, manual datasource config in `prisma.config.ts`). Schema introspection at build time can fail.

**Impact:** Migrations require extra steps (use `DIRECT_URL` for CLI, `DATABASE_URL` for app). Shadow DB testing is unavailable, requiring manual migration testing.

**Migration plan:**
1. Lock Prisma at v7 for now; monitor v8 release notes.
2. If Prisma v8 ships, test it in a preview deployment first.
3. Document the Prisma 7 quirks in CLAUDE.md (already done).

---

### 2. Lightweight-Charts (Chart Rendering)
**Package:** `lightweight-charts@^5.2.0`

**Risk:** Maintained by TradingView; stable, but a major breaking change in v6+ could require chart refactoring.

**Impact:** All price charts and SMC annotation overlays depend on this library. A breaking change would require rewriting CandleChart and all annotation logic.

**Migration plan:**
1. Monitor lightweight-charts releases; test v6 in a branch if it ships.
2. Document chart API usage in CandleChart component (JSDoc comments).
3. Consider TradingView Lightweight Charts widget as a potential paid alternative if rendering performance becomes an issue.

---

### 3. next-themes (Dark Mode)
**Package:** `next-themes@^0.4.6`

**Risk:** Community-maintained, low-traffic issues, but theme switching logic is baked into `globals.css` and every component's `useTheme()` call. A breaking change would require widespread refactoring.

**Impact:** Dark mode toggle in Topbar, all CSS variables mapped to `data-theme`.

**Migration plan:**
1. If next-themes becomes unmaintained, consider switching to CSS `:prefers-color-scheme` media query (simpler, built-in, no JS required).
2. Test this switch in a feature branch if the time comes.

---

## Missing Critical Features (problem, blocks)

### 1. No Test Suite
**Problem:** Zero test files in `src/`. No unit tests, integration tests, or e2e tests. Refactoring and bug fixes are high-risk.

**Blocks:**
- Confidence in large refactors (e.g., extracting 900-line Dashboard into subcomponents).
- Regression detection for API routes (plan guard, email sending, COT sync).
- Edge-case handling (network errors, DB timeouts, rate limit responses).

**Fix approach:**
1. Start with a minimal test suite for critical paths: (a) plan guard (requirePaidPlan), (b) COT sign convention, (c) notification sync.
2. Use Vitest (drop-in Jest replacement, faster) + React Testing Library.
3. Set up CI to run tests on PR; require >80% coverage for critical files.
4. Write tests as you fix bugs (e.g., after fixing the Drawer width bug, write a test for mobile viewport clamping).

---

### 2. No E2E Test Automation
**Problem:** Manual verification for every feature. Mobile-first redesign will require testing on multiple device widths; hard to scale without automation.

**Blocks:**
- Phase 6 of MOBILE_FIRST_DESIGN_PLAN.md relies on manual viewport testing.
- Responsive redesign can't be shipped with confidence without automated visual regression tests.

**Fix approach:**
1. Add Playwright or Cypress for E2E tests. Start with critical user flows: signup → login → log trade → validate trade → view COT → upgrade plan.
2. Add visual regression testing (Percy or Chromatic) to catch unintended design changes.
3. Run E2E tests in CI for every PR targeting the dashboard shell (Phase 2 and beyond of MOBILE_FIRST_DESIGN_PLAN.md).

---

## Test Coverage Gaps (what's not tested, files, risk, priority)

### 1. API Routes
**What's not tested:** All `src/app/api/` routes — plan guard, email sending, data mutations, error handling.

**Files:** `src/app/api/trades/route.ts`, `/cot/`, `/alerts/`, `/community/`, `/checkout/`, `/admin/`, `/webhooks/`.

**Risk:**
- Plan guard could be inadvertently removed from a route during refactoring.
- Email template changes (Phase 5 of MOBILE_FIRST_DESIGN_PLAN.md) won't be tested; Supabase HTML files are manually synced.
- Webhook handlers (Lenco mobile money, subscription renewal) have no regression tests.

**Priority:** HIGH. Start with `requirePaidPlan()` test, then email routes.

---

### 2. Zustand Store
**What's not tested:** Store slices (trades, notifs, feed, alerts), mutations, persistence.

**Files:** `src/lib/store.ts`, `src/components/shell/StoreHydrator.tsx`.

**Risk:** A store mutation could have stale closure bugs (capturing old state). No tests catch this.

**Priority:** MEDIUM. Test after component extraction (large components refactored into smaller pieces that consume store).

---

### 3. Responsive Layout
**What's not tested:** Mobile layout rendering, touch targets, z-index layering, viewport clamping.

**Files:** All `src/app/(app)/` pages, `src/components/shell/BottomTabBar.tsx` (doesn't exist yet), `src/components/ui/Drawer.tsx`, `src/components/ui/Modal.tsx`.

**Risk:** Phase 2 (bottom tab bar) will ship with no automated check that content doesn't clip under the tab bar. Phase 4 (Drawer clamping) has no regression test.

**Priority:** HIGH for Phase 2+. Use Playwright visual regression or manual viewport matrix.

---

### 4. COT Sign Convention
**What's not tested:** Net sign inversion, USD-base pairing logic, sync and seed paths.

**Files:** `src/lib/cot/types.ts`, `src/lib/cot/sync.ts`, `prisma/seed.ts`, `/api/cot/` routes.

**Risk:** The July 2026 corruption audit showed the convention wasn't always applied. No tests prevent regression.

**Priority:** CRITICAL. Write one test per path (seed, sync, display) that asserts sign correctness for both pair-framed and USD-base pairs.

---

### 5. Email Templates
**What's not tested:** Email rendering, table stacking, Supabase HTML files.

**Files:** `src/lib/email/layout.ts`, `src/lib/email/templates/`, `supabase/email-templates/`.

**Risk:** Phase 5 of MOBILE_FIRST_DESIGN_PLAN.md requires manual verification of mobile email rendering. Manual sync between `layout.ts` and Supabase HTML is error-prone.

**Priority:** MEDIUM. Use `/api/emails/preview` route to generate test emails; verify on real devices (Gmail, Apple Mail).

---

## Recommendations (action items, urgency)

1. **URGENT (next session):**
   - Start Phase 0 of MOBILE_FIRST_DESIGN_PLAN.md (Foundation: viewport export, safe-area vars, input 16px fix, touch targets).
   - Add inline logging to fx-orders scraper when URL lookup fails (help diagnose next format drift).
   - Write one critical test (plan guard) to establish the test infrastructure.

2. **HIGH (this month):**
   - Audit and extract 700+-line components (Dashboard, Validator) into sub-components.
   - Add observability to plan guard (metric when it fails open).
   - Implement input focus test in Playwright (confirm no iOS auto-zoom on 13.5px inputs before Phase 0 ships).

3. **MEDIUM (this quarter):**
   - Phase 1–2 of MOBILE_FIRST_DESIGN_PLAN.md (Marketing Polish, Bottom Tab Bar).
   - Establish visual regression testing (Playwright + Percy) for responsive redesign.
   - Write COT sign convention tests to prevent corruption regression.

4. **LOW (backlog):**
   - Consider CAPTCHA for signup rate limiting.
   - Migrate to Realtime subscriptions if user base reaches 1000 concurrent.
   - Upgrade or replace next-themes if it becomes unmaintained (unlikely near-term).

---

*Concerns audit: 2026-07-11*
