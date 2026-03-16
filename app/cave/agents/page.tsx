"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const VPS_URL = "http://81.27.109.191:3100";
const PROXY_SECRET =
  "7b6ce57a8093020a88ea6184fd2fe87c54ebc65f115d02dcd6f9a938e3f15f3b";

interface LogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  msg: string;
}

const LEVEL_COLORS: Record<string, string> = {
  info: "text-green-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

export default function AgentsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const termRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(
      `${VPS_URL}/logs?token=${PROXY_SECRET}`
    );

    es.onopen = () => setConnected(true);
    es.onmessage = (ev) => {
      try {
        const entry: LogEntry = JSON.parse(ev.data);
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > 500 ? next.slice(-500) : next;
        });
      } catch {}
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  function handleScroll() {
    if (!termRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 60);
  }

  return (
    <main className="min-h-screen bg-cave-bg p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 md:gap-6">
        {/* ── GUARDIAN ── */}
        <div className="flex flex-col border-[3px] border-neon bg-cave-surface">
          {/* Header */}
          <div className="flex items-center gap-4 border-b-[3px] border-neon px-4 py-3">
            <Image
              src="/guardian.png"
              alt="Guardian"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
            <div className="flex flex-col">
              <h2
                className="text-3xl uppercase tracking-wider text-neon md:text-4xl"
                style={{ fontFamily: "PistonBlack, monospace" }}
              >
                Guardian
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Signal-based position defender
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 ${
                  connected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="font-mono text-[10px] uppercase text-gray-500">
                {connected ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </div>

          {/* Terminal */}
          <div
            ref={termRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-[#0a0a0a] p-3 font-mono text-[11px] leading-relaxed md:min-h-[520px]"
          >
            {logs.length === 0 && (
              <div className="flex h-full items-center justify-center text-gray-600">
                {connected
                  ? "Waiting for logs..."
                  : "Connecting to VPS..."}
              </div>
            )}
            {logs.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 text-gray-600">
                  {entry.ts.slice(11, 19)}
                </span>
                <span
                  className={`shrink-0 w-5 uppercase ${
                    LEVEL_COLORS[entry.level] ?? "text-gray-400"
                  }`}
                >
                  {entry.level === "info"
                    ? "INF"
                    : entry.level === "warn"
                      ? "WRN"
                      : "ERR"}
                </span>
                <span
                  className={
                    entry.level === "error"
                      ? "text-red-300"
                      : entry.level === "warn"
                        ? "text-yellow-200"
                        : "text-gray-300"
                  }
                >
                  {entry.msg}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-cave-border px-3 py-1.5">
            <span className="font-mono text-[9px] text-gray-600">
              {logs.length} lines
            </span>
            <button
              onClick={() => setLogs([])}
              className="border border-[#333] px-2 py-0.5 font-mono text-[9px] uppercase text-gray-500 hover:border-neon hover:text-neon"
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── HUNTER ── */}
        <div className="relative flex flex-col border-[3px] border-[#333] bg-cave-surface">
          {/* Greyed-out overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0a]/80">
            <Image
              src="/hunter.png"
              alt="Hunter"
              width={160}
              height={160}
              className="mb-4 h-40 w-40 object-contain opacity-40 grayscale"
            />
            <h2
              className="text-4xl uppercase tracking-wider text-gray-600 md:text-5xl"
              style={{ fontFamily: "Berosong, monospace" }}
            >
              Hunter
            </h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-gray-600">
              Coming Soon
            </p>
            <div className="mt-4 border-[2px] border-[#333] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-600">
              Opportunity scanner &middot; Phase 2
            </div>
          </div>

          {/* Background placeholder structure */}
          <div className="flex items-center gap-4 border-b-[3px] border-[#333] px-4 py-3">
            <Image
              src="/hunter.png"
              alt="Hunter"
              width={64}
              height={64}
              className="h-16 w-16 object-contain opacity-10 grayscale"
            />
            <div className="flex flex-col">
              <h2
                className="text-3xl uppercase tracking-wider text-gray-700 md:text-4xl"
                style={{ fontFamily: "Berosong, monospace" }}
              >
                Hunter
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700">
                Market opportunity scanner
              </p>
            </div>
          </div>
          <div className="flex-1 bg-[#0a0a0a] md:min-h-[520px]" />
          <div className="border-t border-cave-border px-3 py-1.5">
            <span className="font-mono text-[9px] text-gray-700">
              Inactive
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
