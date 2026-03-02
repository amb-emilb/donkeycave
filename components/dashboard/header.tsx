"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
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

export default function Header({ lastUpdate }: HeaderProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(getRelativeTime(lastUpdate));

    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastUpdate));
    }, 30000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="flex items-center justify-between border-b border-[#333] bg-[#0a0a0a] px-4 py-2">
      <span className="font-mono text-xs uppercase tracking-wide text-gray-500">
        Divergence Monitor
      </span>
      <span className="font-mono text-xs uppercase tracking-wide text-gray-500">
        Last updated: {relativeTime}
      </span>
    </div>
  );
}
