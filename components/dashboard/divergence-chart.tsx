"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface TimeseriesBucket {
  bucket: string;
  niche: string;
  avgDivergence: number;
  count: number;
}

interface DivergenceChartProps {
  timeseriesData: TimeseriesBucket[];
}

const NICHE_COLORS: Record<string, string> = {
  TEMPERATURE: "#fe5733",
  FINANCE: "#ff9f1c",
  XTRACKER: "#e040fb",
  SPORTS: "#00e676",
  YOUTUBE: "#ff1744",
  CRYPTO: "#00e5ff",
  WEATHER: "#76ff03",
};

interface PivotedBucket {
  bucket: string;
  [niche: string]: number | string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="border-[3px] border-[#fe5733] bg-[#0a0a0a] p-3 shadow-[4px_4px_0_0_#fe5733]">
      <p className="mb-2 font-mono text-xs font-bold uppercase text-gray-400">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="h-2 w-2"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-mono text-xs text-gray-300">
            {entry.name}:{" "}
            <span className="font-bold text-white">
              {(entry.value * 100).toFixed(2)}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DivergenceChart({
  timeseriesData,
}: DivergenceChartProps) {
  // Pivot data: group by bucket, each niche becomes a column
  const niches = Array.from(new Set(timeseriesData.map((d) => d.niche)));

  const bucketMap = new Map<string, PivotedBucket>();
  for (const d of timeseriesData) {
    if (!bucketMap.has(d.bucket)) {
      bucketMap.set(d.bucket, { bucket: d.bucket });
    }
    const entry = bucketMap.get(d.bucket)!;
    entry[d.niche] = d.avgDivergence;
  }

  // Preserve insertion order (API returns buckets sorted by time)
  const chartData = Array.from(bucketMap.values());

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center border-[3px] border-[#fe5733] bg-[#141414]">
        <p className="font-mono text-sm text-gray-500">
          No timeseries data available
        </p>
      </div>
    );
  }

  return (
    <div className="border-[3px] border-[#fe5733] bg-[#141414] p-4">
      <h3 className="mb-4 font-pixel text-base uppercase tracking-wide text-[#fe5733]">
        Divergence Over Time
      </h3>
      <div className="h-[250px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="bucket"
            tick={{ fill: "#888", fontSize: 11, fontFamily: "monospace" }}
            stroke="#333"
          />
          <YAxis
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: "#888", fontSize: 11, fontFamily: "monospace" }}
            stroke="#333"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontFamily: "monospace",
              fontSize: 11,
              textTransform: "uppercase",
            }}
          />
          {niches.map((niche) => (
            <Area
              key={niche}
              type="monotone"
              dataKey={niche}
              stroke={NICHE_COLORS[niche.toUpperCase()] ?? "#fe5733"}
              fill={NICHE_COLORS[niche.toUpperCase()] ?? "#fe5733"}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
