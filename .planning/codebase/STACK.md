# Technology Stack
**Analysis Date:** 2026-07-11

## Languages (Primary / Secondary with where used)

- **TypeScript** (primary) — entire codebase: `src/`, `prisma/`, config files; strict mode enabled (`tsconfig.json`)
- **React 19.2.4** (client) — component layer; JSX syntax via TypeScript
- **JavaScript/Node.js** — runtime for Next.js server and API routes

## Runtime (Environment, Package Manager, lockfile present?)

- **Node.js** — Next.js app server and dev environment
- **npm 10+** (inferred from `package-lock.json`)
- **package-lock.json** present (294629 bytes, last updated 2026-07-07)
- **Build:** Next.js 16.2.7 (production build via `npm run build`)
- **Dev Server:** `npm run dev` (Next.js dev server)

## Frameworks (Core / Testing / Build-Dev, with versions and purpose)

### Core Frameworks
- **Next.js 16.2.7** — App Router (static/dynamic routes, middleware via `src/proxy.ts`)
- **React 19.2.4** — UI component library
- **Tailwind CSS 4** (PostCSS v4 via `@tailwindcss/postcss`) — utility-first styling with custom theme tokens
- **TypeScript 5.x** — static type checking
- **Prisma 7.8.0** — ORM for PostgreSQL; uses `@prisma/adapter-pg` for connection pooling
- **next-themes 0.4.6** — light/dark theme switching via `data-theme` attribute

### State Management
- **Zustand 5.0.14** — client-side state (trades, feed, notifications, user context)

### Build / Dev
- **ESLint 9** — code linting with Next.js config (`eslint-config-next` 16.2.7)
- **TypeScript Compiler** — type checking via `tsc --noEmit` (no emit, checking only)

### Testing
Not detected

## Key Dependencies (Critical / Infrastructure, with versions and why they matter)

### Database & ORM
- **`@prisma/client` 7.8.0** — Prisma client library
- **`@prisma/adapter-pg` 7.8.0** — PostgreSQL adapter for Prisma 7 (required for pooled connections)
- **`pg` 8.21.0** — PostgreSQL driver
- **`@types/pg` 8.20.0** — type definitions for pg

### Authentication & Authorization
- **`@supabase/supabase-js` 2.107.0** — Supabase client (auth, realtime, storage API)
- **`@supabase/ssr` 0.10.3** — Supabase SSR utilities (server client for middleware/API routes)

### AI & LLM
- **`@anthropic-ai/sdk` 0.100.1** — Anthropic API client (Gavo AI trade review via `/api/review/route.ts`)

### Data Fetching & Caching
- **`@tanstack/react-query` 5.101.0** — async state management and server-state sync
- **`@upstash/redis` 1.38.0** — Redis client (optional, for caching; fails open if not configured)

### Email
- **`resend` 6.12.4** — transactional email service (SMTP replacement)

### UI & Animation
- **`framer-motion` 12.42.0** — React animations (modals, drawers, transitions)
- **`@heroicons/react` 2.2.0** — icon library (Heroicons, subset registry in ICON_REGISTRY)
- **`lightweight-charts` 5.2.0** — candlestick chart library (TradingView-compatible SVG)
- **`canvas-confetti` 1.9.4** — celebration animation (victory confetti on trade wins)
- **`lenis` 1.3.25** — smooth scrolling library

### Date & Time
- **`date-fns` 4.4.0** — date manipulation
- **`date-fns-tz` 3.2.0** — timezone-aware date parsing

## Configuration (Environment: how configured, key configs required; Build: config files)

### Build & Compiler Configuration
- **`tsconfig.json`** — TypeScript compiler options; target ES2017, strict mode, path aliases (`@/*` → `src/*`)
- **`next.config.ts`** — Next.js configuration (currently minimal, only type signature)
- **`prisma.config.ts`** — Prisma configuration (explicitly loads `.env` and `.env.local` before CLI runs, since v7 no longer auto-loads with a config file present); specifies migrations seed script
- **`prisma/schema.prisma`** — database schema (PostgreSQL, Prisma 7 client generator); no connection URL (URL goes in `prisma.config.ts` under `datasource.url`)

### CSS & Theme
- **`src/app/globals.css`** — Tailwind imports, custom theme tokens (brand palette, light/dark variants), CSS variables mapped to `data-theme="light"|"dark"` via next-themes, safe-area insets for notch devices
- **Theme tokens** (CSS variables) — `--teal` (#08AEAA), `--coral` (#EA523D), `--gold` (#F8B93D), `--navy` (#0B425D), direction semantics (`--long`, `--short`)

### Environment Configuration
**Required env vars** (see `.env` / `.env.local`):
- **`NEXT_PUBLIC_SUPABASE_URL`** — Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — Supabase anon key (client-side)
- **`NEXT_PUBLIC_MARKETING_HOST`** — marketing domain (default: `smilefxtraders.com`)
- **`NEXT_PUBLIC_APP_HOST`** — app subdomain (default: `app.smilefxtraders.com`)
- **`DATABASE_URL`** — PostgreSQL connection string (Supabase)
- **`DIRECT_URL`** — direct PostgreSQL connection (for Prisma migrations; avoids connection pooling)
- **`RESEND_API_KEY`** — Resend email service API key
- **`ANTHROPIC_API_KEY`** — Anthropic SDK key (AI trade review)
- **`TWELVE_DATA_API_KEY`** — Twelve Data market data API
- **`FINNHUB_API_KEY`** — Finnhub economic calendar & news API
- **`FINNHUB_WEBHOOK_SECRET`** — Finnhub push webhook secret (for calendar event delivery)
- **`FRED_API_KEY`** — FRED (Federal Reserve Economic Data) API key (optional, falls back gracefully if missing)
- **`LENCO_WEBHOOK_SECRET`** — Lenco payment webhook HMAC secret
- **`CRON_SECRET`** — shared secret for cron-protected routes (`/api/cot/sync`, `/api/macro/*`, etc.)
- **`UPSTASH_REDIS_REST_URL`** — Upstash Redis endpoint (optional, fails open if missing)
- **`UPSTASH_REDIS_REST_TOKEN`** — Upstash Redis token (optional)

**Secrets file locations:**
- `.env` — committed defaults (non-sensitive)
- `.env.local` — local overrides, not committed (API keys, secrets)
- No `.env.example` found; secret names inferred from code

## Platform Requirements (Development / Production deployment target)

### Development
- **Node.js 18+** (inferred from `.next` types and modern async/await patterns)
- **npm 10+** (from `package-lock.json`)
- **Windows 10 Pro Education** (developer's platform, PowerShell/Git Bash available)

### Production Deployment
- **Vercel** (inferred; Next.js 16 on Vercel, host-based routing via `NEXT_PUBLIC_*_HOST` env vars, `VERCEL` env available at runtime)
- **PostgreSQL 14+** (Supabase-managed or self-hosted)
- **Node.js 18+ runtime** (Vercel's default)

---
*Stack analysis: 2026-07-11*
