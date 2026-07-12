import { redirect, unstable_rethrow } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { BottomTabBar } from "@/components/shell/BottomTabBar";
import { StoreHydrator } from "@/components/shell/StoreHydrator";
import { NotificationsPoller } from "@/components/shell/NotificationsPoller";
import { ToastHost } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/lib/providers";
import type { AppUser, Trade, AIReviewResult } from "@/lib/store";

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
    aiReview:    db.aiReview ? (db.aiReview as unknown as AIReviewResult) : null,
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

async function loadAppData(): Promise<{ user: AppUser | null; trades: Trade[] }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // proxy.ts's route guard only does a fast, unverified local session
    // decode (see its comment) — a stale/expired cookie can pass that check
    // and still reach this layout. getUser() is the verified check; when it
    // comes back empty, redirect for real instead of silently rendering the
    // dashboard shell with no user.
    if (!user) redirect("/login");

    // No public.users row means this user hasn't completed onboarding yet
    // (that's the only place a profile row gets created) — send them there
    // instead of lazily fabricating a placeholder profile.
    let db = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
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
    return { user: dbToAppUser(db), trades: dbTrades.map(dbTradeToStore) };
  } catch (err) {
    unstable_rethrow(err);
    return { user: null, trades: [] };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: appUser, trades } = await loadAppData();

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-app-bg">
        <StoreHydrator user={appUser} trades={trades} />
        <NotificationsPoller />
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full px-4 sm:px-6 pt-5 pb-24 md:pb-12 max-w-[1320px]">
              {children}
            </div>
          </main>
        </div>
        <BottomTabBar />
        <ToastHost />
      </div>
    </Providers>
  );
}
