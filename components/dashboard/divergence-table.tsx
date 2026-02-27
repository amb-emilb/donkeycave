"use client";

import { useMemo, useState } from "react";
import BrutalistButton from "@/components/ui/brutalist-button";

export interface DivergenceRecord {
  id: string;
  niche: string;
  question: string;
  polyYes: number;
  signalProb: number;
  divergence: number;
  detail: string;
}

type SortField = "niche" | "question" | "polyYes" | "signalProb" | "divergence";
type SortDir = "asc" | "desc";

interface DivergenceTableProps {
  data: DivergenceRecord[];
  activeNiche: string;
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
}: DivergenceTableProps) {
  const [sortField, setSortField] = useState<SortField>("divergence");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    if (activeNiche === "ALL") return data;
    return data.filter(
      (r) => r.niche.toUpperCase() === activeNiche.toUpperCase()
    );
  }, [data, activeNiche]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        // Sort by absolute value for divergence
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
  }, [filteredData, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / ROWS_PER_PAGE));
  const pagedData = sortedData.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
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

  const columns: { label: string; field: SortField; align?: string }[] = [
    { label: "Niche", field: "niche" },
    { label: "Market Question", field: "question" },
    { label: "Poly YES", field: "polyYes", align: "text-right" },
    { label: "Signal Prob", field: "signalProb", align: "text-right" },
    { label: "Divergence", field: "divergence", align: "text-right" },
  ];

  return (
    <div className="border-[3px] border-[#fe5733] bg-[#141414]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b-[3px] border-[#fe5733]">
              {columns.map((col) => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`cursor-pointer select-none p-3 text-left font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-[#fe5733] ${col.align ?? ""}`}
                >
                  {col.label}
                  {sortIndicator(col.field)}
                </th>
              ))}
              <th className="p-3 text-left font-bold uppercase tracking-wider text-gray-400">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              pagedData.map((row) => {
                const isHighlighted = Math.abs(row.divergence) >= 0.1;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#222] transition-colors hover:bg-[#1a1a1a] ${
                      isHighlighted ? "border-l-[4px] border-l-[#fe5733]" : ""
                    }`}
                  >
                    <td className="p-3">
                      <span className="border-[2px] border-[#fe5733]/50 bg-[#fe5733]/10 px-2 py-0.5 text-xs font-bold uppercase text-[#fe5733]">
                        {row.niche}
                      </span>
                    </td>
                    <td className="max-w-[300px] p-3 text-gray-300" title={row.question}>
                      {truncateText(row.question, 55)}
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {(row.polyYes * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {(row.signalProb * 100).toFixed(1)}%
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${divergenceColor(row.divergence)}`}
                    >
                      {row.divergence > 0 ? "+" : ""}
                      {(row.divergence * 100).toFixed(2)}%
                    </td>
                    <td className="max-w-[200px] p-3 text-xs text-gray-500">
                      {truncateText(row.detail, 40)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
