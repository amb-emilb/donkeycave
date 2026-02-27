"use client";

import Image from "next/image";
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
    <header className="flex items-center justify-between border-b-[3px] border-[#fe5733] bg-[#141414] p-4">
      <div className="flex items-center gap-3">
        <Image
          src="/donkeyintro.svg"
          alt="Donkey Cave"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <h1 className="font-pixel text-xl uppercase tracking-wider text-[#fe5733] md:text-2xl">
          DONKEY CAVE
        </h1>
      </div>

      <div className="font-mono text-xs uppercase tracking-wide text-gray-500">
        Last updated: {relativeTime}
      </div>
    </header>
  );
}
