# Architecture

**Analysis Date:** 2026-07-11

## System Overview

Smile FX Traders is a desktop-first community trading platform built with Next.js App Router, TypeScript, and Tailwind CSS. The architecture follows a host-based domain split with Supabase auth, PostgreSQL persistence via Prisma, and client state management via Zustand.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Browser / Client Layer                              │
│  React 19 Components (TSX) → Zustand Store → DOM                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ fetch()
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Next.js Middleware / Proxy Layer                         │
│  src/proxy.ts: Host-based routing (apex/app), Auth guard                    │
│  Supabase SSR: Session validation, cookie management                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Next.js App Router + API Routes                           │
│  (app), (auth), (marketing) route groups                                    │
│  api/ routes: review, cot/, macro/, trades/, etc.                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Application Logic Layer                             │
│  lib/store.ts (Zustand)      — client state schema                          │
│  lib/cot/                    — COT report sync & analysis                    │
│  lib/macro/                  — MacroEdge fundamentals scoring                │
│  lib/supabase/               — auth & server client                         │
│  lib/prisma.ts               — lazy singleton ORM                           │
│  lib/frameworks.ts, rules.ts — SMC rulebook, S&D rules                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Supabase + PostgreSQL                                  │
│  Auth: Supabase Auth (JWT in secure http-only cookies)                      │
│  DB: Public schema (users, trades, alerts, cot_reports, etc.)               │
│  Storage: Supabase Storage (trade charts, assets)                           │
│  Webhooks: Lenco payment, fx-orders sync, cron triggers                     │
└─────────────────────────────────────────────────────────────────────────────┘

External Services:
  - Anthropic SDK: Gavo trade review (app/api/review/route.ts)
  - Finnhub: Economic calendar, forex options
  - FRED: US economic indicators
  - World Bank: Global economic data
  - Supabase Webhooks: Event-driven flows (auth, payments, fx sync)
```

## Component Responsibilities

| Component | Responsibility | File(s) |
|---|---|---|
| **Proxy (Middleware)** | Host-based routing (smilefxtraders.com → apex only, app.smilefxtraders.com → app only), session validation, auth guard | `src/proxy.ts` |
| **App Layout (Shell)** | Authenticated shell: Sidebar (desktop), BottomTabBar (mobile), Topbar, ToastHost, NotificationsPoller, StoreHydrator | `src/app/(app)/layout.tsx`, `src/components/shell/` |
| **Auth Pages** | Login, signup, onboarding, password reset | `src/app/(auth)/` |
| **Marketing Pages** | Public homepage, features, learn, community stories | `src/app/(marketing)/` |
| **Dashboard** | Trade summary, recent trades, quick stats, balance tracker | `src/app/(app)/dashboard/page.tsx` |
| **Journal** | Trade entry/edit form, trade list, filtering, AI review component | `src/app/(app)/journal/`, `src/components/AIReview.tsx` |
| **COT Module** | Commodity futures positioning, bias signals, pair hub display | `src/app/(app)/cot/`, `src/lib/cot/`, `src/components/cot/` |
| **MacroEdge** | Economic indicators, news feed, pair bias analysis, fundamental scoring | `src/app/(app)/macroedge/`, `src/lib/macro/`, `src/components/macro/` |
| **Alerts** | Price alerts (client-side UI), instructor alerts (server-persisted), copyable setups | `src/app/(app)/alerts/`, `src/app/api/alerts/` |
| **Zustand Store** | Client state: feed, notifs, priceAlerts, journaledAlerts, likedPosts, user, toasts | `src/lib/store.ts` |
| **Prisma ORM** | Lazy singleton database client with PrismaPg adapter | `src/lib/prisma.ts` |
| **API Routes** | Trade CRUD, alert sync, COT refresh, review generation, webhooks | `src/app/api/{trades,alerts,cot,review,webhooks}/` |

## Pattern Overview

**Type-safe server-side rendering with client interactivity:**
- Server components fetch initial data (layout.tsx queries Prisma)
- Data hydrated into Zustand on client (StoreHydrator component)
- Client components read from store and re-fetch via React Query or direct fetch
- mutations POST/PATCH to API routes, which update Prisma + broadcast via WebSocket (future) or re-query

**Host-based domain split:**
- `proxy.ts` checks request hostname
- Marketing apex (smilefxtraders.com) only serves `/`, `/features`, `/pricing`, `/about`, `/learn`, `/our-community`
- App subdomain (app.smilefxtraders.com) serves `/dashboard`, `/journal`, auth pages, `/api`
- Authenticated users on apex are redirected to app subdomain; unauthenticated users on app subdomain go to login

**DB-to-UI data mapping:**
- Server components import mappers (e.g., `dbTradeToStore()`) to transform Prisma models to client types
- Keeps Prisma schema stable; client schema (lib/store.ts) is the source of truth for UI

**Lazy Singleton Prisma:**
- `getPrisma()` initializes on first access; global singleton pattern avoids connection pool exhaustion
- Proxy pattern hides the lazy initialization; normal `import { prisma }` usage

## Layers

### 1. Proxy & Middleware (`src/proxy.ts`)
- **Purpose:** Route requests to correct host (marketing apex vs. app subdomain), validate auth sessions (Supabase SSR)
- **Location:** Root of src/
- **Contains:** Proxy logic, host redirect functions, public path list, auth session check
- **Depends on:** Supabase SSR, Next.js (NextRequest, NextResponse)
- **Used by:** Next.js runtime (via `export const proxy` and `config`)

### 2. Next.js App Router (`src/app/`)
- **Purpose:** Handles all page routes and API endpoints
- **Location:** `src/app/`
- **Contains:**
  - `(app)/` — authenticated pages (dashboard, journal, cot, macroedge, etc.)
  - `(auth)/` — unauthenticated (login, signup, onboarding, password reset)
  - `(marketing)/` — public pages (features, learn, community, about)
  - `api/` — server-side API endpoints
- **Depends on:** Supabase auth, Prisma, lib/ utilities
- **Used by:** Next.js router

### 3. Components (`src/components/`)
- **Purpose:** Reusable React UI components
- **Location:** `src/components/`
- **Contains:**
  - `shell/` — Sidebar, Topbar, BottomTabBar, AuthShell, StoreHydrator, NotificationsPoller
  - `ui/` — Base UI primitives (Button, Avatar, Modal, Drawer, Toast, etc.)
  - `cot/` — COT-specific UI (PositioningChart, CotBiasPanel, CotIndexDisplay)
  - `macro/` — MacroEdge UI (FundamentalsPanel, GavoExplanation, NewsFeed)
  - `pricing/` — Plan selection cards
  - `checkout/` — Stripe/payment checkout modal
  - `marketing/` — Public site components (MarketingNav, FAQAccordion, FeatureBlock)
  - `search/` — SearchModal (⌘K)
  - `AIReview.tsx` — Gavo AI review display & refetch
- **Depends on:** React, Zustand, Framer Motion, Heroicons, Tailwind
- **Used by:** Route pages and other components

### 4. Application Logic (`src/lib/`)
- **Purpose:** Shared business logic, state, utilities
- **Location:** `src/lib/`
- **Contains:**
  - `store.ts` — Zustand store (trades, feed, notifs, alerts, user, toasts)
  - `prisma.ts` — Lazy singleton Prisma ORM client
  - `supabase/` — Supabase auth clients (server, client, admin)
  - `cot/` — COT analysis (sync.ts, signal.ts, commentary.ts, types.ts, notify.ts)
  - `macro/` — MacroEdge scoring (pairBias.ts, scoring.ts, confluence.ts, gavoPrompt.ts, rules.ts)
  - `frameworks.ts` — SMC & S&D trading rules, model validation
  - `plans.ts` — Plan definitions, feature gates
  - `pairs.ts` — Forex pair list, symbols
  - `date.ts` — Session windows, timezone utilities
  - `notifications.ts`, `notif-prefs.ts`, `notify-events.ts` — notification logic
  - `finnhub.ts`, `fred.ts`, `worldbank.ts` — external API clients
  - `server/` — server-only utilities (getInstruments, getPlanPrices)
  - `hooks/` — React hooks (useNotifications, useTrades, useInstruments)
  - `email/` — Resend templates
- **Depends on:** Prisma, Supabase, Zustand, date-fns, external API clients
- **Used by:** API routes, server components, client components (via hooks)

### 5. Types (`src/types/`)
- **Purpose:** Domain type definitions
- **Location:** `src/types/`
- **Contains:**
  - `fx-orders.ts` — FX order sync types
  - `macro.ts` — MacroEdge data shapes
- **Depends on:** TypeScript standard lib
- **Used by:** API routes, lib/ modules

### 6. Database (`prisma/`)
- **Purpose:** Database schema, migrations, seeders
- **Location:** `prisma/`
- **Contains:**
  - `schema.prisma` — Prisma model definitions (User, Trade, Alert, CotReport, etc.)
  - `prisma.config.ts` — Prisma config with .env loader
  - `migrations/` — Timestamped SQL migrations
  - `seed.ts`, `seed-cot.ts`, `seed-cot-patch.ts` — Database seeders
  - `test-webhook.ts` — Webhook testing utility
- **Depends on:** PostgreSQL (Supabase), Prisma CLI
- **Used by:** Next.js app (via Prisma client)

## Data Flow

### Primary Request Path: Create Trade
1. **Client** (`src/components/journal/TradeEntryForm.tsx`) → form submission
2. **Client** → POST `/api/trades/` with trade data
3. **Middleware** (`src/proxy.ts`) → validate session
4. **API Route** (`src/app/api/trades/route.ts`) → auth check (getUser)
5. **API Route** → Prisma query (`prisma.trade.create()`)
6. **Prisma** → PostgreSQL INSERT
7. **Response** → JSON trade object (HTTP 201)
8. **Client** → Zustand store (optimistic update) or refetch trades list
9. **Optional** → AI review trigger (`src/app/api/review/route.ts`) → Anthropic SDK → response displayed in AIReview component

### Secondary Flow: COT Report Sync (Webhook/Cron)
1. **External Trigger** (e.g., Sunday 00:00 UTC via cron/external webhook)
2. **API Route** (`src/app/api/cot/sync/route.ts`) → Finnhub calendar fetch
3. **Sync Job** (`src/lib/cot/sync.ts`) → parse CFTC data, map to Prisma models
4. **Prisma** → upsert CotReport records
5. **Signal Engine** (`src/lib/cot/signal.ts`) → analyze positions, detect reversals
6. **Notify Engine** (`src/lib/cot/notify.ts`) → create notifications for users with alerts
7. **Optional** → WebSocket broadcast (not yet implemented; polling via UI)

### Tertiary Flow: Notifications
1. **Server** (API route or cron) → `prisma.notification.create()`
2. **Client Poller** (`src/components/shell/NotificationsPoller.tsx`) → GET `/api/notifications`
3. **API Route** → `prisma.notification.findMany({ where: { userId } })`
4. **Zustand** → setNotifs() updates unreadCount
5. **UI** → red badge on bell icon, drawer shows list

### Layout Hydration (On App Load)
1. **Browser** → navigates to `/dashboard`
2. **Proxy** → validates session (JWT in cookie)
3. **Layout Server Component** (`src/app/(app)/layout.tsx`) → `loadAppData()`
   - `supabase.auth.getUser()` → verify session
   - `prisma.user.findUnique()` → load user profile
   - `prisma.trade.findMany()` → load recent trades
   - Map Prisma models to Zustand types (dbTradeToStore, dbToAppUser)
4. **Component Render** → `<StoreHydrator user={user} trades={trades} />`
5. **StoreHydrator** (client component) → setUser, populate store
6. **Child Pages** → read from Zustand, no data refetch needed

## Key Abstractions

### Zustand Store (`src/lib/store.ts`)
- **Purpose:** Centralized client state
- **Pattern:** Slice-based state with actions (feed, notifs, priceAlerts, journaledAlerts, user, toasts)
- **Persistence:** localStorage for journaledAlerts; everything else refetched on load
- **Example:** `useStore().addTrade()` → creates trade and optimistically updates dashboard

### Prisma Lazy Singleton (`src/lib/prisma.ts`)
- **Purpose:** Global database client without connection pool bloat
- **Pattern:** Proxy pattern wraps lazy initialization; `import { prisma }` looks like a direct reference
- **Adapter:** PrismaPg for node-postgres (pg) to avoid native bindings
- **Example:** `prisma.trade.create({ data: {...} })` is safe to call from any server component or API route

### Supabase SSR (`src/lib/supabase/`)
- **Purpose:** Auth layer with server-side cookie management
- **Clients:**
  - `server.ts` — used in server components & API routes (no middleware)
  - `client.ts` — used in client components (browser-only)
  - `admin.ts` — privileged operations (backfill, migrations)
- **Pattern:** Supabase SSR handles cookie sync automatically; no manual JWT handling

### COT Analysis Engine (`src/lib/cot/`)
- **Components:**
  - `sync.ts` — fetches & parses CFTC Commitment of Traders data
  - `signal.ts` — detects positioning reversals, magnitude thresholds, pair-based confidence
  - `commentary.ts` — humanized prose explanations of bias (e.g., "Large specs heavily long")
  - `notify.ts` — creates user notifications for tracked signals
  - `types.ts` — CotReport, CotBias, CotSignal TypeScript schemas
- **Example:** COT sync detects USD net positioning reversal → commentary generated → notification created for Pro+ users

### MacroEdge Fundamentals (`src/lib/macro/`)
- **Components:**
  - `pairBias.ts` — scores pair bullish/bearish based on central bank stance, yield spread, economic data
  - `scoring.ts` — aggregates multiple factors (inflation, rate decisions, gdp growth) into a conviction score
  - `confluence.ts` — combines COT positioning + macro bias for highest-conviction trades
  - `gavoPrompt.ts` — Gavo AI explanation of macro thesis
  - `rules.ts` — S&D & ICT SMC rules for validation
  - `indicatorMap.ts` — maps FRED/Finnhub fields to readable names
- **Example:** USD rate hike signal + ECB dovish commentary → EUR/USD bearish bias → notification

### Data Mappers (in layout)
- **Purpose:** Transform Prisma models to client types
- **Pattern:** `dbTradeToStore()`, `dbToAppUser()` functions in layout.tsx
- **Reason:** Keeps Prisma schema independent; schema changes don't break client code
- **Example:** Enum casing (db: `LONG` → client: `"long"`)

## Entry Points

| Entry | Trigger | Responsibilities | File |
|---|---|---|---|
| **Next.js Dev Server** | `npm run dev` | Start dev server, enable hot reload, serve routes | — |
| **Proxy Middleware** | Every request | Host check, auth session validation, redirect logic | `src/proxy.ts` |
| **App Layout** | Route match `(app)/*` | Load user & trades, hydrate Zustand, render shell | `src/app/(app)/layout.tsx` |
| **Auth Layout** | Route match `(auth)/*` | Public auth pages, no data loading | `src/app/(auth)/layout.tsx` |
| **Marketing Layout** | Route match `(marketing)/*` | Public pages, no auth required | `src/app/(marketing)/layout.tsx` |
| **Page Component** | Route match `/dashboard`, etc. | Fetch additional page-specific data, render content | `src/app/(app)/*/page.tsx` |
| **API Route** | POST/GET `/api/trades/`, etc. | Auth check, business logic, Prisma query, JSON response | `src/app/api/**` |
| **Cron/Webhook** | External trigger (Sunday 00:00, Lenco event, etc.) | Data sync, notifications, reconciliation | `src/app/api/cot/sync/route.ts`, `src/app/api/webhooks/` |

## Architectural Constraints

1. **Prisma v7 with PrismaPg:**
   - Connection URL in `prisma.config.ts` (not `schema.prisma`)
   - DIRECT_URL for migrations, DATABASE_URL for app queries
   - Must call `dotenv.config()` manually in prisma.config.ts since CLI doesn't auto-load when config file exists

2. **Next.js 16 Middleware Naming:**
   - Middleware function is `export const proxy` (not `middleware`)
   - Configured via `export const config` matcher

3. **Supabase SSR:**
   - Session stored in secure http-only cookies (set by middleware)
   - getSession() reads JWT locally (no network call); getUser() hits Supabase (requires network)
   - Always call getUser() in API routes before DB operations (validation)

4. **Host-Based Routing:**
   - Apex (smilefxtraders.com) redirects non-marketing paths to app subdomain
   - App subdomain (app.smilefxtraders.com) redirects marketing paths to apex
   - localhost and vercel.app subdomains serve everything (local dev & preview unaffected)

5. **Client State Persistence:**
   - Zustand store is NOT persisted except for journaledAlerts (localStorage)
   - On every app load, layout fetches fresh data and hydrates store (no stale state)
   - Price alerts, feed, notifs are session-only; lost on page refresh

6. **API Route Auth Pattern:**
   - Every API route must call `getUser()` and check returned user.id
   - `getSession()` is insufficient (local JWT could be spoofed in dev)

7. **Data Mutation Pattern:**
   - Client optimistic update (optional) + API call
   - API validates & persists
   - Client refetch or server-sent data for confirmation
   - No optimistic UI rollback on error (toast error message)

8. **React Query (optional):**
   - Installed but not widely used yet; Zustand is the primary state container
   - Hooks in `lib/hooks/` (useNotifications, useTrades, useInstruments) can migrate to React Query later

## Anti-Patterns

### 1. Hardcoded Hex Values in Components
- **What happens:** Color tokens are scattered across TSX files, inconsistent across dark/light themes
- **Why wrong:** Violates CLAUDE.md design token rule; makes rebrand impossible
- **Do this instead:** Reference CSS variables only (`--teal`, `--coral`, etc.); define once in Tailwind config theme; import token file if needed in JS

### 2. Prisma Queries in Client Components
- **What happens:** "use client" marked components attempt `prisma.trade.findMany()`
- **Why wrong:** Prisma client runs on server only; will fail silently or throw hydration mismatch
- **Do this instead:** Move query to server component or API route; pass fetched data as props

### 3. Direct Database Calls Without Auth Check
- **What happens:** API route runs `prisma.user.findUnique(id)` without verifying `req.user.id` matches `id`
- **Why wrong:** Data leakage (users can read other users' data)
- **Do this instead:** Always call `getUser()` in API routes; validate userId matches before fetching

### 4. Storing Secrets in Component Props or Zustand
- **What happens:** API keys, tokens, or Supabase credentials leaked to browser bundle
- **Why wrong:** Client-side code is visible in browser; all secrets compromised
- **Do this instead:** Server components or API routes only; use environment variables with NEXT_PUBLIC_ prefix only for public keys

### 5. Infinite Re-renders in useEffect Without Dependency Array
- **What happens:** Component fetches data on every render → infinite loop → browser hangs
- **Why wrong:** No deps = effect runs every render; effect triggers state update
- **Do this instead:** Always include deps array; for fetch-on-mount, use `[]`; document side effects

### 6. Mutating Zustand State Directly
- **What happens:** `const feed = useStore().feed; feed.push(...) → store does not update`
- **Why wrong:** Zustand requires action creators (setter functions); direct mutation is not reactive
- **Do this instead:** Use store actions: `useStore().addPost(post)`

### 7. Missing COT Net Sign Inversion
- **What happens:** Nets written pair-frame (EUR/USD) but read USD-base (inverted)
- **Why wrong:** Sign flip causes bias reversal (long reads as short)
- **Do this instead:** Document & normalize at write/read boundaries; see CRON.md COT conventions section

## Error Handling

### Client-Side (Components & Hooks)
- **Pattern:** try-catch in fetches, fallback to empty state
- **Example:** `useTrades()` hook catches fetch errors, returns empty array, shows toast
- **User feedback:** Toast with error message (coral tone, 3.2s auto-dismiss)

### API Routes
- **Pattern:** Error catch → NextResponse.json({ error: "message" }, { status: 400 })
- **Example:** Trade creation validates pair & model → returns 400 if invalid
- **Logging:** console.error in dev; structured logging in prod (via Supabase logs)

### Server Components
- **Pattern:** try-catch around Prisma queries; `unstable_rethrow` re-throws to error boundary
- **Example:** `loadAppData()` catches auth errors → rethrow to (app)/error.tsx
- **Fallback:** (app)/error.tsx shows error UI or redirects to login

### Database Transactions
- **Pattern:** Prisma `$transaction()` for multi-step operations
- **Example:** Create trade + create notification in one transaction (all-or-nothing)
- **Rollback:** Transaction automatically rolls back on error; no manual cleanup

### External APIs (Finnhub, FRED, World Bank)
- **Pattern:** Fetch with timeout; retry once on 5xx
- **Example:** COT sync retries if Finnhub returns 502
- **Fallback:** Cache previous result or skip data point; log for debugging

## Cross-Cutting Concerns

### Authentication
- **Mechanism:** Supabase Auth (OAuth or email/password)
- **Session Storage:** Secure http-only cookie (set by proxy middleware)
- **Validation:** getUser() in API routes, Supabase SSR in server components
- **Check point:** Every API route and protected page

### Authorization
- **Pattern:** Role-based (STUDENT, INSTRUCTOR) stored in User.role
- **Plan-based:** Plan (FREE, PRO, FUNDED) stored in User.plan; checked at feature gates
- **Utilities:** `plan-guard.ts` and `admin-guard.ts` in lib/

### Logging
- **Development:** Prisma logs all queries (`log: ["query", "error", "warn"]`)
- **Production:** Errors only (`log: ["error"]`)
- **Sentry/Monitoring:** Not configured; recommend adding for prod
- **Format:** console.log/error; consider structured logging (Pino, Winston)

### Validation
- **Input:** Manual validation in API routes (pair in PAIRS list, model in MODELS list)
- **Database:** Prisma schema constraints (unique, not null, enum)
- **Library:** `validation.ts` exports helpers (isValidPair, isValidModel)
- **Patterns:** Validate early in API routes; return 400 for bad input

### Rate Limiting
- **Mechanism:** Upstash Redis client available (`lib/redis.ts`)
- **Status:** Not yet implemented; tokens created but no middleware
- **Recommendation:** Add rate limit middleware for API routes (10 req/min per user, 100 req/min per IP)

### Caching
- **Prompt Caching:** Anthropic SDK used in review route (SMC_SYSTEM_PROMPT cached at 10% cost)
- **Database:** No caching layer; Prisma queries hit database directly
- **HTTP:** No custom cache headers; rely on Next.js ISR or manual revalidation
- **Redis:** Available for session store / leaderboard / rate limits (not yet used)

### Monitoring & Observability
- **Status:** Not implemented
- **Recommendation:**
  - Error tracking (Sentry)
  - Performance monitoring (Vercel Analytics)
  - Structured logging (Supabase logs + external service like Datadog)
  - Database query monitoring (Prisma Studio in dev, insights in Supabase console)

---

*Architecture analysis completed 2026-07-11*
