"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  TradingStats,
  NichePerformance,
  Trade,
  TradeCandidate,
  RiskState,
} from "@/lib/trading-types";
import { NICHE_COLORS } from "@/lib/types";

interface Props {
  stats: TradingStats;
  nichePerformances: NichePerformance[];
  recentTrades: Trade[];
  topCandidates: TradeCandidate[];
  riskState: RiskState | null;
  lastCycle: Date;
}

function getRelativeTime(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-[3px] border-[#fe5733] bg-[#141414] p-3 shadow-[4px_4px_0_0_#fe5733]">
      <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="font-mono text-lg font-bold text-[#fe5733]">{value}</p>
      {sub && <p className="mt-0.5 font-mono text-[9px] text-gray-500">{sub}</p>}
    </div>
  );
}

function PnlValue({ value, prefix = "" }: { value: number; prefix?: string }) {
  const color =
    value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-gray-400";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`font-mono ${color}`}>
      {prefix}
      {sign}${value.toFixed(4)}
    </span>
  );
}

export default function OverviewShell({
  stats,
  nichePerformances,
  recentTrades,
  topCandidates,
  riskState,
  lastCycle,
}: Props) {
  const [relTime, setRelTime] = useState("");
  useEffect(() => {
    setRelTime(getRelativeTime(lastCycle));
    const iv = setInterval(() => setRelTime(getRelativeTime(lastCycle)), 30000);
    return () => clearInterval(iv);
  }, [lastCycle]);

  const bankrollStart = 7;
  const currentValue = bankrollStart + stats.totalPnl;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#222] bg-[#141414] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div>
            <h1 className="font-pixel text-lg uppercase text-[#fe5733]">
              SSAT Dashboard
            </h1>
            <p className="font-mono text-[10px] text-gray-500">
              Signal-Scored Autonomous Trader
            </p>
          </div>
          <div className="flex items-center gap-3">
            {riskState?.halted && (
              <span className="border-[2px] border-red-500 bg-red-500/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-red-400">
                HALTED: {riskState.halt_reason}
              </span>
            )}
            <span className="font-mono text-[10px] text-gray-500">
              Last cycle: {relTime}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <StatCard
            label="Total P&L"
            value={`${stats.totalPnl >= 0 ? "+" : ""}$${stats.totalPnl.toFixed(4)}`}
            sub={`${stats.totalTrades} trades`}
          />
          <StatCard
            label="Win Rate"
            value={stats.totalTrades > 0 ? `${(stats.winRate * 100).toFixed(1)}%` : "--"}
            sub={`${Math.round(stats.winRate * stats.totalTrades)}W / ${stats.totalTrades - Math.round(stats.winRate * stats.totalTrades)}L`}
          />
          <StatCard
            label="Open Positions"
            value={String(stats.openPositions)}
            sub={`$${stats.openExposure.toFixed(2)} exposed`}
          />
          <StatCard
            label="Today"
            value={`${stats.todayPnl >= 0 ? "+" : ""}$${stats.todayPnl.toFixed(4)}`}
            sub={`${stats.todayTrades} trades today`}
          />
          <StatCard
            label="Bankroll"
            value={`$${currentValue.toFixed(2)}`}
            sub={`Started $${bankrollStart}`}
          />
          <StatCard
            label="Loss Budget"
            value={`$${stats.lossRemaining.toFixed(2)}`}
            sub={`MTM: worst-case $${(stats.openExposure + Math.abs(Math.min(0, stats.todayPnl))).toFixed(2)} at risk`}
          />
        </div>

        {/* Two columns: niche performance + system health */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Niche Performance */}
          <div className="lg:col-span-2">
            <div className="border-[3px] border-[#fe5733] bg-[#141414]">
              <div className="border-b border-[#222] px-4 py-2">
                <h2 className="font-pixel text-xs uppercase text-[#fe5733]">
                  Niche Performance
                </h2>
              </div>
              <div className="divide-y divide-[#222]">
                {nichePerformances.length === 0 ? (
                  <div className="p-6 text-center font-mono text-xs text-gray-500">
                    No niche data yet. Scorer runs every 30 min.
                  </div>
                ) : (
                  nichePerformances.map((np) => (
                    <div key={np.niche} className={`flex items-center gap-3 px-4 py-2.5 ${np.disabled ? "opacity-40" : ""}`}>
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{ backgroundColor: NICHE_COLORS[np.niche] ?? "#666" }}
                      />
                      <span className="w-28 shrink-0 font-mono text-xs uppercase text-gray-300">
                        {np.niche}
                        {np.disabled && (
                          <span className="ml-1 text-[8px] text-red-400 border border-red-500/50 px-1">OFF</span>
                        )}
                      </span>
                      <div className="flex flex-1 flex-wrap items-center gap-3 font-mono text-[10px]">
                        <span className="text-gray-500">
                          trades: <span className="text-gray-300">{np.tradeCount}</span>
                        </span>
                        <span className="text-gray-500">
                          P&L: <PnlValue value={np.totalPnl} />
                        </span>
                        <span className="text-gray-500">
                          win: <span className="text-gray-300">{(np.winRate * 100).toFixed(0)}%</span>
                        </span>
                        <span className="text-gray-500">
                          brier:{" "}
                          <span className="text-gray-300">
                            {np.brierScore !== null ? np.brierScore.toFixed(3) : "--"}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          shrink:{" "}
                          <span className="text-gray-300">{(np.shrinkageLambda * 100).toFixed(0)}%</span>
                        </span>
                        <span className="text-gray-500">
                          stale:{" "}
                          <span className={np.stalenessPenalty > 0.2 ? "text-yellow-400" : "text-gray-300"}>
                            -{(np.stalenessPenalty * 100).toFixed(0)}%
                          </span>
                        </span>
                        <span className="text-gray-500">
                          kelly_f:{" "}
                          <span className="text-gray-300">{(np.kellyFraction * 100).toFixed(1)}%</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="lg:col-span-1">
            <div className="border-[3px] border-[#fe5733] bg-[#141414]">
              <div className="border-b border-[#222] px-4 py-2">
                <h2 className="font-pixel text-xs uppercase text-[#fe5733]">
                  System Health
                </h2>
              </div>
              <div className="space-y-2 p-4 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Cycle</span>
                  <span className="text-gray-300">{relTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Risk State</span>
                  <span className={riskState?.halted ? "text-red-400" : "text-green-400"}>
                    {riskState?.halted ? `HALTED (${riskState.halt_reason})` : "OK"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Open Exposure</span>
                  <span className="text-gray-300">
                    ${riskState?.open_exposure?.toFixed(2) ?? "0.00"} / ${riskState?.bankroll?.toFixed(0) ?? "7"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Daily P&L</span>
                  <PnlValue value={riskState?.daily_pnl ?? 0} prefix="$" />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trades Today</span>
                  <span className="text-gray-300">{riskState?.trades_today ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">W/L Today</span>
                  <span className="text-gray-300">
                    {riskState?.wins_today ?? 0}W / {riskState?.losses_today ?? 0}L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loss Budget (MTM)</span>
                  <span className={stats.lossRemaining < 5 ? "text-yellow-400" : "text-green-400"}>
                    ${stats.lossRemaining.toFixed(2)} left
                  </span>
                </div>
                {stats.disabledNiches.length > 0 && (
                  <div className="border-t border-[#222] pt-2">
                    <div className="text-[9px] text-red-400 uppercase mb-1">
                      Disabled Niches (neg markout)
                    </div>
                    {stats.disabledNiches.map((n) => (
                      <div key={n} className="pl-2 text-red-400/70">{n}</div>
                    ))}
                  </div>
                )}
                {riskState?.exposure_by_niche && Object.keys(riskState.exposure_by_niche).length > 0 && (
                  <>
                    <div className="border-t border-[#222] pt-2 text-[9px] text-gray-500 uppercase">
                      Exposure by niche
                    </div>
                    {Object.entries(riskState.exposure_by_niche).map(([n, v]) => (
                      <div key={n} className="flex justify-between pl-2">
                        <span className="text-gray-500">{n}</span>
                        <span className="text-gray-300">${Number(v).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two columns: recent trades + top candidates */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Trades */}
          <div className="border-[3px] border-[#fe5733] bg-[#141414]">
            <div className="flex items-center justify-between border-b border-[#222] px-4 py-2">
              <h2 className="font-pixel text-xs uppercase text-[#fe5733]">
                Recent Trades
              </h2>
              <Link
                href="/cave/trades"
                className="font-mono text-[9px] text-gray-500 hover:text-[#fe5733]"
              >
                VIEW ALL →
              </Link>
            </div>
            {recentTrades.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-gray-500">
                No trades yet. Waiting for execution proxy to unblock live trading.
              </div>
            ) : (
              <div className="divide-y divide-[#222]">
                {recentTrades.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 px-4 py-2 font-mono text-[10px]">
                    <span
                      className="w-1.5 h-1.5 shrink-0"
                      style={{ backgroundColor: NICHE_COLORS[t.niche] ?? "#666" }}
                    />
                    <span className="w-16 shrink-0 text-gray-500">{t.niche}</span>
                    <span className="flex-1 truncate text-gray-300">
                      {t.market_question}
                    </span>
                    <span className={`shrink-0 ${t.side === "BUY_YES" ? "text-green-400" : "text-red-400"}`}>
                      {t.side === "BUY_YES" ? "YES" : "NO"}
                    </span>
                    <span className="w-14 shrink-0 text-right text-gray-400">
                      ${t.size.toFixed(2)}
                    </span>
                    <span className="w-16 shrink-0 text-right">
                      {t.resolution_pnl !== null ? (
                        <PnlValue value={t.resolution_pnl} />
                      ) : (
                        <span className="text-gray-500">{t.status}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Candidates (latest cycle) */}
          <div className="border-[3px] border-[#fe5733] bg-[#141414]">
            <div className="flex items-center justify-between border-b border-[#222] px-4 py-2">
              <h2 className="font-pixel text-xs uppercase text-[#fe5733]">
                Top Candidates (Latest Cycle)
              </h2>
              <Link
                href="/cave/candidates"
                className="font-mono text-[9px] text-gray-500 hover:text-[#fe5733]"
              >
                VIEW ALL →
              </Link>
            </div>
            {topCandidates.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-gray-500">
                No candidates yet. Scorer runs every 30 min.
              </div>
            ) : (
              <div className="divide-y divide-[#222]">
                {topCandidates.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-4 py-2 font-mono text-[10px]">
                    <span
                      className="w-1.5 h-1.5 shrink-0"
                      style={{ backgroundColor: NICHE_COLORS[c.niche] ?? "#666" }}
                    />
                    <span className="w-16 shrink-0 text-gray-500">{c.niche}</span>
                    <span className="flex-1 truncate text-gray-300">
                      {c.market_question}
                    </span>
                    <span className={`shrink-0 ${c.side === "BUY_YES" ? "text-green-400" : "text-red-400"}`}>
                      {c.side === "BUY_YES" ? "YES" : "NO"}
                    </span>
                    <span className="w-12 shrink-0 text-right text-[#fe5733]">
                      {(c.kelly * 100).toFixed(1)}%
                    </span>
                    <span className="w-14 shrink-0 text-right text-gray-400">
                      ${c.position_size.toFixed(2)}
                    </span>
                    <span className={`w-14 shrink-0 text-right ${
                      c.status === "executed" ? "text-green-400" :
                      c.status === "skipped" ? "text-gray-600" : "text-gray-400"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
