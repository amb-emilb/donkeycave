"use client";

import { useEffect, useState } from "react";

interface StatsBarProps {
  totalRecords: number;
  avgDivergence: number;
  biggestOpportunity: {
    question: string;
    divergence: number;
  };
  lastUpdate: Date;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  return `${Math.floor(diffHours / 24)}d ago`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function StatsBar({
  totalRecords,
  avgDivergence,
  biggestOpportunity,
  lastUpdate,
}: StatsBarProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(getRelativeTime(lastUpdate));

    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastUpdate));
    }, 30000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const stats = [
    {
      label: "TOTAL RECORDS",
      value: totalRecords.toLocaleString(),
    },
    {
      label: "AVG |DIVERGENCE|",
      value: `${(avgDivergence * 100).toFixed(1)}%`,
    },
    {
      label: "BIGGEST OPPORTUNITY",
      value: `${truncateText(biggestOpportunity.question, 28)} (${(biggestOpportunity.divergence * 100).toFixed(1)}%)`,
    },
    {
      label: "LAST UPDATE",
      value: relativeTime,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-[3px] border-[#fe5733] bg-[#141414] p-4 shadow-[4px_4px_0_0_#fe5733]"
        >
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">
            {stat.label}
          </p>
          <p className="font-mono text-lg font-bold text-[#fe5733] md:text-xl">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
