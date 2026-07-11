# Testing Patterns
**Analysis Date:** 2026-07-11

## Test Framework

**Status:** Not detected

No Jest, Vitest, Playwright, or other test framework configured. No `.test.ts`, `.spec.ts`, or test config files in the project root (only in `node_modules/` from dependencies).

**Verification Strategy (actual):**
Project relies on three manual verification steps defined in `package.json`:

```json
"scripts": {
  "build": "next build",
  "lint": "eslint",
  "type-check": "tsc --noEmit"
}
```

**Run commands:**
- `npm run lint` — ESLint validation (Next.js + TypeScript rules)
- `npm run type-check` — TypeScript strict mode check (no runtime)
- `npm run build` — Next.js production build (catches unresolved routes, asset issues)

**Developer workflow:**
Per CLAUDE.md project instructions: _"Before saying a task is done: run the project's lint/typecheck/build if one exists, and report actual results — never claim success without verifying."_

This indicates verification is manual and script-based, not automated test-driven.

---

## Test File Organization

**Status:** No test files in `src/`

Search results (2026-07-11):
- `find . -name "*.test.ts" -o -name "*.spec.ts"` → 0 results in `src/`
- All matches are in `node_modules/` (dependency test suites, not project code)

---

## Test Structure

**Not applicable** — no test framework present.

If tests were to be added, the following patterns would align with codebase conventions:

1. **Naming:** `[feature].test.ts` or `[feature].spec.ts` (mirroring source file name)
2. **Location:** Colocate tests with source:
   - `src/components/ui/Button.tsx` → `src/components/ui/Button.test.tsx`
   - `src/lib/store.ts` → `src/lib/store.test.ts`
3. **Pattern:** Likely Jest (Next.js default) or Vitest (lighter alternative)
4. **Assertion:** Would use standard Jest matchers (`expect(...).toBe()`, etc.)

---

## Mocking

**Not applicable** — no test framework present.

If tests were added, mocking patterns would follow:

1. **API Routes:** Mock `NextRequest`, `NextResponse` using Jest/Vitest mocks
2. **Database:** Mock Prisma client (`jest.mock("@/lib/prisma")`)
3. **External APIs:** Mock fetch calls (e.g., Anthropic SDK in `/api/review`)
4. **Hooks:** Mock custom hooks (e.g., `useStore` from Zustand)
5. **Third-party:** Mock `next/navigation` (useRouter), `next-themes` (useTheme)

Example (hypothetical):
```typescript
jest.mock("@/lib/prisma");
jest.mock("@/lib/supabase/server");

describe("POST /api/alerts", () => {
  it("should return 401 for unauthenticated users", async () => {
    // ... mock auth, fetch, assertions
  });
});
```

---

## Fixtures and Factories

**Not applicable** — no test framework present.

If needed, fixtures would be organized as:

1. **Location:** `tests/fixtures/` or `__fixtures__/` (undetected in current codebase)
2. **Pattern:** Factory functions for common test data:
   - `createMockUser()` — mock AppUser
   - `createMockTrade()` — mock Trade object
   - `createMockAlert()` — mock Alert (Prisma model)
3. **Database seeding:** Prisma seed script exists (`prisma/seed.ts`); could be adapted for test fixtures

---

## Coverage

**Status:** Not configured

No Jest coverage config or coverage thresholds detected in `package.json` or `jest.config.ts`.

If coverage were tracked, it would likely target:
- Components (UI logic, conditional rendering)
- API routes (auth checks, error responses, data transformation)
- Store mutations (Zustand actions)
- Utilities (cn(), formatPrice(), etc.)

---

## Test Types

**Not applicable** — no test suite.

If tests were implemented, the codebase suggests these types would be valuable:

1. **Unit Tests:**
   - Utility functions: `cn()`, `percentile()`, `buildTradeMessage()`
   - Store mutations: `addTrade()`, `toggleLike()`, `toast()`

2. **Integration Tests:**
   - API routes: POST/GET `/api/alerts`, `/api/review`
   - Database operations: Prisma queries in alerts, trades, COT sync
   - Auth flow: Supabase auth checks in proxy.ts and API routes

3. **Component Tests (if Vitest + React Testing Library):**
   - Button variants and states (loading, disabled)
   - Modal open/close with Escape key
   - Sidebar drawer mobile responsiveness
   - Form validation (auth pages)

4. **E2E Tests (if Playwright added):**
   - Login → Dashboard → Create Trade → Journal submission flow
   - AI Review request and response display
   - Alert notification fan-out and in-app display
   - Theme toggle (light/dark)
   - Responsive layout on mobile

---

## Common Patterns

**Not applicable** — no test framework present.

**Current Code Patterns for Manual Verification:**

1. **Type Safety:**
   - Strict TypeScript (`strict: true` in tsconfig.json)
   - Type assertions on request bodies: `const body = await req.json() as { ... }`
   - All props and return values typed

2. **Compile-time Validation:**
   - `npm run type-check` catches type errors before build
   - No `any` types used (strict convention)
   - Discriminated unions for state (e.g., `TradeResult = "win" | "loss" | "open"`)

3. **Lint-time Validation:**
   - ESLint enforces Next.js best practices
   - React hooks rules checked
   - Unused variable detection

4. **Runtime Safety:**
   - Error boundary at API route level (try/catch in POST handlers)
   - Null checks before accessing properties: `if (!user) return ...`
   - Fallback values for async data: `catch { /* keep fallback */ }`

5. **Manual Testing (as per CLAUDE.md):**
   - Run `npm run dev` to start dev server
   - Use `/run` skill to launch the app and verify behavior
   - Check logs for `console.error` or `console.info` messages
   - Verify API responses with browser DevTools or curl

---

## Build & Pre-commit Validation

**Current Validation Pipeline:**
1. **Pre-deploy:** Run `npm run type-check && npm run lint && npm run build`
2. **CI/CD (if configured):** Would likely mirror these steps
3. **Developer signal:** Green check on these three commands indicates code is ready for review/merge

**Recommendation for Future:**
If test coverage is desired, integrate test step into build pipeline:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "verify": "npm run type-check && npm run lint && npm run test && npm run build"
}
```

Then update CLAUDE.md to require `npm run verify` before committing.

---

*Testing analysis: 2026-07-11*
