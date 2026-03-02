"use client";

import { useState } from "react";
import { exportCSV, exportJSON, type ExportRow } from "@/lib/export";

interface ExportButtonProps {
  getData: () => ExportRow[];
}

export default function ExportButton({ getData }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  function handleExport(format: "csv" | "json") {
    const rows = getData();
    if (format === "csv") exportCSV(rows);
    else exportJSON(rows);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="border-[2px] border-[#333] bg-transparent px-3 py-1 font-mono text-xs font-bold uppercase text-gray-400 transition-colors hover:border-[#fe5733] hover:text-[#fe5733]"
      >
        EXPORT
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 border-[2px] border-[#fe5733] bg-[#141414] shadow-[4px_4px_0_0_#000]">
          <button
            onClick={() => handleExport("csv")}
            className="block w-full px-4 py-2 text-left font-mono text-xs text-gray-300 hover:bg-[#fe5733]/20 hover:text-[#fe5733]"
          >
            CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            className="block w-full px-4 py-2 text-left font-mono text-xs text-gray-300 hover:bg-[#fe5733]/20 hover:text-[#fe5733]"
          >
            JSON
          </button>
        </div>
      )}
    </div>
  );
}
