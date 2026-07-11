# Codebase Structure

**Analysis Date:** 2026-07-11

## Directory Layout

```
smile-fx-traders/
├── .planning/                   # planning docs (architecture, structure, integrations)
│   └── codebase/
│       ├── ARCHITECTURE.md      # system design, layers, data flow
│       ├── STRUCTURE.md         # this file
│       ├── STACK.md             # tech stack overview
│       └── INTEGRATIONS.md      # external services & webhooks
├── .next/                       # Next.js build output (git-ignored)
├── .git/                        # git repository
├── .env                         # environment variables (git-ignored)
├── .env.local                   # local overrides (git-ignored)
├── .gitignore                   # git ignore rules
├── .mcp.json                    # MCP server config
├── .claude/                     # Claude Code settings
├── CLAUDE.md                    # project instructions for Claude
├── CRON.md                      # cron/webhook event specs (COT sync, notifications)
├── FEATURES.md                  # feature checklist, ship log
├── MOBILE_FIRST_DESIGN_PLAN.md  # responsive redesign plan
├── package.json                 # npm dependencies & scripts
├── package-lock.json            # dependency lock
├── tsconfig.json                # TypeScript config
├── next.config.ts               # Next.js config
├── postcss.config.mjs           # Tailwind CSS config
├── eslint.config.mjs            # ESLint rules
├── prisma.config.ts             # Prisma config (loads .env, sets datasource URL)
├── prisma/
│   ├── schema.prisma            # database schema (User, Trade, Alert, etc.)
│   ├── migrations/              # timestamped SQL migration files
│   ├── seed.ts                  # main database seed script
│   ├── seed-cot.ts              # COT historical data seed
│   ├── seed-cot-patch.ts        # COT data patch/backfill
│   └── test-webhook.ts          # webhook testing utility
├── src/
│   ├── proxy.ts                 # Next.js middleware (auth + host-based routing)
│   ├── app/                     # Next.js App Router
│   │   ├── (app)/               # authenticated route group
│   │   │   ├── layout.tsx       # shell layout (sidebar, topbar, data hydration)
│   │   │   ├── dashboard/       # trade summary dashboard
│   │   │   ├── journal/         # trade entry/edit, list
│   │   │   │   └── [id]/page.tsx    # single trade detail
│   │   │   ├── cot/             # commodity futures analysis (CFTC positioning)
│   │   │   │   └── [pair]/page.tsx  # pair-specific COT detail
│   │   │   ├── macroedge/       # fundamental/macro analysis
│   │   │   │   └── [currency]/page.tsx
│   │   │   ├── validator/       # trade rule validation tool
│   │   │   ├── trend/           # trend matrix (pair bias tracking)
│   │   │   ├── calendar/        # economic calendar
│   │   │   ├── alerts/          # instructor alerts, price alerts
│   │   │   ├── community/       # feed, posts, comments
│   │   │   ├── academy/         # lessons, courses
│   │   │   ├── fx-orders/       # live forex order tracker
│   │   │   │   └── [date]/page.tsx
│   │   │   ├── pairs/           # forex pair hub
│   │   │   │   └── [pair]/page.tsx
│   │   │   ├── profile/         # user profile, stats, leaderboard
│   │   │   ├── settings/        # user preferences, notifications, billing
│   │   │   ├── membership/      # plan management, upgrade flow
│   │   │   ├── sessions/        # trading session times, timezones
│   │   │   ├── notifications/   # notification center
│   │   │   └── admin/           # instructor panel
│   │   │       ├── academy/     # course management
│   │   │       ├── alerts/      # alert management
│   │   │       ├── instruments/ # pair/instrument config
│   │   │       ├── pricing/     # plan config
│   │   │       └── students/    # student roster, stats
│   │   ├── (auth)/              # unauthenticated route group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── onboarding/      # post-signup profile setup
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (marketing)/         # public route group
│   │   │   ├── page.tsx         # homepage
│   │   │   ├── features/
│   │   │   ├── pricing/
│   │   │   ├── about/
│   │   │   ├── learn/           # educational content hub
│   │   │   ├── academy/         # public academy preview
│   │   │   ├── community/       # public community stories
│   │   │   └── our-community/
│   │   └── api/                 # server-side API routes
│   │       ├── review/route.ts  # Gavo AI trade review (Anthropic SDK)
│   │       ├── trades/          # trade CRUD
│   │       ├── alerts/          # alert management
│   │       ├── cot/             # COT sync, refresh, signal detection
│   │       ├── macro/           # macro scoring, bias calculation
│   │       ├── calendar/        # economic calendar fetch
│   │       ├── prices/          # live price fetching
│   │       ├── academy/         # course CRUD, lesson tracking
│   │       ├── community/       # post/comment CRUD
│   │       ├── notifications/   # user notifications
│   │       ├── user/            # user profile, preferences
│   │       ├── instruments/     # instrument config
│   │       ├── admin/           # admin operations
│   │       ├── webhooks/        # inbound webhooks (Lenco, fx-orders, etc.)
│   │       ├── emails/          # email sending (Resend)
│   │       ├── subscriptions/   # billing/subscription lifecycle
│   │       ├── trend-matrix/    # TrendMatrix refresh
│   │       └── fx-orders/       # live FX order sync (Lenco)
│   ├── components/              # reusable React UI components
│   │   ├── shell/               # app shell (nav, topbar, sidebar, bottom tabs)
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── BottomTabBar.tsx
│   │   │   ├── AuthShell.tsx    # wrapper for auth pages
│   │   │   ├── StoreHydrator.tsx # initializes Zustand on client
│   │   │   └── NotificationsPoller.tsx
│   │   ├── ui/                  # base UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ... (other primitives)
│   │   ├── cot/                 # COT-specific components
│   │   │   ├── PositioningChart.tsx  # SVG candlestick chart
│   │   │   ├── CotIndexDisplay.tsx   # positioning index tiles
│   │   │   ├── CotBiasPanel.tsx      # bias indicator + legend
│   │   │   ├── CotLockScreen.tsx     # pro-only lock overlay
│   │   │   └── signalCfg.ts          # chart configuration
│   │   ├── macro/               # MacroEdge components
│   │   │   ├── FundamentalsPanel.tsx # indicator values + trend
│   │   │   ├── GavoExplanation.tsx  # AI macro thesis
│   │   │   └── NewsFeed.tsx          # economic events
│   │   ├── pricing/             # subscription UX
│   │   │   ├── PlanCard.tsx     # authenticated user plan selection
│   │   │   └── MarketingPlanCard.tsx # public plan comparison
│   │   ├── checkout/            # payment flow
│   │   │   ├── CheckoutModal.tsx
│   │   │   └── NetworkLogo.tsx  # payment network icons
│   │   ├── search/              # global search (⌘K)
│   │   │   └── SearchModal.tsx
│   │   ├── marketing/           # public site components
│   │   │   ├── MarketingNav.tsx
│   │   │   ├── MarketingFooter.tsx
│   │   │   ├── FeatureBlock.tsx
│   │   │   ├── FAQAccordion.tsx
│   │   │   ├── ChartViz.tsx     # marketing demo chart
│   │   │   ├── CTACard.tsx
│   │   │   └── MarketingScripts.tsx  # analytics/tracking
│   │   ├── AIReview.tsx         # Gavo AI review display & refetch
│   │   ├── cn.ts                # Tailwind className merger (clsx)
│   │   ├── *-guard.ts           # authorization guards (admin, plan-based)
│   │   ├── *-protection.ts      # bot protection, security utilities
│   │   ├── nav-active-style.ts  # nav item active state
│   │   └── providers.tsx        # React context providers (next-themes, React Query)
│   ├── lib/                     # shared application logic & utilities
│   │   ├── store.ts             # Zustand client state (trades, feed, notifs, etc.)
│   │   ├── prisma.ts            # Prisma lazy singleton ORM client
│   │   ├── providers.tsx        # React context setup
│   │   ├── redis.ts             # Upstash Redis client
│   │   ├── validation.ts        # input validators
│   │   ├── supabase/            # Supabase auth clients
│   │   │   ├── server.ts        # server-only client (no middleware)
│   │   │   ├── client.ts        # browser-only client
│   │   │   ├── admin.ts         # admin/privileged client
│   │   │   └── cookie-options.ts
│   │   ├── cot/                 # COT data sync & analysis
│   │   │   ├── sync.ts          # fetch & parse CFTC Commitment of Traders
│   │   │   ├── signal.ts        # detect positioning reversals, bias shifts
│   │   │   ├── commentary.ts    # humanized bias descriptions
│   │   │   ├── notify.ts        # create notifications for tracked signals
│   │   │   ├── query.ts         # database queries for COT data
│   │   │   └── types.ts         # CotReport, CotBias, CotSignal TypeScript shapes
│   │   ├── macro/               # MacroEdge fundamentals analysis
│   │   │   ├── pairBias.ts      # pair-level bias scoring (USD-based)
│   │   │   ├── scoring.ts       # aggregate fundamental indicators
│   │   │   ├── confluence.ts    # combine COT + macro bias
│   │   │   ├── gavoPrompt.ts    # AI macro thesis generator
│   │   │   ├── rules.ts         # macro-based trade rules
│   │   │   └── indicatorMap.ts  # FRED/Finnhub field labels
│   │   ├── frameworks.ts        # SMC & S&D rulebook (hardcoded rules, validation)
│   │   ├── plans.ts             # plan definitions, feature gates
│   │   ├── pairs.ts             # forex pair list (EURUSD, XAUUSD, etc.)
│   │   ├── date.ts              # session windows, timezone utilities
│   │   ├── mobile-money.ts      # mobile money providers (K-Bill, MTN, etc.)
│   │   ├── notifications.ts     # in-app notification types, icons
│   │   ├── notif-prefs.ts       # notification preference schema
│   │   ├── notify-events.ts     # notification event triggers
│   │   ├── finnhub.ts           # Finnhub API client (calendar, quotes)
│   │   ├── fred.ts              # FRED API client (US economic indicators)
│   │   ├── worldbank.ts         # World Bank API client
│   │   ├── email/               # Resend email templates
│   │   │   └── ...
│   │   ├── server/              # server-only utilities
│   │   │   ├── getInstruments.ts
│   │   │   └── getPlanPrices.ts
│   │   └── hooks/               # React hooks (client-side)
│   │       ├── useNotifications.ts
│   │       ├── useTrades.ts
│   │       ├── useInstruments.ts
│   │       └── useClampedPosition.ts
│   └── types/                   # domain type definitions
│       ├── fx-orders.ts         # FX order sync schemas
│       └── macro.ts             # MacroEdge data shapes
├── public/                      # static assets (favicon, images)
├── supabase/                    # Supabase config & edge function migrations
└── README.md                    # project overview
```

## Directory Purposes

### `.planning/codebase/`
- **Purpose:** Architecture documentation
- **Contains:** ARCHITECTURE.md (layers, data flow), STRUCTURE.md (this file), STACK.md (tech choices), INTEGRATIONS.md (webhooks)
- **Key Files:**
  - `ARCHITECTURE.md` — system design, component responsibilities, entry points, anti-patterns
  - `STRUCTURE.md` — directory layout, file organization, where to add code
  - `STACK.md` — Next.js, TypeScript, Tailwind, Prisma, Supabase
  - `INTEGRATIONS.md` — Finnhub, FRED, World Bank, Lenco, Anthropic, Supabase webhooks

### `prisma/`
- **Purpose:** Database schema, migrations, seeders
- **Contains:** schema.prisma (models), migrations/ (SQL), seed files
- **Key Files:**
  - `schema.prisma` — Prisma models (User, Trade, Alert, CotReport, MacroScoring, etc.)
  - `prisma.config.ts` — Prisma configuration with env loader
  - `seed.ts` — initial data (plans, instruments, user fixtures)
  - `seed-cot.ts` — historical COT data load
  - `migrations/` — timestamped SQL generated by `prisma migrate dev`

### `src/`
- **Purpose:** Application source code
- **Key Subdirs:**
  - `app/` — Next.js App Router (pages, layouts, API routes)
  - `components/` — reusable React UI
  - `lib/` — business logic, state, utilities
  - `types/` — TypeScript type definitions
  - `proxy.ts` — middleware (auth + host-based routing)

### `src/app/`
- **Purpose:** Next.js App Router
- **Organization:** Route groups `(app)`, `(auth)`, `(marketing)`, plus `api/` routes
- **Key Subdirs:**
  - `(app)/` — authenticated dashboard & tools
  - `(auth)/` — login, signup, onboarding, password reset
  - `(marketing)/` — public homepage, features, learn, about
  - `api/` — server-side endpoints (no UI)

### `src/app/(app)/`
- **Purpose:** Authenticated user dashboard & tools
- **Contains:** Each subdirectory is a route page or tool
- **Key Pages:**
  - `dashboard/` — summary stats, recent trades
  - `journal/` — trade entry, history, AI review
  - `cot/` — commodity futures positioning
  - `macroedge/` — economic indicators, pair bias
  - `validator/` — trade rule checker
  - `alerts/` — price alerts, instructor setups
  - `community/` — social feed, leaderboard
  - `academy/` — lessons, courses, progress
  - `admin/` — instructor panel

### `src/app/api/`
- **Purpose:** Server-side API endpoints (no HTML response)
- **Organization:** Organized by domain (trades, alerts, cot, macro, etc.)
- **Pattern:** Each directory has `route.ts` (GET/POST/PATCH/DELETE handler)
- **Key Routes:**
  - `review/route.ts` — Gavo AI trade review (calls Anthropic SDK)
  - `trades/route.ts` — trade CRUD
  - `alerts/route.ts` — alert management
  - `cot/sync/route.ts` — COT report refresh
  - `webhooks/*` — inbound Lenco payments, fx-orders, cron triggers

### `src/components/`
- **Purpose:** Reusable React UI components
- **Organization:** by feature domain or functionality
- **Key Subdirs:**
  - `shell/` — app layout (Sidebar, Topbar, BottomTabBar)
  - `ui/` — base primitives (Button, Avatar, Modal, Toast, etc.)
  - `cot/` — COT visualization (chart, bias panel, index display)
  - `macro/` — macro fundamentals UI (panel, thesis, news)
  - `pricing/` — plan selection cards
  - `marketing/` — public site components
  - Single files: `AIReview.tsx`, guards, protections, utilities

### `src/lib/`
- **Purpose:** Shared application logic & utilities
- **Organization:** by domain, utility type, or module
- **Key Subdirs:**
  - `supabase/` — auth clients (server, client, admin)
  - `cot/` — COT data engine (sync, signal, commentary, notify)
  - `macro/` — MacroEdge scoring (bias, confluence, rules)
  - `email/` — Resend email templates
  - `server/` — server-only utilities
  - `hooks/` — React hooks (useNotifications, useTrades, etc.)
- **Key Files:**
  - `store.ts` — Zustand client state
  - `prisma.ts` — Prisma ORM singleton
  - `frameworks.ts` — SMC & S&D rulebook
  - `plans.ts` — plan definitions, feature gates
  - `pairs.ts` — instrument list
  - `date.ts` — session times, timezones
  - `finnhub.ts`, `fred.ts`, `worldbank.ts` — external API clients

### `src/types/`
- **Purpose:** TypeScript type definitions
- **Contains:** Domain types not in schema.prisma or lib/store.ts
- **Key Files:**
  - `fx-orders.ts` — FX order sync API shapes
  - `macro.ts` — MacroEdge data structures

### `prisma/migrations/`
- **Purpose:** Database schema evolution
- **Pattern:** One directory per migration (timestamp_description)
- **Files:** Each contains `migration.sql` (generated by Prisma CLI)
- **Workflow:** `npx prisma migrate dev --name <name>` creates migration, runs it, regenerates Prisma client

## Key File Locations

| Category | File | Purpose |
|---|---|---|
| **Entry Points** | `src/proxy.ts` | middleware + auth + routing |
| | `src/app/(app)/layout.tsx` | shell + data hydration |
| | `src/app/api/[endpoint]/route.ts` | API handler |
| **Core State** | `src/lib/store.ts` | Zustand client state |
| | `src/lib/prisma.ts` | database ORM |
| | `prisma/schema.prisma` | data models |
| **Configuration** | `prisma.config.ts` | Prisma CLI config |
| | `next.config.ts` | Next.js config |
| | `tsconfig.json` | TypeScript config |
| | `package.json` | npm scripts + dependencies |
| **Authentication** | `src/lib/supabase/server.ts` | server auth client |
| | `src/lib/supabase/client.ts` | browser auth client |
| | `src/proxy.ts` | session validation |
| **Data Mappers** | `src/app/(app)/layout.tsx` | dbTradeToStore(), dbToAppUser() |
| **Trade Review** | `src/app/api/review/route.ts` | Gavo AI review handler |
| | `src/components/AIReview.tsx` | review display component |
| | `src/lib/macro/gavoPrompt.ts` | macro thesis AI prompt |
| **COT Analysis** | `src/lib/cot/sync.ts` | fetch & parse CFTC |
| | `src/lib/cot/signal.ts` | detect bias reversals |
| | `src/lib/cot/commentary.ts` | humanized descriptions |
| | `src/app/api/cot/sync/route.ts` | sync trigger endpoint |
| **MacroEdge** | `src/lib/macro/pairBias.ts` | pair-level scoring |
| | `src/lib/macro/scoring.ts` | aggregate indicators |
| | `src/components/macro/FundamentalsPanel.tsx` | UI display |
| **External APIs** | `src/lib/finnhub.ts` | calendar, quotes |
| | `src/lib/fred.ts` | US economic data |
| | `src/lib/worldbank.ts` | global economic data |
| **Rules & Validation** | `src/lib/frameworks.ts` | SMC & S&D rulebook |
| | `src/lib/plans.ts` | plan definitions + gates |
| | `src/lib/validation.ts` | input validators |
| **Utilities** | `src/lib/date.ts` | sessions, timezones |
| | `src/lib/pairs.ts` | instrument list |
| | `src/lib/notifications.ts` | notif types |
| **Styling** | `tailwind.config.ts` | design tokens, theme |
| | `src/lib/cn.ts` | className merger |

## Naming Conventions

### Files
- **React Components:** PascalCase with `.tsx` extension (e.g., `TradeEntryForm.tsx`, `AIReview.tsx`)
- **Client Utilities:** camelCase with `.ts` extension (e.g., `formatPrice.ts`, `calculateR.ts`)
- **Server-only Utilities:** camelCase with `.ts`, place in `lib/server/` (e.g., `getInstruments.ts`)
- **Hooks:** camelCase, start with `use` (e.g., `useTrades.ts`, `useNotifications.ts`)
- **Schemas/Types:** PascalCase with `.ts` extension (e.g., `schema.ts`, `types.ts`)
- **Config Files:** lowercase or camelCase (e.g., `prisma.config.ts`, `next.config.ts`)
- **Migration Files:** `YYYYMMDDHHMMSS_description/migration.sql` (auto-generated by Prisma)

### Directories
- **Route Groups:** wrapped in parentheses, lowercase (e.g., `(app)`, `(auth)`, `(marketing)`)
- **Dynamic Routes:** wrapped in brackets, lowercase (e.g., `[id]`, `[pair]`, `[currency]`)
- **API Folders:** named after domain (e.g., `api/trades`, `api/cot`, `api/macro`)
- **Component Folders:** PascalCase or feature name (e.g., `shell`, `ui`, `cot`, `macro`, `marketing`)
- **Lib Folders:** camelCase or feature name (e.g., `supabase`, `cot`, `macro`, `email`, `hooks`, `server`)

### Exports
- **Default Exports:** used for pages/layouts (e.g., `export default Page`, `export default Layout`)
- **Named Exports:** used for components, utilities, types (e.g., `export const Button`, `export function getUser()`)
- **Re-exports:** lib/index files gather exports (e.g., `lib/cot/index.ts` re-exports sync, signal, commentary)

### Variables & Constants
- **React Props Interface:** `[ComponentName]Props` (e.g., `TradeFormProps`)
- **Zustand Actions:** verb + noun (e.g., `addTrade`, `setUser`, `toggleLike`)
- **API Query Params:** PascalCase or snake_case per API spec (e.g., `userId`, `pair_id`)
- **Database Fields:** snake_case in schema.prisma, camelCase in generated Prisma client (e.g., `entry_price` → `entryPrice`)
- **Enums:** PascalCase in schema, snake_case in enum values (e.g., `enum Role { STUDENT INSTRUCTOR }`)

## Where to Add New Code

### New Feature Page
1. Create directory in `src/app/(app)/feature-name/`
2. Add `page.tsx` (React component, optionally a server component)
3. Optionally add `layout.tsx` if the page has sub-routes
4. If the page needs data: call Prisma in a server component or via `getPageData()` utility
5. Wire it into shell navigation:
   - Add link in `src/components/shell/Sidebar.tsx` (desktop nav)
   - Add tab in `src/components/shell/BottomTabBar.tsx` (mobile nav)
   - Update `src/lib/nav-data.ts` if it exists (nav item configuration)

### New Component
1. Create `.tsx` file in `src/components/[domain]/` (e.g., `src/components/ui/NewButton.tsx`)
2. Import React at top
3. Define props interface (`NewButtonProps`)
4. Export as default or named export
5. Use Tailwind classes (no inline styles) + design tokens (CSS variables)
6. If client-side state: use Zustand hook (`useStore().action()`)
7. If server-side data: pass as props from parent component

### New API Route
1. Create directory `src/app/api/[domain]/` if it doesn't exist
2. Add `route.ts` with handler (e.g., `export async function POST(req)`)
3. At top of handler:
   ```typescript
   const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   ```
4. Validate input: `if (!isValidPair(pair)) return NextResponse.json({ error: "Invalid pair" }, { status: 400 })`
5. Execute Prisma query: `const trade = await prisma.trade.create({ data: {...} })`
6. Return JSON response: `return NextResponse.json(trade, { status: 201 })`
7. Test with curl or Postman

### New Database Model
1. Add model to `prisma/schema.prisma` (e.g., `model MyModel { id String @id ... }`)
2. Run `npx prisma migrate dev --name add_my_model`
3. Prisma CLI generates migration SQL and updates `@prisma/client`
4. Import `{ prisma }` from `src/lib/prisma` in API routes or server components
5. Use Prisma client: `prisma.myModel.create({ data: {...} })`

### New Utility Function
- **Client Utility:** `src/lib/[name].ts`, export function, use in components
- **Server Utility:** `src/lib/server/[name].ts`, import only in API routes or server components
- **Hook:** `src/lib/hooks/[name].ts`, starts with `use`, call from client components
- **Type:** `src/types/[name].ts` or inline in `src/lib/[name].ts`

### New External API Integration
1. Create client in `src/lib/[api-name].ts` (e.g., `src/lib/finnhub.ts`)
2. Export typed functions: `export async function fetchCalendar(pair: string): Promise<Event[]>`
3. Handle errors: try-catch, fallback to cached data or empty result
4. Add env vars to `.env.example` and `.env.local`
5. Use in API routes or server components: `import { fetchCalendar } from "@/lib/finnhub"`
6. Document API key & rate limits in INTEGRATIONS.md

### New Email Template (Resend)
1. Create `.tsx` file in `src/lib/email/templates/[name].tsx`
2. Export React component (HTML email)
3. Use in API route: `import { render } from "react-email"; await resend.emails.send({ html: render(<EmailTemplate />) })`
4. Test in browser before sending

### New Notification Type
1. Add to Notification enum in `prisma/schema.prisma`: `enum NotificationType { ... NEW_TYPE }`
2. Run `npx prisma migrate dev`
3. Add icon & color in `src/lib/notifications.ts` (NOTIFICATION_ICON_MAP, NOTIFICATION_TONE_MAP)
4. Create notification in API route: `await prisma.notification.create({ data: { type: "NEW_TYPE", ... } })`
5. Wire into NotificationsPoller to fetch & display

### New Zustand Store Slice
1. Open `src/lib/store.ts`
2. Add interface to `AppStore` with state fields and action methods
3. Add to store factory in `useStore()` initializer
4. Use in components: `const action = useStore().myAction`

## Special Directories

### `.next/`
- **Status:** Generated (git-ignored)
- **Purpose:** Next.js build output
- **Never commit this**
- **Regenerate with:** `npm run build`

### `node_modules/`
- **Status:** Generated (git-ignored)
- **Purpose:** npm dependencies
- **Never commit this**
- **Regenerate with:** `npm install`

### `prisma/migrations/`
- **Status:** Committed
- **Purpose:** Database schema history
- **Always commit migrations** for reproducibility
- **Do not hand-edit** — use `prisma migrate dev` to generate

### `prisma/generated/`
- **Status:** Generated (git-ignored)
- **Purpose:** Prisma client type definitions
- **Regenerate with:** `npx prisma generate` (run automatically by postinstall)

---

*Structure analysis completed 2026-07-11*
