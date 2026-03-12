"use client";

import { useMemo, useState } from "react";
import type { TradeCandidate } from "@/lib/trading-types";
import { NICHE_COLORS } from "@/lib/types";

interface Props {
  candidates: TradeCandidate[];
}

type SortKey = "trade_score" | "kelly" | "position_size" | "divergence" | "p_estimated";
type StatusFilter = "all" | "scored" | "executed" | "skipped";

function NicheTag({ niche }: { niche: string }) {
  return (
    <span
      className="border px-1.5 py-0.5 font-mono text-[9px] uppercase"
      style={{
        borderColor: NICHE_COLORS[niche] ?? "#666",
        color: NICHE_COLORS[niche] ?? "#666",
      }}
    >
      {niche}
    </span>
  );
}

export default function CandidatesShell({ candidates }: Props) {
  const [nicheFilter, setNicheFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("trade_score");
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const niches = useMemo(() => {
    const s = new Set(candidates.map((c) => c.niche));
    return ["ALL", ...Array.from(s).sort()];
  }, [candidates]);

  const filtered = useMemo(() => {
    let arr = candidates;
    if (nicheFilter !== "ALL") arr = arr.filter((c) => c.niche === nicheFilter);
    if (statusFilter !== "all") arr = arr.filter((c) => c.status === statusFilter);
    return [...arr].sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortAsc ? va - vb : vb - va;
    });
  }, [candidates, nicheFilter, statusFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of candidates) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, [candidates]);

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ▲" : " ▼") : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#222] bg-[#141414] px-4 py-3 md:px-6">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="font-pixel text-lg uppercase text-[#fe5733]">
            Trade Candidates
          </h1>
          <p className="font-mono text-[10px] text-gray-500">
            {candidates.length} candidates from latest scoring cycle
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-4 p-4 md:p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Niche filter */}
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
          {/* Status filter */}
          {(["all", "scored", "executed", "skipped"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`border-[2px] px-2 py-1 font-mono text-[10px] uppercase transition-colors ${
                statusFilter === s
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] text-gray-400 hover:border-[#fe5733]"
              }`}
            >
              {s} {s !== "all" && statusCounts[s] ? `(${statusCounts[s]})` : ""}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-4 font-mono text-[10px] text-gray-500">
          <span>Showing: <span className="text-gray-300">{filtered.length}</span></span>
          <span>Scored: <span className="text-gray-300">{statusCounts["scored"] ?? 0}</span></span>
          <span>Executed: <span className="text-green-400">{statusCounts["executed"] ?? 0}</span></span>
          <span>Skipped: <span className="text-gray-600">{statusCounts["skipped"] ?? 0}</span></span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-[3px] border-[#fe5733] bg-[#141414]">
          <table className="w-full font-mono text-[10px]">
            <thead>
              <tr className="border-b border-[#333] text-left text-[9px] uppercase text-gray-500">
                <th className="px-3 py-2">Niche</th>
                <th className="px-3 py-2">Market</th>
                <th className="px-3 py-2">Side</th>
                <th className="cursor-pointer px-3 py-2 text-right hover:text-[#fe5733]" onClick={() => handleSort("divergence")}>
                  Div{sortArrow("divergence")}
                </th>
                <th className="cursor-pointer px-3 py-2 text-right hover:text-[#fe5733]" onClick={() => handleSort("p_estimated")}>
                  p_est{sortArrow("p_estimated")}
                </th>
                <th className="cursor-pointer px-3 py-2 text-right hover:text-[#fe5733]" onClick={() => handleSort("kelly")}>
                  Kelly{sortArrow("kelly")}
                </th>
                <th className="cursor-pointer px-3 py-2 text-right hover:text-[#fe5733]" onClick={() => handleSort("position_size")}>
                  Size{sortArrow("position_size")}
                </th>
                <th className="cursor-pointer px-3 py-2 text-right hover:text-[#fe5733]" onClick={() => handleSort("trade_score")}>
                  Score{sortArrow("trade_score")}
                </th>
                <th className="px-3 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filtered.map((c) => (
                <>
                  <tr
                    key={c.id}
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className={`cursor-pointer transition-colors hover:bg-[#1a1a1a] ${
                      c.status === "skipped" ? "opacity-40" : ""
                    } ${c.status === "executed" ? "bg-green-900/5" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <NicheTag niche={c.niche} />
                    </td>
                    <td className="max-w-[300px] truncate px-3 py-2 text-gray-300">
                      {c.market_question}
                    </td>
                    <td className={`px-3 py-2 ${c.side === "BUY_YES" ? "text-green-400" : "text-red-400"}`}>
                      {c.side === "BUY_YES" ? "YES" : "NO"}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300">
                      {(c.divergence * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300">
                      {(c.p_estimated * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right text-[#fe5733]">
                      {(c.kelly * 100).toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300">
                      ${c.position_size.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[#fe5733]">
                      {c.trade_score.toFixed(4)}
                    </td>
                    <td className={`px-3 py-2 text-right ${
                      c.status === "executed" ? "text-green-400" :
                      c.status === "skipped" ? "text-gray-600" :
                      c.status === "scored" ? "text-gray-400" : "text-yellow-400"
                    }`}>
                      {c.status}
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr key={`${c.id}-detail`}>
                      <td colSpan={9} className="bg-[#0e0e0e] px-4 py-3">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-[10px] md:grid-cols-4">
                          <div><span className="text-gray-500">mkt_price:</span> <span className="text-gray-300">{c.mkt_price}</span></div>
                          <div><span className="text-gray-500">signal_prob:</span> <span className="text-gray-300">{c.signal_prob}</span></div>
                          <div><span className="text-gray-500">confidence:</span> <span className="text-gray-300">{c.confidence ?? "--"}</span></div>
                          <div><span className="text-gray-500">spread:</span> <span className="text-gray-300">{c.spread ?? "--"}</span></div>
                          <div><span className="text-gray-500">k:</span> <span className="text-gray-300">{c.k}</span></div>
                          <div><span className="text-gray-500">p_estimated:</span> <span className="text-gray-300">{c.p_estimated}</span></div>
                          <div><span className="text-gray-500">kelly:</span> <span className="text-gray-300">{c.kelly}</span></div>
                          <div><span className="text-gray-500">edge_decay:</span> <span className="text-gray-300">{c.edge_decay}</span></div>
                          <div><span className="text-gray-500">kelly_fraction:</span> <span className="text-gray-300">{c.kelly_fraction}</span></div>
                          <div><span className="text-gray-500">trade_score:</span> <span className="text-[#fe5733]">{c.trade_score}</span></div>
                          <div><span className="text-gray-500">position_size:</span> <span className="text-gray-300">${c.position_size}</span></div>
                          {c.skip_reason && (
                            <div><span className="text-gray-500">skip_reason:</span> <span className="text-yellow-400">{c.skip_reason}</span></div>
                          )}
                          {c.condition_id && (
                            <div className="col-span-2">
                              <a
                                href={`https://polymarket.com/event/${c.condition_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#fe5733] hover:underline"
                              >
                                View on Polymarket →
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-8 text-center font-mono text-xs text-gray-500">
              No candidates match filters.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
