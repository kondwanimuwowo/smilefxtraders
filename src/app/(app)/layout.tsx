import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { StoreHydrator } from "@/components/shell/StoreHydrator";
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
    role:        db.role.toLowerCase() as AppUser["role"],
    plan:        db.plan.toLowerCase() as AppUser["plan"],
    level:       db.level,
    streak:      db.streak,
    riskPct:     db.riskPct,
    instruments: db.instruments,
    experience:  db.experience.toLowerCase() as AppUser["experience"],
    framework:   db.framework,
    avatarSeed:  (db.id.charCodeAt(0) ?? 0) + (db.id.charCodeAt(1) ?? 0),
  };
}

async function loadAppData(): Promise<{ user: AppUser | null; trades: Trade[] }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, trades: [] };

    // 1 — try to find existing Prisma record
    let db = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);

    // 2 — auto-create if missing (handles demo + external Supabase logins)
    if (!db && user.email) {
      const base = user.email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase();
      db = await prisma.user.upsert({
        where:  { supabaseId: user.id },
        update: {},
        create: {
          supabaseId: user.id,
          name:       (user.user_metadata?.full_name as string | undefined) ?? base,
          username:   `${base}_${user.id.slice(0, 6)}`,
          email:      user.email,
        },
      }).catch(() => null);
    }

    if (db) {
      const dbTrades = await prisma.trade.findMany({
        where: { userId: db.id },
        orderBy: { date: "desc" },
      }).catch(() => []);
      return { user: dbToAppUser(db), trades: dbTrades.map(dbTradeToStore) };
    }

    // 3 — Prisma unavailable: slim fallback
    const emailBase = user.email?.split("@")[0] ?? "trader";
    return {
      user: {
        name:        (user.user_metadata?.full_name as string | undefined) ?? emailBase,
        handle:      emailBase,
        email:       user.email ?? "",
        role:        "student",
        plan:        "free",
        level:       1,
        streak:      0,
        riskPct:     0.5,
        instruments: ["EURUSD", "XAUUSD"],
        experience:  "beginner",
        framework:   "SMC",
      },
      trades: [],
    };
  } catch {
    return { user: null, trades: [] };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: appUser, trades } = await loadAppData();

  return (
    <Providers>
      <div className="flex h-full overflow-hidden" style={{ background: "var(--app-bg)" }}>
        <StoreHydrator user={appUser} trades={trades} />
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full px-4 sm:px-6 pt-5 pb-12" style={{ maxWidth: 1320 }}>
              {children}
            </div>
          </main>
        </div>
        <ToastHost />
      </div>
    </Providers>
  );
}
