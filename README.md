Smile FX Traders
A community trading platform for forex traders using Smart Money Concepts (ICT) and Supply & Demand, built for Zambia and Africa. Journal trades, get AI-reviewed against a 14-rule SMC/S&D rulebook, follow instructor alerts and the weekly trend matrix, and track COT positioning, the economic calendar, and FX option expiries — all from one dashboard.

Live at smilefxtraders.com.

Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma 7 + Supabase Postgres · Zustand · Anthropic SDK (AI trade review) · deployed on Cloudflare Workers via OpenNext.

Getting started
npm install
# create .env.local with the variables below
npm run dev                  # http://localhost:3000
Environment variables
Variable	Purpose
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY	Supabase project + anon key
DATABASE_URL / DIRECT_URL	Postgres connection (pooled / direct, for Prisma migrations)
ANTHROPIC_API_KEY	Gavo, the AI trade reviewer
RESEND_API_KEY	transactional email
TWELVE_DATA_API_KEY, FINNHUB_API_KEY, FRED_API_KEY (optional)	market data, economic calendar
FINNHUB_WEBHOOK_SECRET, LENCO_WEBHOOK_SECRET	inbound webhook verification
CRON_SECRET	shared secret for scheduled sync routes
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (optional)	rate limiting; fails open if unset
WAITLIST_MODE, MAINTENANCE_MODE, SITE_GATE_BYPASS_SECRET	pre-launch site gating, see src/middleware.ts
Full list, plus which routes consume each one, lives in .claude/CLAUDE.md.

Common commands
npm run dev          # start dev server
npm run build        # production build
npm run lint          # ESLint
npm run type-check   # tsc --noEmit

node node_modules/prisma/build/index.js migrate dev --name <name>   # DB migration
node node_modules/prisma/build/index.js generate                    # regenerate Prisma client
npx prisma studio                                                   # DB GUI

npm run cf:preview   # build + preview the Cloudflare Workers bundle locally
npm run cf:deploy    # build + deploy to Cloudflare Workers
Deploys to production run automatically via GitHub Actions on push to main.

Project docs
CLAUDE.md — architecture, state management, design tokens, shell layout, and domain vocabulary (SMC/ICT terms, pricing tiers, the AI review pipeline).
.claude/CLAUDE.md — environment variables and naming/code-style conventions.
design_handoff_smile_fx_traders/ — the original design prototypes. Reference only; don't copy verbatim into the Next.js app. 




<a href="https://github.com/kondwanimuwowo/smilefxtraders/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kondwanimuwowo/smilefxtraders" />
</a>

Made with [contrib.rocks](https://contrib.rocks).