# Implementation Plan: Platform Upgrades

This plan details the implementation for the three major improvements recommended in the repository review: Bulletproof Data Syncing, Professional Charting, and Discipline Gamification.

## User Review Required

> [!WARNING]
> **Major Refactor:** This plan involves ripping out the data fetching from Zustand and moving it to React Query. It touches multiple core components (`Dashboard`, `Journal`, `StoreHydrator`). 

## Open Questions

> [!IMPORTANT]
> 1. **Chart Annotations:** `lightweight-charts` is fantastic for interactive candles, but it doesn't natively support "background boxes" (used for FVG zones in your SVG chart). I can implement FVGs as colored horizontal price lines (top/bottom bounds) or use an experimental plugin. Are you okay with lines/channels instead of shaded boxes?
> 2. **Scope:** This is a large set of changes. Are you comfortable with me implementing all three components in one go, or would you prefer I start with Data Syncing and do Charting afterwards?

## Proposed Changes

---

### 1. Bulletproof Data Syncing & Modular Architecture

We will migrate data management from Zustand to **React Query**. This ensures robust offline support, automatic retries, and eliminates the "silent failure" data loss risk.

#### [NEW] `src/lib/providers.tsx`
Create a React Query client provider to wrap the application.

#### [MODIFY] `src/app/layout.tsx`
Wrap the application in the new `QueryProvider`.

#### [NEW] `src/lib/hooks/useTrades.ts`
Create custom hooks (`useTrades`, `useAddTrade`, `useUpdateTrade`, `useDeleteTrade`) wrapping React Query's `useQuery` and `useMutation`.
- Implement **optimistic updates** with `onMutate`.
- Implement **rollback on error** in `onError`.
- Trigger a toast notification if the network request fails, warning the user.

#### [MODIFY] `src/lib/store.ts`
Remove `trades`, `feed`, `notifs` and their associated actions. Keep only UI state (`toasts`, `mobileSidebarOpen`, `journaledAlerts`). 
Move `computeStats` to a standalone utility or a derived hook.

#### [MODIFY] Components consuming `useStore().trades`
Update `Dashboard.tsx`, `Journal.tsx`, `LogTradeModal.tsx`, `[id]/page.tsx`, and `Profile.tsx` to use the new `useTrades()` hooks instead of the Zustand store. Remove `StoreHydrator.tsx` reliance on `setTrades`.

---

### 2. Professional Interactive Charting

We will replace the static SVG chart with **TradingView Lightweight Charts** for a premium, interactive experience.

#### [MODIFY] `package.json`
Install `lightweight-charts`.

#### [MODIFY] `src/components/ui/CandleChart.tsx`
- Convert the component from SVG to a container `div` that mounts a `createChart` instance.
- Map your `Candle` data to `CandlestickData`.
- Map `marks` (BOS, CHoCH) to `setMarkers()`.
- Map `lines` (Entry, SL, TP) to `createPriceLine()`.

---

### 3. Gamify Discipline

We will add visual rewards to reinforce disciplined trading.

#### [MODIFY] `package.json`
Install `canvas-confetti` and `@types/canvas-confetti`.

#### [MODIFY] `src/app/(app)/journal/LogTradeModal.tsx`
When a trade is logged successfully and marked as `discipline: true`, calculate the current streak. If the streak reaches a milestone (e.g., 3, 5, 10), trigger a confetti celebration from `canvas-confetti`.

#### [MODIFY] `src/app/(app)/dashboard/Dashboard.tsx` & `StatTile.tsx`
If the user's discipline score is >90% or they are on a hot streak, apply a special "gold" theme/glow to their Discipline stat tile to make it feel like an achievement.

## Verification Plan

### Automated Tests
- Run `npm run type-check` to ensure no TypeScript errors after the Zustand-to-ReactQuery refactor.
- Run `npm run lint`.

### Manual Verification
1. **Offline Test:** Disconnect network, attempt to log a trade, and verify the UI shows an optimistic update *and* a warning toast, gracefully reverting or queuing if it fails.
2. **Chart Interactivity:** Open the Dashboard and Journal to verify the new chart can be panned and zoomed smoothly.
3. **Confetti Check:** Log a winning, disciplined trade to hit a streak and verify the confetti fires.
