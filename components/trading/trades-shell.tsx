"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Trade, TradingStats } from "@/lib/trading-types";
import { NICHE_COLORS } from "@/lib/types";

interface Props {
  trades: Trade[];
  stats: TradingStats;
}

type StatusFilter = "all" | "open" | "filled" | "resolved";

function PnlValue({ value }: { value: number }) {
  const color = value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-gray-400";
  const sign = value > 0 ? "+" : "";
  return <span className={`font-mono ${color}`}>{sign}${value.toFixed(4)}</span>;
}

export default function TradesShell({ trades, stats }: Props) {
  const [nicheFilter, setNicheFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const niches = useMemo(() => {
    const s = new Set(trades.map((t) => t.niche));
    return ["ALL", ...Array.from(s).sort()];
  }, [trades]);

  const filtered = useMemo(() => {
    let arr = trades;
    if (nicheFilter !== "ALL") arr = arr.filter((t) => t.niche === nicheFilter);
    if (statusFilter === "open") arr = arr.filter((t) => ["open", "filled", "partial"].includes(t.status));
    else if (statusFilter === "filled") arr = arr.filter((t) => t.status === "filled");
    else if (statusFilter === "resolved") arr = arr.filter((t) => t.resolved_yes !== null);
    return arr;
  }, [trades, nicheFilter, statusFilter]);

  // Cumulative P&L chart data
  const cumulativePnl = useMemo(() => {
    const resolved = trades
      .filter((t) => t.resolved_yes !== null)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let cum = 0;
    return resolved.map((t) => {
      cum += t.resolution_pnl ?? 0;
      return {
        date: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pnl: parseFloat(cum.toFixed(4)),
      };
    });
  }, [trades]);

  // Win/loss streak
  const streakInfo = useMemo(() => {
    const resolved = trades
      .filter((t) => t.resolved_yes !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (resolved.length === 0) return { current: 0, type: "none" as const };

    const firstIsWin = (resolved[0].resolution_pnl ?? 0) > 0;
    let streak = 0;
    for (const t of resolved) {
      const isWin = (t.resolution_pnl ?? 0) > 0;
      if (isWin === firstIsWin) streak++;
      else break;
    }
    return { current: streak, type: firstIsWin ? "win" as const : "loss" as const };
  }, [trades]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#222] bg-[#141414] px-4 py-3 md:px-6">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="font-pixel text-lg uppercase text-[#fe5733]">Trades</h1>
          <p className="font-mono text-[10px] text-gray-500">
            {trades.length} total trades
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="border-[3px] border-[#fe5733] bg-[#141414] p-3 shadow-[4px_4px_0_0_#fe5733]">
            <p className="mb-1 font-mono text-[9px] uppercase text-gray-500">Total P&L</p>
            <p className="font-mono text-lg font-bold">
              <PnlValue value={stats.totalPnl} />
            </p>
          </div>
          <div className="border-[3px] border-[#fe5733] bg-[#141414] p-3 shadow-[4px_4px_0_0_#fe5733]">
            <p className="mb-1 font-mono text-[9px] uppercase text-gray-500">Win Rate</p>
            <p className="font-mono text-lg font-bold text-[#fe5733]">
              {stats.totalTrades > 0 ? `${(stats.winRate * 100).toFixed(1)}%` : "--"}
            </p>
          </div>
          <div className="border-[3px] border-[#fe5733] bg-[#141414] p-3 shadow-[4px_4px_0_0_#fe5733]">
            <p className="mb-1 font-mono text-[9px] uppercase text-gray-500">Total Trades</p>
            <p className="font-mono text-lg font-bold text-[#fe5733]">{stats.totalTrades}</p>
          </div>
          <div className="border-[3px] border-[#fe5733] bg-[#141414] p-3 shadow-[4px_4px_0_0_#fe5733]">
            <p className="mb-1 font-mono text-[9px] uppercase text-gray-500">Open</p>
            <p className="font-mono text-lg font-bold text-[#fe5733]">{stats.openPositions}</p>
          </div>
          <div className="border-[3px] border-[#fe5733] bg-[#141414] p-3 shadow-[4px_4px_0_0_#fe5733]">
            <p className="mb-1 font-mono text-[9px] uppercase text-gray-500">Streak</p>
            <p className={`font-mono text-lg font-bold ${
              streakInfo.type === "win" ? "text-green-400" :
              streakInfo.type === "loss" ? "text-red-400" : "text-gray-500"
            }`}>
              {streakInfo.current > 0 ? `${streakInfo.current}${streakInfo.type === "win" ? "W" : "L"}` : "--"}
            </p>
          </div>
        </div>

        {/* Cumulative P&L chart */}
        {cumulativePnl.length > 1 && (
          <div className="border-[3px] border-[#fe5733] bg-[#141414] p-4">
            <h2 className="mb-3 font-pixel text-xs uppercase text-[#fe5733]">
              Cumulative P&L
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulativePnl}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#141414", border: "2px solid #fe5733", fontSize: 11 }}
                  labelStyle={{ color: "#fe5733" }}
                  formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(4)}`, "P&L"]}
                />
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fe5733" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fe5733" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="#fe5733"
                  fill="url(#pnlGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {niches.map((n) => (
            <button
              key={n}
              onClick={() => setNicheFilter(n)}
              className={`border-[2px] px-2 py-1 font-mono text-[10px] uppercase transition-colors ${
                nicheFilter === n
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] text-gray-400 hover:border-[#fe5733]"
              }`}
            >
              {n}
            </button>
          ))}
          <div className="mx-2 h-4 w-px bg-[#333]" />
          {(["all", "open", "filled", "resolved"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`border-[2px] px-2 py-1 font-mono text-[10px] uppercase transition-colors ${
                statusFilter === s
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] text-gray-400 hover:border-[#fe5733]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-[3px] border-[#fe5733] bg-[#141414]">
          <table className="w-full font-mono text-[10px]">
            <thead>
              <tr className="border-b border-[#333] text-left text-[9px] uppercase text-gray-500">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Niche</th>
                <th className="px-3 py-2">Market</th>
                <th className="px-3 py-2">Side</th>
                <th className="px-3 py-2 text-right">Size</th>
                <th className="px-3 py-2 text-right">Entry</th>
                <th className="px-3 py-2 text-right">Exit</th>
                <th className="px-3 py-2 text-right">P&L</th>
                <th className="px-3 py-2 text-right">1h</th>
                <th className="px-3 py-2 text-right">6h</th>
                <th className="px-3 py-2 text-right">24h</th>
                <th className="px-3 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filtered.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-[#1a1a1a]">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                    {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                    {new Date(t.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="border px-1 py-0.5 text-[9px] uppercase"
                      style={{
                        borderColor: NICHE_COLORS[t.niche] ?? "#666",
                        color: NICHE_COLORS[t.niche] ?? "#666",
                      }}
                    >
                      {t.niche}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-gray-300">
                    {t.market_question}
                  </td>
                  <td className={`px-3 py-2 ${t.side === "BUY_YES" ? "text-green-400" : "text-red-400"}`}>
                    {t.side === "BUY_YES" ? "YES" : "NO"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">
                    ${t.size.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">
                    {t.fill_price ? `${(t.fill_price * 100).toFixed(1)}c` : "--"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">
                    {t.exit_price ? `${(t.exit_price * 100).toFixed(1)}c` : "--"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {t.resolution_pnl !== null ? <PnlValue value={t.resolution_pnl} /> : "--"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {t.markout_1h !== null ? (
                      <span className={t.markout_1h > 0 ? "text-green-400" : t.markout_1h < 0 ? "text-red-400" : "text-gray-500"}>
                        {(t.markout_1h * 100).toFixed(1)}
                      </span>
                    ) : "--"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {t.markout_6h !== null ? (
                      <span className={t.markout_6h > 0 ? "text-green-400" : t.markout_6h < 0 ? "text-red-400" : "text-gray-500"}>
                        {(t.markout_6h * 100).toFixed(1)}
                      </span>
                    ) : "--"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {t.markout_24h !== null ? (
                      <span className={t.markout_24h > 0 ? "text-green-400" : t.markout_24h < 0 ? "text-red-400" : "text-gray-500"}>
                        {(t.markout_24h * 100).toFixed(1)}
                      </span>
                    ) : "--"}
                  </td>
                  <td className={`px-3 py-2 text-right ${
                    t.status === "filled" ? "text-green-400" :
                    t.status === "failed" || t.status === "cancelled" ? "text-red-400" :
                    "text-gray-400"
                  }`}>
                    {t.resolved_yes !== null
                      ? (t.resolved_yes ? "YES" : "NO")
                      : t.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-8 text-center font-mono text-xs text-gray-500">
              {trades.length === 0
                ? "No trades yet. Waiting for execution proxy to unblock live trading."
                : "No trades match filters."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
