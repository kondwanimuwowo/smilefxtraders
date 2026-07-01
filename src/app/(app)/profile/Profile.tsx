"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Trade } from "@/lib/store";
import { useTrades } from "@/lib/hooks/useTrades";
import type { TradeStats } from "@/lib/hooks/useTrades";
import { Panel, PanelHead, Avatar, DirPill, Chip, Ring, Sparkline, Button } from "@/components/ui";

// ── Stat box ──────────────────────────────────────────────────────────────────

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl px-4 py-3.5" style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}>
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>{label}</span>
      <span className="font-display font-bold text-[22px] tabular-nums" style={{ color: color ?? "var(--ink-strong)", letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {sub && <span className="text-[11.5px]" style={{ color: "var(--ink-dim)" }}>{sub}</span>}
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
      label: "Funded",
      desc: "Upgraded to Funded Track",
      earned: plan === "funded",
    },
  ];
}

// ── Trade history mini ────────────────────────────────────────────────────────

function TradeHistoryRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "var(--line)" }}>
      <span className="text-[13px]" style={{ color: "var(--ink-mid)" }}>{label}</span>
      <span className="font-semibold text-[13px] tabular-nums" style={{ color }}>{value}</span>
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

  const PLAN_LABEL: Record<string, { label: string; color: string }> = {
    free:   { label: "Starter",       color: "var(--ink-dim)"  },
    pro:    { label: "Pro Trader",    color: "var(--teal)"     },
    funded: { label: "Funded Track",  color: "var(--gold)"     },
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
      <h1 className="font-display font-bold mb-5" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
        Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] gap-5">
        {/* ── Left: identity card ── */}
        <div className="flex flex-col gap-4">
          <Panel>
            <div className="flex flex-col items-center text-center py-2">
              <Avatar seed={seed} name={name} size={72} />
              <div className="mt-3 font-display font-bold text-[20px]" style={{ color: "var(--ink-strong)" }}>
                {name}
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>@{handle}</div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[11.5px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: `${planCfg.color}18`, color: planCfg.color }}
                >
                  {planCfg.label}
                </span>
                <Chip tone="neutral">Lv. {level}</Chip>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-[13px] font-semibold" style={{ color: "var(--gold)" }}>
                  <span className="material-symbols-rounded text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  {streak}-day streak
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t flex flex-col gap-2" style={{ borderColor: "var(--line)" }}>
              {[
                { icon: "bar_chart", label: "Experience",    value: experience.charAt(0).toUpperCase() + experience.slice(1) },
                { icon: "percent",   label: "Risk per trade", value: `${riskPct}%` },
                { icon: "today",     label: "Member since",   value: memberSince },
                ...(user?.loc ? [{ icon: "location_on", label: "Location", value: user.loc }] : []),
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-1.5">
                  <span className="material-symbols-rounded text-[17px]" style={{ color: "var(--teal)" }}>{icon}</span>
                  <span className="text-[13px] flex-1" style={{ color: "var(--ink-mid)" }}>{label}</span>
                  <span className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
              <Button type="button" variant="ghost" icon="settings" onClick={() => router.push("/settings")} style={{ width: "100%" }}>
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
                  className="flex flex-col items-center text-center gap-1 rounded-xl py-3 px-1"
                  style={{
                    background: b.earned ? "rgba(8,174,170,0.07)" : "var(--panel-2)",
                    border: `1px solid ${b.earned ? "rgba(8,174,170,0.2)" : "var(--line)"}`,
                    opacity: b.earned ? 1 : 0.45,
                  }}
                  title={b.desc}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 22, color: b.earned ? "var(--gold)" : "var(--ink-dim)", fontVariationSettings: "'FILL' 1" }}
                  >
                    {b.icon}
                  </span>
                  <span className="text-[10.5px] font-semibold leading-tight" style={{ color: b.earned ? "var(--ink-strong)" : "var(--ink-dim)" }}>
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
            <StatBox label="Net R"      value={(stats.netR >= 0 ? "+" : "") + stats.netR.toFixed(1) + "R"} color={stats.netR >= 0 ? "var(--teal-bright)" : "var(--coral-bright)"} />
            <StatBox label="Win Rate"   value={`${stats.winRate}%`}      sub={`${stats.wins}W / ${stats.losses}L`} />
            <StatBox label="Expectancy" value={(stats.expectancy >= 0 ? "+" : "") + stats.expectancy + "R"} sub="Expected R/trade" color={stats.expectancy > 0 ? "var(--teal)" : stats.expectancy < 0 ? "var(--coral)" : "var(--ink-dim)"} />
            <StatBox label="Discipline" value={`${stats.discFollowed}%`} sub="Rules followed" color={stats.discFollowed >= 80 ? "var(--teal)" : "var(--coral)"} />
            <StatBox label="Trades"     value={String(trades.length)}   sub={`${stats.closed} closed`} />
          </div>

          {/* Equity sparkline */}
          <Panel>
            <PanelHead title="Equity curve" icon="show_chart" sub="Cumulative R — all closed trades" />
            {equityData ? (
              <div style={{ height: 120, marginTop: 4 }}>
                <Sparkline
                  data={equityData}
                  width={600}
                  height={120}
                  color={stats.netR >= 0 ? "var(--teal)" : "var(--coral)"}
                  fill
                />
              </div>
            ) : (
              <div className="py-6 text-center text-[13px]" style={{ color: "var(--ink-dim)" }}>
                Log your first closed trade to see your equity curve.
              </div>
            )}
          </Panel>

          {/* Performance breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel>
              <PanelHead title="Performance breakdown" icon="analytics" />
              <TradeHistoryRow label="Avg win"       value={`+${stats.avgWin.toFixed(1)}R`}  color="var(--teal-bright)"  />
              <TradeHistoryRow label="Avg loss"      value={`${stats.avgLoss.toFixed(1)}R`}  color="var(--coral-bright)" />
              <TradeHistoryRow label="Closed trades" value={String(stats.closed)}            color="var(--ink-strong)"   />
              <TradeHistoryRow label="Open trades"   value={String(trades.filter(t => t.result === "open").length)} color="var(--gold)" />
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
                    <div className="font-display font-bold text-[22px]" style={{ color: "var(--ink-strong)" }}>
                      {stats.discFollowed}%
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--ink-dim)" }}>discipline</div>
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
                      <span className="text-[12.5px] font-medium" style={{ color: "var(--ink-strong)" }}>{m.model}</span>
                      <span className="text-[12px] tabular-nums font-semibold" style={{ color: m.pct >= 60 ? "var(--teal)" : m.pct >= 40 ? "var(--gold)" : "var(--coral)" }}>
                        {m.pct}% · {m.n}T
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{ width: `${m.pct}%`, background: m.pct >= 60 ? "var(--teal)" : m.pct >= 40 ? "var(--gold)" : "var(--coral)" }}
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
                {recentTrades.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px]" style={{ color: "var(--ink-strong)" }}>{t.pair}</span>
                        <DirPill dir={t.dir} />
                      </div>
                      <div className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--ink-dim)" }}>{t.model}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="font-display font-bold tabular-nums text-[14px]"
                        style={{ color: t.result === "win" ? "var(--teal-bright)" : t.result === "loss" ? "var(--coral-bright)" : "var(--gold)", letterSpacing: "-0.01em" }}
                      >
                        {t.result === "open" ? "Open" : (t.pnlR >= 0 ? "+" : "") + t.pnlR.toFixed(1) + "R"}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--ink-dim)" }}>{t.date}</div>
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
