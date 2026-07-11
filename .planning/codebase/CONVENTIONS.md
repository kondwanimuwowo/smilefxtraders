# Coding Conventions
**Analysis Date:** 2026-07-11

## Naming Patterns (files, functions, variables, types)

**Components & Exports:**
- Components: PascalCase filenames and function names (e.g., `Button.tsx`, `export function Button()`)
- API routes: lowercase (e.g., `route.ts`, `page.tsx`)
- Folders: kebab-case (e.g., `src/components/ui/`, `src/app/(app)/dashboard/`)

**Functions & Variables:**
- camelCase for all functions, variables, and parameters (e.g., `useLivePrices()`, `addPost()`, `tickMap`)
- Private helper functions: lowercase with underscore prefix for internal server functions (e.g., `function dbToApi()` within routes)
- Boolean variables: prefix with `is` or `has` (e.g., `isFreePlan`, `mounted`)

**Types & Interfaces:**
- PascalCase for all types and interfaces (e.g., `interface ModalProps`, `type Direction`)
- Import types with `type` keyword (e.g., `import type { Alert } from "@prisma/client"`)
- Export types from dedicated files (e.g., `src/lib/store.ts` exports all store types)

**Constants:**
- UPPER_SNAKE_CASE for module-level constants (e.g., `const FREE_ALERT_DELAY_MS = 4 * 60 * 60 * 1000` in `src/lib/notify-events.ts`)
- PascalCase for Record/mapping objects used as type definitions (e.g., `const SESSION_TO_STORE: Record<string, string>`)

Real examples from codebase:
- `src/components/ui/Button.tsx`: Component exports `Button` function with `ButtonProps` interface
- `src/lib/store.ts`: Zustand store with `useStore` hook, `AppStore` interface, `Direction` type
- `src/app/api/alerts/route.ts`: Mapping constants `SESSION_TO_STORE`, helper function `dbToApi()`

---

## Code Style (formatting tool + settings, linting tool + key rules)

**Formatter:** None explicit in codebase (no Prettier config)

**Linting:** ESLint 9 + Next.js built-in rules
- Config: `eslint.config.mjs` (flat config format)
- Rules applied:
  - `eslint-config-next/core-web-vitals` (Web Vitals linting)
  - `eslint-config-next/typescript` (TypeScript rules)
  - Custom override: `"react-hooks/set-state-in-effect": "off"`
- Run: `npm run lint`

**TypeScript:** Strict mode enabled (`tsconfig.json`)
- `strict: true`
- `noEmit: true`
- `isolatedModules: true`
- Target: ES2017
- Path alias: `@/*` → `./src/*`

**Key Style Patterns:**
- No semicolons at end of lines (omitted in many statements)
- Spaces around object destructuring: `{ data: { user } }`
- Arrow functions for callbacks: `(e) => { ... }`
- Conditional rendering via early return: `if (!mounted || !open) return null`
- No hardcoded hex colors in components — always use CSS variables (e.g., `bg-[var(--teal)]`)

Real examples:
- `src/components/ui/Button.tsx`: Uses `cn()` utility for className merging, CSS variables for all colors
- `src/app/api/review/route.ts`: try/catch wrapper around async operations, console.error logging

---

## Import Organization (order groups, path aliases)

**Import Order (strictly followed):**
1. React/DOM imports (`import { useState, ... } from "react"`, `import { createPortal } from "react-dom"`)
2. Next.js imports (`import Link from "next/link"`, `import { useRouter } from "next/navigation"`)
3. Third-party libraries (`import { useTheme } from "next-themes"`, `import { create } from "zustand"`)
4. Custom hooks (`import { useStore } from "@/lib/store"`)
5. Components (`import { Icon } from "@/components/ui"`)
6. Utilities & helpers (`import { cn } from "@/lib/cn"`)
7. Type-only imports (`import type { PriceTick } from "@/app/api/prices/route"`)

**Path Aliases:**
- `@/*` resolves to `./src/*`
- Always use absolute path aliases in imports, never relative paths (except within single-file modules)
- Example: `import { useStore } from "@/lib/store"` not `import { useStore } from "../../lib/store"`

Real example from `src/components/shell/Topbar.tsx`:
```typescript
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { useMarkNotifsRead } from "@/lib/hooks/useNotifications";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { SearchModal } from "@/components/search/SearchModal";
import { clampPosition } from "@/lib/hooks/useClampedPosition";
import type { PriceTick } from "@/app/api/prices/route";
```

---

## Error Handling (patterns with examples)

**API Routes (server):**
- Return `NextResponse.json({ error: "message" }, { status: 401/403/404/500 })` for errors
- Use try/catch at the route level for async operations
- Log errors with context prefix: `console.error("[context]", err)`
- Fire-and-forget async operations caught without blocking: `void fanOutInstructorAlert(alert).catch((e) => console.error(...))`

Example from `src/app/api/review/route.ts`:
```typescript
export async function POST(req: NextRequest) {
  try {
    // ... auth checks
    if (dbUser && dbUser.plan === "FREE") {
      return NextResponse.json({ error: "AI Review requires a Pro or Funded Track plan.", upgrade: true }, { status: 403 });
    }
    // ... async operations
    return NextResponse.json(json);
  } catch (err) {
    console.error("[review]", err);
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }
}
```

**Sync/Early-exit checks (no try/catch needed):**
- Use `if (!condition) return NextResponse.json(...)` for validation
- Example: `if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })`

**Client-side:**
- No global error boundary mentioned; components handle async errors locally with try/catch
- Example from `src/components/shell/Topbar.tsx` (useLivePrices):
```typescript
async function fetchRest() {
  try {
    const res = await fetch("/api/prices", { cache: "no-store" });
    if (!res.ok) return;
    const data: PriceTick[] = await res.json();
    // ... process data
  } catch { /* keep fallback */ }
}
```

**Fallback patterns:**
- Silent catches with fallback data: `catch { /* ignore */ }` or `catch { /* keep fallback */ }`
- Used when UI has sensible default (e.g., price ticker with fallback prices)

---

## Logging (framework, patterns)

**Framework:** Native `console` (no logging library)

**Patterns:**
- Use `console.info()` for info-level events
- Use `console.error()` for errors
- All logs prefixed with context in brackets: `[context-name]`
- Format: `console.info("[context] message: details")`

Real examples from `src/lib/notify-events.ts`:
```typescript
console.info(`[alerts] fan-out ${alert.id}: in-app paid=${paidCount} free-delayed=${freeCount}, emails sent=${emailResult.sent} failed=${emailResult.failed}`);
console.info(`[macro] bias flip ${pair} ${oldLabel ?? "—"} → ${newLabel}: notified ${count}`);
console.info(`[cot] signal event ${pair} (${reportDate}): notified ${count}`);
```

**Context prefixes used in codebase:**
- `[alerts]` — instructor alert fan-out
- `[review]` — AI trade review
- `[macro]` — MacroEdge bias flip
- `[cot]` — COT signal events

---

## Comments (when to comment, JSDoc/TSDoc usage)

**Section Separators:**
- Use `// ── Context ──────────────────────────────────────────────────────────` (with dashes) to mark logical sections
- Also used in CSS: `/* ─── Brand + semantic palette ──────────────────────────── */`

**JSDoc for exported functions & interfaces:**
- Use `/** ... */` block comments for functions that are exported or complex
- Include parameter descriptions and return type

Example from `src/lib/cot/signal.ts`:
```typescript
/**
 * Compute the current COT stats from newest-first rows.
 * Pass up to INDEX_WEEKS rows — the index is a percentile within that window.
 * `fallback` (from instruments.cotMin52w etc.) is only used when fewer than
 * 10 weeks exist in the DB.
 */
export function computeCotStats(rows: NetRow[], fallback?: CotRangeFallback): CotStats {
```

**Inline comments:**
- Use `//` for logic clarification only when intent isn't obvious
- Explain the "why", not the "what" (TypeScript already shows the "what")

Example from `src/components/ui/Button.tsx`:
```typescript
// Renders a plain <a> instead of next/link's <Link>. Needed for any link
// that crosses from the marketing apex to the app subdomain (login,
// signup, dashboard): Link treats a relative href as an internal route
// and does a client-side RSC fetch to transition, but the proxy's
// cross-host redirect for those paths then gets blocked by the browser's
// CORS policy...
hardNav?: boolean;
```

**Interface comments:**
- JSDoc `/** */` blocks on interfaces for complex properties
- Example from `src/lib/store.ts`:
```typescript
export interface Toast {
  id: string;
  msg: string;
  tone: ToastTone;
  icon: string;
}
```

**No comments on:**
- Simple assignments or obvious control flow
- Code that reads like prose (well-named functions/variables)

---

## Function Design (size, parameters, return values)

**Size:**
- Keep functions small and focused (aim for < 30 lines for component functions)
- Extract helper functions for reusable logic or readability
- Example: `Spinner` component extracted as separate function in `src/components/ui/Button.tsx`

**Parameters:**
- Use object destructuring for multiple params (especially in React components)
- Example: `export function Button({ variant = "primary", size = "md", loading = false, ... }: ButtonProps)`
- Keep parameter count ≤ 5 (use object for more)

**Return values:**
- Components return JSX or null
- Hooks return single value or object: `{ ticks, live }` from `useLivePrices()`
- API routes return `NextResponse`
- Utility functions return typed values with explicit types

**Composition over configuration:**
- Prefer multiple small functions over one large configurable function
- Example: Button component has `variant` options instead of a massive render function

Example from `src/lib/store.ts`:
```typescript
addPriceAlert: (pa) => {
  const id = "pa" + Date.now();
  set((s) => ({ priceAlerts: [{ id, ...pa }, ...s.priceAlerts] }));
  get().toast(`Alert set on ${pa.pair} @ ${pa.price}`, "gold", "notifications_active");
  return id;
},
```

---

## Module Design (exports pattern, barrel files)

**Export Pattern:**
- Named exports for components and utilities (no default exports)
- Example: `export function Button()` not `export default Button`
- Reason: Consistency and easier refactoring

**Barrel Files:**
- Used selectively in `src/components/ui/index.ts` to group UI exports
- Example: `export { Button } from "./Button"` allows `import { Button } from "@/components/ui"`

Real example from imports across codebase:
```typescript
import { Icon } from "@/components/ui";        // barrel import
import { SearchModal } from "@/components/search/SearchModal"; // direct import
```

**Prisma & Database:**
- Single `prisma` instance exported from `src/lib/prisma.ts`
- Used throughout codebase: `import { prisma } from "@/lib/prisma"`

**Store (Zustand):**
- Export hook: `export const useStore = create<AppStore>(...)`
- Used in components: `const { user, unreadCount } = useStore()`

---

## Tailwind & Theme Tokens (CSS variables)

**Color Usage:**
- **Never hardcode hex values** in component classNames
- Always use CSS variable tokens: `bg-[var(--teal)]`, `text-[var(--coral)]`
- Brand colors: `--teal`, `--teal-bright`, `--coral`, `--coral-bright`, `--gold`, `--navy`, `--navy-deep`
- Direction semantics (tweakable): `--long` (maps to `--teal`), `--short` (maps to `--coral`)
- Surface colors: `--ink`, `--ink-mid`, `--ink-dim`, `--ink-strong`, `--line`, `--hover`, `--panel`, `--sidebar`

**Real example from `src/components/ui/Button.tsx`:**
```typescript
const VARIANTS: Record<Variant, string> = {
  primary:    "text-white bg-[linear-gradient(135deg,var(--teal),#069E9A)] hover:brightness-105",
  ghost:      "border border-[var(--line)] text-[var(--ink-mid)] bg-transparent hover:border-[var(--teal)] hover:bg-[var(--teal)] hover:text-white",
  outline:    "border border-[var(--teal)] text-white bg-[var(--teal)] hover:brightness-105",
  danger:     "border border-[var(--coral)] text-[var(--coral)] bg-transparent hover:bg-[var(--coral)] hover:text-white",
};
```

**Theme switching:**
- Light theme: `:root` and `[data-theme="light"]`
- Dark theme: `[data-theme="dark"]`
- Managed by `next-themes`; CSS variable values change per theme in `src/app/globals.css`

**Utility classes:**
- Use Tailwind utilities: `flex`, `items-center`, `gap-4`, `px-6`, `py-5`
- Use `cn()` helper to merge Tailwind classes dynamically
- Example: `className={cn(BASE, VARIANTS[variant], sizeCls, fullWidth && "w-full", props.className)}`

---

## Data-driven Components

**Pattern:**
- Keep component logic minimal; move data to separate files (data/ or constants)
- Components receive data as props; no hardcoded content in JSX
- Example: `const FALLBACK: PriceTick[]` at module level in `src/components/shell/Topbar.tsx`

---

*Convention analysis: 2026-07-11*
