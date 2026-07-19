"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Trade } from "@/lib/store";
import { useTrades } from "@/lib/hooks/useTrades";
import type { TradeStats } from "@/lib/hooks/useTrades";
import { Panel, PanelHead, Avatar, DirPill, Chip, Ring, Sparkline, Button, Icon } from "@/components/ui";

// ── Stat box ──────────────────────────────────────────────────────────────────

function StatBox({ label, value, sub, colorCls }: { label: string; value: string; sub?: string; colorCls?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl px-4 py-3.5 bg-panel-2 shadow-sm">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim">{label}</span>
      <span className={`font-display font-bold text-[22px] tabular-nums tracking-[-0.02em] ${colorCls ?? "text-ink-strong"}`}>
        {value}
      </span>
      {sub && <span className="text-[11.5px] text-ink-dim">{sub}</span>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function computeBadges(trades: Trade[], stats: TradeStats, plan: string) {
  return [
    {
      icon: "military_tech",
      label: "First Trade",
      desc: "Logged your first trade",
      earned: trades.length >= 1,
    },
    {
      icon: "local_fire_department",
      label: "5 Wins",
      desc: "5 winning trades logged",
      earned: stats.wins >= 5,
    },
    {
      icon: "checklist",
      label: "Rule Follower",
      desc: "≥80% discipline score",
      earned: trades.length >= 5 && stats.discFollowed >= 80,
    },
    {
      icon: "trending_up",
      label: "+10R Club",
      desc: "Reached +10R net profit",
      earned: stats.netR >= 10,
    },
    {
      icon: "psychology",
      label: "Model Master",
      desc: "Win 10+ trades with one model",
      earned: stats.models.some((m) => m.n >= 10),
    },
    {
      icon: "workspace_premium",
      label: "Pro",
      desc: "Upgraded to Pro",
      earned: plan === "pro",
    },
  ];
}

// ── Trade history mini ────────────────────────────────────────────────────────

function TradeHistoryRow({ label, value, colorCls, i }: { label: string; value: string; colorCls: string; i: number }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-2 rounded-lg ${i < 3 ? "border-b border-line" : ""}`}>
      <span className="text-[13px] text-ink-mid">{label}</span>
      <span className={`font-semibold text-[13px] tabular-nums ${colorCls}`}>{value}</span>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

export function Profile() {
  const router     = useRouter();
  const { user } = useStore();
  const { stats, trades } = useTrades();

  const name       = user?.name       ?? "Trader";
  const handle     = user?.handle     ?? "trader";
  const plan       = user?.plan       ?? "free";
  const level      = user?.level      ?? 1;
  const streak     = user?.streak     ?? 0;
  const experience = user?.experience ?? "intermediate";
  const riskPct    = user?.riskPct    ?? 0.5;
  const seed       = user?.avatarSeed ?? 0;

  const memberSince = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  // No background class: the original computed `${color}18` against a var()
  // reference, which is invalid CSS — the background never rendered, so the
  // badge has always been text-only on transparent.
  const PLAN_LABEL: Record<string, { label: string; cls: string }> = {
    free: { label: "Starter", cls: "text-ink-dim" },
    edge: { label: "Edge",    cls: "text-teal"    },
    pro:  { label: "Pro",     cls: "text-gold"    },
  };
  const planCfg = PLAN_LABEL[plan];

  // badges driven from trade data
  const badges = computeBadges(trades, stats, plan);

  // equity sparkline — null when no closed trades yet
  const equityData = stats.equity.length > 1 ? stats.equity : null;

  // last 5 trades for recent history
  const recentTrades = trades.slice(0, 5);

  return (
    <div className="view">
      <h1 className="font-display font-medium mb-5 text-2xl tracking-[-0.02em] text-ink-strong">
        Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] gap-5">
        {/* ── Left: identity card ── */}
        <div className="flex flex-col gap-4">
          <Panel>
            <div className="flex flex-col items-center text-center py-2">
              <Avatar src={user?.avatarUrl} seed={seed} name={name} size={72} />
              <div className="mt-3 font-display font-bold text-[20px] text-ink-strong">
                {name}
              </div>
              <div className="text-[13px] mt-0.5 text-ink-dim">@{handle}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11.5px] font-semibold px-3 py-1 rounded-full ${planCfg.cls}`}>
                  {planCfg.label}
                </span>
                <Chip tone="neutral">Lv. {level}</Chip>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-[13px] font-semibold text-gold">
                  <Icon name="local_fire_department" size={17} />
                  {streak}-day streak
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 flex flex-col gap-2">
              {[
                { icon: "bar_chart", label: "Experience",    value: experience.charAt(0).toUpperCase() + experience.slice(1) },
                { icon: "percent",   label: "Risk per trade", value: `${riskPct}%` },
                { icon: "today",     label: "Member since",   value: memberSince },
                ...(user?.loc ? [{ icon: "location_on", label: "Location", value: user.loc }] : []),
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-1.5">
                  <Icon name={icon} size={17} className="text-teal" />
                  <span className="text-[13px] flex-1 text-ink-mid">{label}</span>
                  <span className="text-[13px] font-semibold text-ink-strong">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4">
              <Button type="button" variant="ghost" icon="settings" onClick={() => router.push("/settings")} fullWidth>
                Edit profile
              </Button>
            </div>
          </Panel>

          {/* Badges */}
          <Panel>
            <PanelHead title="Badges" icon="military_tech" sub={`${badges.filter((b) => b.earned).length} / ${badges.length} earned`} />
            <div className="grid grid-cols-3 gap-3">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`flex flex-col items-center text-center gap-1 rounded-xl py-3 px-1 ${
                    b.earned
                      ? "bg-[rgba(8,174,170,0.07)] shadow-[0_0_0_2px_var(--teal)]"
                      : "bg-panel-2 shadow-sm opacity-45"
                  }`}
                  title={b.desc}
                >
                  <Icon name={b.icon} size={22} className={b.earned ? "text-gold" : "text-ink-dim"} />
                  <span className={`text-[10.5px] font-semibold leading-tight ${b.earned ? "text-ink-strong" : "text-ink-dim"}`}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Right: stats + history ── */}
        <div className="flex flex-col gap-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Net R"      value={(stats.netR >= 0 ? "+" : "") + stats.netR.toFixed(1) + "R"} colorCls={stats.netR >= 0 ? "text-teal-bright" : "text-coral-bright"} />
            <StatBox label="Win Rate"   value={`${stats.winRate}%`}      sub={`${stats.wins}W / ${stats.losses}L`} />
            <StatBox label="Expectancy" value={(stats.expectancy >= 0 ? "+" : "") + stats.expectancy + "R"} sub="Expected R/trade" colorCls={stats.expectancy > 0 ? "text-teal" : stats.expectancy < 0 ? "text-coral" : "text-ink-dim"} />
            <StatBox label="Discipline" value={`${stats.discFollowed}%`} sub="Rules followed" colorCls={stats.discFollowed >= 80 ? "text-teal" : "text-coral"} />
            <StatBox label="Trades"     value={String(trades.length)}   sub={`${stats.closed} closed`} />
          </div>

          {/* Equity sparkline */}
          <Panel>
            <PanelHead title="Equity curve" icon="show_chart" sub="Cumulative R across all closed trades" />
            {equityData ? (
              <div className="h-[120px] mt-1">
                <Sparkline
                  data={equityData}
                  width={600}
                  height={120}
                  color={stats.netR >= 0 ? "var(--teal)" : "var(--coral)"}
                  fill
                />
              </div>
            ) : (
              <div className="py-6 text-center text-[13px] text-ink-dim">
                Log your first closed trade to see your equity curve.
              </div>
            )}
          </Panel>

          {/* Performance breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel>
              <PanelHead title="Performance breakdown" icon="analytics" />
              <TradeHistoryRow i={0} label="Avg win"       value={`+${stats.avgWin.toFixed(1)}R`}  colorCls="text-teal-bright"  />
              <TradeHistoryRow i={1} label="Avg loss"      value={`${stats.avgLoss.toFixed(1)}R`}  colorCls="text-coral-bright" />
              <TradeHistoryRow i={2} label="Closed trades" value={String(stats.closed)}            colorCls="text-ink-strong"   />
              <TradeHistoryRow i={3} label="Open trades"   value={String(trades.filter(t => t.result === "open").length)} colorCls="text-gold" />
            </Panel>

            <Panel>
              <PanelHead title="Discipline ring" icon="checklist" />
              <div className="flex items-center justify-center py-2">
                <Ring
                  value={stats.discFollowed}
                  max={100}
                  size={110}
                  stroke={10}
                  color={stats.discFollowed >= 80 ? "var(--teal)" : stats.discFollowed >= 60 ? "var(--gold)" : "var(--coral)"}
                >
                  <div className="text-center">
                    <div className="font-display font-bold text-[22px] text-ink-strong">
                      {stats.discFollowed}%
                    </div>
                    <div className="text-[10px] text-ink-dim">discipline</div>
                  </div>
                </Ring>
              </div>
            </Panel>
          </div>

          {/* Model breakdown */}
          {stats.models.length > 0 && (
            <Panel>
              <PanelHead title="Model breakdown" icon="star" sub="Win rate per SMC model" />
              <div className="flex flex-col gap-3 mt-1">
                {stats.models.map((m) => (
                  <div key={m.model}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12.5px] font-medium text-ink-strong">{m.model}</span>
                      <span className={`text-[12px] tabular-nums font-semibold ${m.pct >= 60 ? "text-teal" : m.pct >= 40 ? "text-gold" : "text-coral"}`}>
                        {m.pct}% · {m.n}T
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full overflow-hidden bg-track">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${m.pct >= 60 ? "bg-teal" : m.pct >= 40 ? "bg-gold" : "bg-coral"}`}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Recent trades */}
          {recentTrades.length > 0 && (
            <Panel>
              <PanelHead title="Recent trades" icon="history" />
              <div className="flex flex-col">
                {recentTrades.map((t, i) => (
                  <div key={t.id} className={`flex items-center gap-3 py-2.5 px-2 rounded-lg ${i < recentTrades.length - 1 ? "border-b border-line" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-ink-strong">{t.pair}</span>
                        <DirPill dir={t.dir} />
                      </div>
                      <div className="text-[11.5px] mt-0.5 truncate text-ink-dim">{t.model}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`font-display font-bold tabular-nums text-[14px] tracking-[-0.01em] ${
                          t.result === "win" ? "text-teal-bright" : t.result === "loss" ? "text-coral-bright" : "text-gold"
                        }`}
                      >
                        {t.result === "open" ? "Open" : (t.pnlR >= 0 ? "+" : "") + t.pnlR.toFixed(1) + "R"}
                      </div>
                      <div className="text-[11px] text-ink-dim">{t.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
