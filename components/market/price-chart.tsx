"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  usePriceHistory,
  type PriceInterval,
} from "@/hooks/use-price-history";

interface PriceChartProps {
  tokenId: string | null;
}

const INTERVALS: { label: string; value: PriceInterval }[] = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "MAX", value: "max" },
];

function formatTime(ts: number, interval: PriceInterval): string {
  const d = new Date(ts * 1000);
  if (interval === "1h" || interval === "6h") {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (interval === "1d") {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}) {
  if (!active || !payload || payload.length === 0 || label == null) return null;

  const price = payload[0].value;
  const date = new Date(label * 1000);

  return (
    <div className="border-[3px] border-[#fe5733] bg-[#0a0a0a] p-3 shadow-[4px_4px_0_0_#fe5733]">
      <p className="mb-1 font-mono text-xs text-gray-400">
        {date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <p className="font-mono text-sm font-bold text-white">
        {(price * 100).toFixed(1)}&cent;
      </p>
    </div>
  );
}

export default function PriceChart({ tokenId }: PriceChartProps) {
  const [interval, setInterval] = useState<PriceInterval>("1d");
  const { data, loading, error } = usePriceHistory(tokenId, interval);

  if (!tokenId) {
    return (
      <div className="flex h-full items-center justify-center border-[3px] border-[#333] bg-[#141414] p-4">
        <p className="font-mono text-xs text-gray-600">NO TOKEN DATA</p>
      </div>
    );
  }

  return (
    <div className="border-[3px] border-[#fe5733] bg-[#141414]">
      {/* Header + interval selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-[#fe5733] p-3">
        <h3 className="font-pixel text-sm uppercase text-[#fe5733]">
          Price History
        </h3>
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`cursor-pointer border-[2px] px-2 py-0.5 font-mono text-[10px] font-bold uppercase transition-colors ${
                interval === iv.value
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] text-gray-500 hover:border-[#fe5733] hover:text-[#fe5733]"
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px] p-3 md:h-[350px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin border-[3px] border-[#333] border-t-[#fe5733]" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-gray-600">
              No price data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="t"
                tickFormatter={(v: number) => formatTime(v, interval)}
                tick={{
                  fill: "#888",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
                stroke="#333"
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}`}
                tick={{
                  fill: "#888",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
                stroke="#333"
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="p"
                stroke="#fe5733"
                fill="#fe5733"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
