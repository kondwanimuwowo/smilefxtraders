import { redirect, unstable_rethrow } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { BottomTabBar } from "@/components/shell/BottomTabBar";
import { StoreHydrator } from "@/components/shell/StoreHydrator";
import { NotificationsPoller } from "@/components/shell/NotificationsPoller";
import { PageWidthWrapper } from "@/components/shell/PageWidthWrapper";
import { AppUnavailable } from "@/components/shell/AppUnavailable";
import { ToastHost } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/lib/providers";
import type { AppUser, Trade, AIReviewResult } from "@/lib/store";
import { normaliseReview } from "@/lib/gavo/review-shape";

// Every route under this layout is per-user and auth-gated — never let the
// Cloudflare/OpenNext incremental cache treat any of it as static.
export const dynamic = "force-dynamic";

// ── Data mappers ─────────────────────────────────────────────────────────────

const SESSION_MAP: Record<string, string> = { LONDON: "London", NEW_YORK: "New York", ASIA: "Asia" };

function dbTradeToStore(db: NonNullable<Awaited<ReturnType<typeof prisma.trade.findFirst>>>): Trade {
  return {
    id:          db.id,
    date:        db.date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
    openedAt:    db.date.toISOString(),
    closedAt:    db.closedAt?.toISOString() ?? undefined,
    pair:        db.pair,
    dir:         db.direction.toLowerCase() as "long" | "short",
    model:       db.model,
    framework:   db.framework,
    session:     db.session ? SESSION_MAP[db.session] : undefined,
    entryPrice:  db.entryPrice ?? undefined,
    stopLoss:    db.stopLoss ?? undefined,
    takeProfit:  db.takeProfit ?? undefined,
    closePrice:  db.closePrice ?? undefined,
    rr:          db.rr ?? undefined,
    pnlR:        db.pnlR,
    riskPct:     db.riskPct,
    result:      db.result.toLowerCase() as "win" | "loss" | "open",
    rating:      db.rating,
    discipline:  db.discipline,
    tags:        db.tags,
    mistake:     db.mistake ?? undefined,
    note:        db.note ?? undefined,
    chartUrl:    db.chartUrl ?? undefined,
    fromAlert:   db.fromAlert ?? undefined,
    // Normalised on read, not cast. Reviews written before feedback points
    // carried rule ids are stored as plain strings, and rendering one as if it
    // had a `.rules` array would throw on a trade the member has had for
    // months. normaliseReview accepts both shapes.
    aiReview:    db.aiReview ? normaliseReview(db.aiReview, db.framework === "SnD" ? "SnD" : "SMC") : null,
  };
}

function dbToAppUser(db: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>): AppUser {
  return {
    id:          db.id,
    name:        db.name,
    handle:      db.username,
    email:       db.email,
    loc:         db.location ?? undefined,
    joinedAt:    db.createdAt.toISOString(),
    role:        db.role.toLowerCase() as AppUser["role"],
    plan:        db.plan.toLowerCase() as AppUser["plan"],
    level:       db.level,
    streak:      db.streak,
    riskPct:     db.riskPct,
    instruments: db.instruments,
    experience:  db.experience.toLowerCase() as AppUser["experience"],
    framework:   db.framework,
    avatarSeed:    (db.id.charCodeAt(0) ?? 0) + (db.id.charCodeAt(1) ?? 0),
    avatarUrl:     db.avatarUrl ?? undefined,
    planExpiresAt: db.planExpiresAt?.toISOString() ?? undefined,
    privacyPrefs:  db.privacyPrefs as AppUser["privacyPrefs"] ?? null,
  };
}

// `unavailable` is returned rather than thrown. (app)/error.tsx cannot catch
// a throw from this layout — an error.tsx only covers its segment's children,
// never the layout beside it — so throwing escaped to global-error.tsx and
// replaced the entire document. See AppUnavailable for the rendered state.
type LoadResult =
  | { status: "ok"; user: AppUser; trades: Trade[] }
  | { status: "unavailable" };

async function loadAppData(): Promise<LoadResult> {
  // ── Auth check ─────────────────────────────────────────────────────────────
  // Kept in its own try so that ONLY an auth failure can send the user to
  // /login. Previously one catch wrapped both this and the queries below, so
  // a database stall was treated as a broken session: this redirected to
  // /login, middleware saw a perfectly valid cookie and bounced the user
  // straight back to /dashboard, which failed again — ERR_TOO_MANY_REDIRECTS
  // for every signed-in user for as long as the database was unreachable.
  let user;
  try {
    const supabase = await createClient();
    ({ data: { user } } = await supabase.auth.getUser());
  } catch (err) {
    // getUser() *throwing* is ambiguous — a broken refresh token and a
    // transient failure reaching Supabase Auth look identical here. Don't
    // redirect to /login on it: middleware runs the same verified getUser(),
    // so if that call succeeds there it would bounce the user straight back
    // and loop. Render the error boundary's retry instead. A genuinely
    // absent user (below) is unambiguous, and middleware agrees, so /login
    // is safe in that case only.
    console.error("[app-layout] auth check failed", err);
    return { status: "unavailable" };
  }

  try {
    // middleware.ts's route guard only does a fast, unverified local session
    // decode (see its comment) — a stale/expired cookie can pass that check
    // and still reach this layout. getUser() is the verified check; when it
    // comes back empty, redirect for real instead of silently rendering the
    // dashboard shell with no user.
    if (!user) redirect("/login");

    // No public.users row means this user hasn't completed onboarding yet
    // (that's the only place a profile row gets created) — send them there
    // instead of lazily fabricating a placeholder profile. Deliberately NOT
    // swallowing errors into a bare null here: a thrown error (e.g. a DB/
    // connection timeout) is not the same thing as a genuine "row doesn't
    // exist" null, and treating it as one falsely sends fully-onboarded
    // users back to /onboarding (see 2026-08-09 incident). One retry absorbs
    // a transient Workers↔Supabase blip; anything past that bubbles to the
    // outer catch below instead of being misread as "never onboarded".
    let db = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(async () => {
      return prisma.user.findUnique({ where: { supabaseId: user.id } });
    });
    if (!db) redirect("/onboarding");

    // Lazy-expire cancelled subscriptions: if planExpiresAt has passed, downgrade to FREE
    if (db.planExpiresAt && db.planExpiresAt < new Date() && db.plan !== "FREE") {
      const expired = await prisma.user.update({
        where: { id: db.id },
        data:  { plan: "FREE", planExpiresAt: null },
      }).catch(() => null);
      if (expired) db = expired;
    }

    // Mirror a confirmed email change from auth.users into Prisma. The
    // /auth/callback mirror only covers clicks that land there — if an
    // email scanner consumed the change-email confirmation link (change
    // applied in auth, but the user's own click errored out), this heals
    // the mismatch on their next page load instead of leaving it stale.
    if (user.email && db.email !== user.email) {
      const synced = await prisma.user.update({
        where: { id: db.id },
        data:  { email: user.email },
      }).catch(() => null);
      if (synced) db = synced;
    }

    const dbTrades = await prisma.trade.findMany({
      where: { userId: db.id },
      orderBy: { date: "desc" },
    }).catch(() => []);
    return { status: "ok", user: dbToAppUser(db), trades: dbTrades.map(dbTradeToStore) };
  } catch (err) {
    unstable_rethrow(err);
    // Anything reaching here is a database/connection failure, not an auth
    // one — the session was already verified above. Rethrow so (app)/error.tsx
    // renders its "Try again" UI. Redirecting to /login instead is what
    // created the redirect loop described at the top of this function.
    console.error("[app-layout] data load failed", err);
    return { status: "unavailable" };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const result = await loadAppData();
  if (result.status === "unavailable") return <AppUnavailable />;
  const { user: appUser, trades } = result;

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-app-bg">
        <StoreHydrator user={appUser} trades={trades} />
        <NotificationsPoller />
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <PageWidthWrapper>{children}</PageWidthWrapper>
          </main>
        </div>
        <BottomTabBar />
        <ToastHost />
      </div>
    </Providers>
  );
}
