"use client";

import { useStore } from "@/lib/store";
import { useTrades } from "@/lib/hooks/useTrades";
import { Panel, PanelHead, Avatar, DirPill, Chip, Stars, Ring, Sparkline, Icon } from "@/components/ui";

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

const BADGES = [
  { icon: "military_tech",   label: "First Trade",     desc: "Logged your first trade",             earned: true  },
  { icon: "local_fire_department", label: "5W Streak", desc: "5 winning trades in a row",           earned: true  },
  { icon: "checklist",       label: "Rule Follower",   desc: "100% discipline for a week",          earned: true  },
  { icon: "trending_up",     label: "+10R Club",       desc: "Reached +10R net profit",             earned: false },
  { icon: "psychology",      label: "Model Master",    desc: "Win 10+ trades with one model",       earned: false },
  { icon: "workspace_premium", label: "Funded",        desc: "Pass a prop firm evaluation",         earned: false },
];

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

  const PLAN_LABEL: Record<string, { label: string; color: string }> = {
    free:   { label: "Starter",       color: "var(--ink-dim)"  },
    pro:    { label: "Pro Trader",    color: "var(--teal)"     },
    funded: { label: "Funded Track",  color: "var(--gold)"     },
  };
  const planCfg = PLAN_LABEL[plan];

  // best model
  const bestModel = stats.models[0];

  // equity sparkline
  const equityData = stats.equity.length > 1 ? stats.equity : [0, 0.5, 1.2, 0.8, 2.1, 1.6, 2.8];

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
                { icon: "bar_chart",     label: "Experience",  value: experience.charAt(0).toUpperCase() + experience.slice(1) },
                { icon: "percent",       label: "Risk per trade", value: `${riskPct}%` },
                { icon: "today",         label: "Member since",   value: "Jun 2026" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-1.5">
                  <span className="material-symbols-rounded text-[17px]" style={{ color: "var(--teal)" }}>{icon}</span>
                  <span className="text-[13px] flex-1" style={{ color: "var(--ink-mid)" }}>{label}</span>
                  <span className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Badges */}
          <Panel>
            <PanelHead title="Badges" icon="military_tech" />
            <div className="grid grid-cols-3 gap-3">
              {BADGES.map((b) => (
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Net R"     value={(stats.netR >= 0 ? "+" : "") + stats.netR.toFixed(1) + "R"} color={stats.netR >= 0 ? "var(--teal-bright)" : "var(--coral-bright)"} />
            <StatBox label="Win Rate"  value={`${stats.winRate}%`}     sub={`${stats.wins}W / ${stats.losses}L`} />
            <StatBox label="Discipline" value={`${stats.discFollowed}%`} sub="Rules followed" color={stats.discFollowed >= 80 ? "var(--teal)" : "var(--coral)"} />
            <StatBox label="Trades"    value={String(trades.length)}  sub={`${stats.closed} closed`} />
          </div>

          {/* Equity sparkline */}
          <Panel>
            <PanelHead title="Equity curve" icon="show_chart" sub="Cumulative R — all closed trades" />
            <div style={{ height: 120, marginTop: 4 }}>
              <Sparkline
                data={equityData}
                width={600}
                height={120}
                color={stats.netR >= 0 ? "var(--teal)" : "var(--coral)"}
                fill
              />
            </div>
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

          {/* Best model */}
          {bestModel && (
            <Panel>
              <PanelHead title="Top performing model" icon="star" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-display font-semibold text-[16px] mb-1" style={{ color: "var(--ink-strong)" }}>
                    {bestModel.model}
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--ink-dim)" }}>
                    {bestModel.n} trades · {bestModel.pct}% win rate
                  </div>
                </div>
                <div
                  className="font-display font-bold text-[28px] tabular-nums"
                  style={{ color: "var(--teal-bright)", letterSpacing: "-0.02em" }}
                >
                  {bestModel.pct}%
                </div>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden mt-3" style={{ background: "var(--track)" }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${bestModel.pct}%`, background: "var(--teal)" }}
                />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
