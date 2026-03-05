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
import BrutalistButton from "@/components/ui/brutalist-button";
import type { BacktestResult } from "@/lib/backtest";
import { NICHE_COLORS } from "@/lib/types";

interface BacktestResultsProps {
  result: BacktestResult;
}

const TRADES_PER_PAGE = 20;

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="border-[2px] border-[#333] bg-[#0a0a0a] p-3">
      <p className="mb-1 font-mono text-[10px] uppercase text-gray-500">
        {label}
      </p>
      <p
        className={`font-mono text-lg font-bold ${color ?? "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function EquityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="border-[3px] border-[#fe5733] bg-[#0a0a0a] p-3 shadow-[4px_4px_0_0_#fe5733]">
      <p className="mb-1 font-mono text-xs text-gray-400">{label}</p>
      <p
        className={`font-mono text-sm font-bold ${payload[0].value >= 0 ? "text-green-400" : "text-red-400"}`}
      >
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export default function BacktestResults({ result }: BacktestResultsProps) {
  const [tradePage, setTradePage] = useState(0);

  const pnlColor =
    result.totalPnl > 0
      ? "text-green-400"
      : result.totalPnl < 0
        ? "text-red-400"
        : "text-gray-400";

  const winRateColor =
    result.winRate >= 0.55
      ? "text-green-400"
      : result.winRate >= 0.45
        ? "text-yellow-400"
        : "text-red-400";

  // Equity chart data
  const chartData = useMemo(
    () =>
      result.equityCurve.map((pt) => ({
        time: new Date(pt.timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
        }),
        equity: parseFloat(pt.equity.toFixed(2)),
      })),
    [result.equityCurve],
  );

  // Paginated trades (most recent first)
  const reversedTrades = useMemo(
    () => [...result.trades].reverse(),
    [result.trades],
  );
  const totalTradePages = Math.max(
    1,
    Math.ceil(reversedTrades.length / TRADES_PER_PAGE),
  );
  const pagedTrades = reversedTrades.slice(
    tradePage * TRADES_PER_PAGE,
    (tradePage + 1) * TRADES_PER_PAGE,
  );

  // Niche breakdown sorted by P&L
  const nicheEntries = useMemo(
    () =>
      Object.entries(result.nicheBreakdown).sort(
        (a, b) => b[1].totalPnl - a[1].totalPnl,
      ),
    [result.nicheBreakdown],
  );

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <StatCard
          label="Total P&L"
          value={`${result.totalPnl >= 0 ? "+" : ""}$${result.totalPnl.toFixed(2)}`}
          color={pnlColor}
        />
        <StatCard
          label="Win Rate"
          value={`${(result.winRate * 100).toFixed(1)}%`}
          color={winRateColor}
        />
        <StatCard label="Trades" value={String(result.totalTrades)} />
        <StatCard
          label="Avg Return"
          value={`${result.avgReturn >= 0 ? "+" : ""}$${result.avgReturn.toFixed(2)}`}
          color={result.avgReturn >= 0 ? "text-green-400" : "text-red-400"}
        />
        <StatCard
          label="Max Drawdown"
          value={`-$${result.maxDrawdown.toFixed(2)}`}
          color="text-red-400"
        />
        <StatCard
          label="Profit Factor"
          value={
            result.profitFactor === Infinity
              ? "INF"
              : result.profitFactor.toFixed(2)
          }
          color={result.profitFactor >= 1 ? "text-green-400" : "text-red-400"}
        />
      </div>

      {/* Equity curve */}
      {chartData.length > 1 && (
        <div className="border-[3px] border-[#fe5733] bg-[#141414] p-4">
          <h3 className="mb-4 font-pixel text-base uppercase text-[#fe5733]">
            Equity Curve
          </h3>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#888",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  stroke="#333"
                />
                <YAxis
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  tick={{
                    fill: "#888",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  stroke="#333"
                  width={50}
                />
                <Tooltip content={<EquityTooltip />} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke={result.totalPnl >= 0 ? "#00ff88" : "#ff4444"}
                  fill={result.totalPnl >= 0 ? "#00ff88" : "#ff4444"}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Niche breakdown */}
      {nicheEntries.length > 0 && (
        <div className="border-[3px] border-[#fe5733] bg-[#141414]">
          <h3 className="border-b-[3px] border-[#fe5733] p-4 font-pixel text-base uppercase text-[#fe5733]">
            By Niche
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="p-3 text-left text-xs uppercase text-gray-500">
                    Niche
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Trades
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Win Rate
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Total P&L
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Avg P&L
                  </th>
                </tr>
              </thead>
              <tbody>
                {nicheEntries.map(([niche, stats]) => (
                  <tr
                    key={niche}
                    className="border-b border-[#222] hover:bg-[#1a1a1a]"
                  >
                    <td className="p-3">
                      <span
                        className="border-[2px] px-2 py-0.5 text-xs font-bold uppercase"
                        style={{
                          borderColor:
                            NICHE_COLORS[niche] ?? "#fe5733",
                          color: NICHE_COLORS[niche] ?? "#fe5733",
                          backgroundColor: `${NICHE_COLORS[niche] ?? "#fe5733"}15`,
                        }}
                      >
                        {niche}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {stats.trades}
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${stats.winRate >= 0.5 ? "text-green-400" : "text-red-400"}`}
                    >
                      {(stats.winRate * 100).toFixed(0)}%
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {stats.totalPnl >= 0 ? "+" : ""}$
                      {stats.totalPnl.toFixed(2)}
                    </td>
                    <td
                      className={`p-3 text-right ${stats.avgReturn >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {stats.avgReturn >= 0 ? "+" : ""}$
                      {stats.avgReturn.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trades table */}
      {result.trades.length > 0 && (
        <div className="border-[3px] border-[#fe5733] bg-[#141414]">
          <h3 className="border-b-[3px] border-[#fe5733] p-4 font-pixel text-base uppercase text-[#fe5733]">
            Trades ({result.trades.length})
          </h3>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="p-3 text-left text-xs uppercase text-gray-500">
                    Time
                  </th>
                  <th className="p-3 text-left text-xs uppercase text-gray-500">
                    Niche
                  </th>
                  <th className="p-3 text-left text-xs uppercase text-gray-500">
                    Market
                  </th>
                  <th className="p-3 text-center text-xs uppercase text-gray-500">
                    Side
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Entry
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Exit
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    P&L
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Hold
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedTrades.map((trade, i) => (
                  <tr
                    key={`${trade.timestamp}-${i}`}
                    className="border-b border-[#222] hover:bg-[#1a1a1a]"
                  >
                    <td className="p-3 text-xs text-gray-400">
                      {new Date(trade.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 text-xs uppercase text-gray-400">
                      {trade.niche}
                    </td>
                    <td
                      className="max-w-[250px] truncate p-3 text-gray-300"
                      title={trade.market}
                    >
                      {trade.market.length > 50
                        ? trade.market.slice(0, 50) + "..."
                        : trade.market}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`border-[2px] px-2 py-0.5 text-[10px] font-bold ${
                          trade.side === "YES"
                            ? "border-green-500/50 text-green-400"
                            : "border-red-500/50 text-red-400"
                        }`}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {(trade.entryPrice * 100).toFixed(1)}&cent;
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {(trade.exitPrice * 100).toFixed(1)}&cent;
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-xs text-gray-500">
                      {trade.holdingMinutes < 60
                        ? `${Math.round(trade.holdingMinutes)}m`
                        : `${(trade.holdingMinutes / 60).toFixed(1)}h`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="block divide-y divide-[#222] md:hidden">
            {pagedTrades.map((trade, i) => (
              <div key={`${trade.timestamp}-${i}`} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-gray-500">
                    {trade.niche}
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </span>
                </div>
                <p className="mb-1 font-mono text-xs text-gray-300">
                  {trade.market.length > 60
                    ? trade.market.slice(0, 60) + "..."
                    : trade.market}
                </p>
                <div className="flex gap-3 font-mono text-[10px] text-gray-500">
                  <span>
                    {trade.side} @ {(trade.entryPrice * 100).toFixed(1)}
                    &cent;
                  </span>
                  <span>
                    Exit {(trade.exitPrice * 100).toFixed(1)}&cent;
                  </span>
                  <span>
                    {trade.holdingMinutes < 60
                      ? `${Math.round(trade.holdingMinutes)}m`
                      : `${(trade.holdingMinutes / 60).toFixed(1)}h`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t-[3px] border-[#333] p-3">
            <span className="font-mono text-xs text-gray-500">
              {tradePage * TRADES_PER_PAGE + 1}-
              {Math.min(
                (tradePage + 1) * TRADES_PER_PAGE,
                reversedTrades.length,
              )}{" "}
              of {reversedTrades.length}
            </span>
            <div className="flex gap-2">
              <BrutalistButton
                variant="secondary"
                size="sm"
                onClick={() => setTradePage((p) => Math.max(0, p - 1))}
                disabled={tradePage === 0}
                className={tradePage === 0 ? "opacity-30" : ""}
              >
                PREV
              </BrutalistButton>
              <span className="flex items-center font-mono text-xs text-gray-500">
                {tradePage + 1} / {totalTradePages}
              </span>
              <BrutalistButton
                variant="secondary"
                size="sm"
                onClick={() =>
                  setTradePage((p) => Math.min(totalTradePages - 1, p + 1))
                }
                disabled={tradePage >= totalTradePages - 1}
                className={
                  tradePage >= totalTradePages - 1 ? "opacity-30" : ""
                }
              >
                NEXT
              </BrutalistButton>
            </div>
          </div>
        </div>
      )}

      {result.trades.length === 0 && (
        <div className="border-[3px] border-[#333] bg-[#141414] p-8 text-center">
          <p className="font-mono text-sm text-gray-500">
            No trades matched these filters. Try lowering thresholds or
            increasing the lookback period.
          </p>
        </div>
      )}
    </div>
  );
}
