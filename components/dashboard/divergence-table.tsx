"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BrutalistButton from "@/components/ui/brutalist-button";
import {
  computeTradability,
  GRADE_COLORS,
  GRADE_BG,
} from "@/lib/tradability";
import type { LivePrice } from "@/hooks/use-live-prices";

export interface DivergenceRecord {
  id: string;
  niche: string;
  question: string;
  polyYes: number;
  signalProb: number;
  divergence: number;
  detail: string;
  yesTokenId?: string | null;
  volume24h?: number | null;
  spread?: number | null;
  endDate?: string | null;
  clobYesPrice?: number | null;
  confidence?: number | null;
}

type SortField =
  | "niche"
  | "question"
  | "polyYes"
  | "signalProb"
  | "divergence"
  | "tradability";
type SortDir = "asc" | "desc";

interface DivergenceTableProps {
  data: DivergenceRecord[];
  activeNiche: string;
  livePrices?: Map<string, LivePrice>;
  wsConnected?: boolean;
}

const ROWS_PER_PAGE = 25;

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function divergenceColor(value: number): string {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

export default function DivergenceTable({
  data,
  activeNiche,
  livePrices,
  wsConnected,
}: DivergenceTableProps) {
  const [sortField, setSortField] = useState<SortField>("divergence");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    if (activeNiche === "ALL") return data;
    return data.filter(
      (r) => r.niche.toUpperCase() === activeNiche.toUpperCase(),
    );
  }, [data, activeNiche]);

  // Pre-compute tradability for sorting
  const dataWithTradability = useMemo(
    () =>
      filteredData.map((d) => ({
        ...d,
        tradability: computeTradability({
          volume24h: d.volume24h ?? null,
          spread: d.spread ?? null,
          endDate: d.endDate ?? null,
          confidence: d.confidence ?? null,
          absDivergence: Math.abs(d.divergence),
        }),
      })),
    [filteredData],
  );

  const sortedData = useMemo(() => {
    const sorted = [...dataWithTradability].sort((a, b) => {
      if (sortField === "tradability") {
        return sortDir === "asc"
          ? a.tradability.score - b.tradability.score
          : b.tradability.score - a.tradability.score;
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        if (sortField === "divergence") {
          return sortDir === "asc"
            ? Math.abs(aVal) - Math.abs(bVal)
            : Math.abs(bVal) - Math.abs(aVal);
        }
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
    return sorted;
  }, [dataWithTradability, sortField, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / ROWS_PER_PAGE),
  );
  const pagedData = sortedData.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE,
  );

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  }

  function sortIndicator(field: SortField): string {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="border-[3px] border-[#fe5733] bg-[#141414]">
      {/* WS status indicator */}
      {livePrices && (
        <div className="flex items-center gap-2 border-b border-[#222] px-3 py-1.5">
          <span
            className={`h-2 w-2 ${wsConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="font-mono text-[10px] uppercase text-gray-500">
            {wsConnected ? "LIVE PRICES" : "CONNECTING..."}
          </span>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b-[3px] border-[#fe5733]">
              <th
                onClick={() => handleSort("niche")}
                className="cursor-pointer select-none p-3 text-left font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-[#fe5733]"
              >
                Niche{sortIndicator("niche")}
              </th>
              <th
                onClick={() => handleSort("question")}
                className="cursor-pointer select-none p-3 text-left font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-[#fe5733]"
              >
                Market{sortIndicator("question")}
              </th>
              <th
                onClick={() => handleSort("polyYes")}
                className="cursor-pointer select-none p-3 text-right font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-[#fe5733]"
              >
                Price{sortIndicator("polyYes")}
              </th>
              {livePrices && (
                <th className="p-3 text-right font-bold uppercase tracking-wider text-gray-400">
                  Live
                </th>
              )}
              <th
                onClick={() => handleSort("signalProb")}
                className="cursor-pointer select-none p-3 text-right font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-[#fe5733]"
              >
                Signal{sortIndicator("signalProb")}
              </th>
              <th
                onClick={() => handleSort("divergence")}
                className="cursor-pointer select-none p-3 text-right font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-[#fe5733]"
              >
                Div{sortIndicator("divergence")}
              </th>
              <th
                onClick={() => handleSort("tradability")}
                className="cursor-pointer select-none p-3 text-center font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-[#fe5733]"
              >
                Trade{sortIndicator("tradability")}
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={livePrices ? 8 : 7}
                  className="p-8 text-center text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              pagedData.map((row) => {
                const isHighlighted = Math.abs(row.divergence) >= 0.1;
                const live =
                  row.yesTokenId && livePrices
                    ? livePrices.get(row.yesTokenId)
                    : null;
                const livePrice = live?.mid ?? live?.lastTradePrice ?? null;
                const basePrice = row.clobYesPrice ?? row.polyYes;

                // Show movement arrow: toward signal = green, away = red
                let liveDelta: number | null = null;
                let liveMovement: "toward" | "away" | null = null;
                if (livePrice != null) {
                  liveDelta = livePrice - basePrice;
                  if (Math.abs(liveDelta) > 0.001) {
                    const signalDirection = Math.sign(row.divergence);
                    liveMovement =
                      Math.sign(liveDelta) === signalDirection
                        ? "toward"
                        : "away";
                  }
                }

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#222] transition-colors hover:bg-[#1a1a1a] ${
                      isHighlighted
                        ? "border-l-[4px] border-l-[#fe5733]"
                        : ""
                    }`}
                  >
                    <td className="p-3">
                      <span className="border-[2px] border-[#fe5733]/50 bg-[#fe5733]/10 px-2 py-0.5 text-xs font-bold uppercase text-[#fe5733]">
                        {row.niche}
                      </span>
                    </td>
                    <td
                      className="max-w-[250px] p-3 text-gray-300"
                      title={row.question}
                    >
                      <Link
                        href={`/cave/market/${row.id}`}
                        className="hover:text-[#fe5733] hover:underline"
                      >
                        {truncateText(row.question, 45)}
                      </Link>
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {(row.polyYes * 100).toFixed(1)}%
                    </td>
                    {livePrices && (
                      <td className="p-3 text-right">
                        {livePrice != null ? (
                          <span
                            className={
                              liveMovement === "toward"
                                ? "text-green-400"
                                : liveMovement === "away"
                                  ? "text-red-400"
                                  : "text-gray-400"
                            }
                          >
                            {(livePrice * 100).toFixed(1)}%
                            {liveMovement === "toward" && (
                              <span className="ml-1 text-[10px]">
                                &#9650;
                              </span>
                            )}
                            {liveMovement === "away" && (
                              <span className="ml-1 text-[10px]">
                                &#9660;
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-600">--</span>
                        )}
                      </td>
                    )}
                    <td className="p-3 text-right text-gray-300">
                      {(row.signalProb * 100).toFixed(1)}%
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${divergenceColor(row.divergence)}`}
                    >
                      {row.divergence > 0 ? "+" : ""}
                      {(row.divergence * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block border-[2px] px-2 py-0.5 text-[10px] font-bold ${GRADE_BG[row.tradability.grade]} ${GRADE_COLORS[row.tradability.grade]}`}
                        title={`Score: ${row.tradability.score} | Vol: ${(row.tradability.volume * 100).toFixed(0)}% | Spr: ${(row.tradability.spread * 100).toFixed(0)}% | Time: ${(row.tradability.timing * 100).toFixed(0)}% | Edge: ${(row.tradability.edge * 100).toFixed(0)}%`}
                      >
                        {row.tradability.grade}
                        {row.tradability.score}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="block md:hidden">
        {pagedData.length === 0 ? (
          <p className="p-8 text-center font-mono text-sm text-gray-500">
            No records found
          </p>
        ) : (
          <div className="divide-y divide-[#222]">
            {pagedData.map((row) => {
              const live =
                row.yesTokenId && livePrices
                  ? livePrices.get(row.yesTokenId)
                  : null;
              const livePrice = live?.mid ?? live?.lastTradePrice ?? null;

              return (
                <Link
                  key={row.id}
                  href={`/cave/market/${row.id}`}
                  className="block p-4 transition-colors hover:bg-[#1a1a1a]"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="border-[2px] border-[#fe5733]/50 bg-[#fe5733]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#fe5733]">
                        {row.niche}
                      </span>
                      <span
                        className={`border-[2px] px-1.5 py-0.5 font-mono text-[10px] font-bold ${GRADE_BG[row.tradability.grade]} ${GRADE_COLORS[row.tradability.grade]}`}
                      >
                        {row.tradability.grade}
                        {row.tradability.score}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-sm font-bold ${divergenceColor(row.divergence)}`}
                    >
                      {row.divergence > 0 ? "+" : ""}
                      {(row.divergence * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="mb-2 font-mono text-xs text-gray-300">
                    {truncateText(row.question, 70)}
                  </p>
                  <div className="flex gap-4 font-mono text-[10px] text-gray-500">
                    <span>
                      Poly: {(row.polyYes * 100).toFixed(1)}%
                    </span>
                    {livePrice != null && (
                      <span className="text-blue-400">
                        Live: {(livePrice * 100).toFixed(1)}%
                      </span>
                    )}
                    <span>
                      Signal: {(row.signalProb * 100).toFixed(1)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t-[3px] border-[#333] p-3">
        <span className="font-mono text-xs text-gray-500">
          Showing {page * ROWS_PER_PAGE + 1}-
          {Math.min((page + 1) * ROWS_PER_PAGE, sortedData.length)} of{" "}
          {sortedData.length}
        </span>
        <div className="flex gap-2">
          <BrutalistButton
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={page === 0 ? "opacity-30" : ""}
          >
            PREV
          </BrutalistButton>
          <span className="flex items-center font-mono text-xs text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <BrutalistButton
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={page >= totalPages - 1 ? "opacity-30" : ""}
          >
            NEXT
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
}
