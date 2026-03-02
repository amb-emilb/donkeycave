"use client";

import { useState } from "react";

interface ExpandableCellProps {
  text: string;
}

export default function ExpandableCell({ text }: ExpandableCellProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <td className="p-3 text-xs text-gray-500">—</td>;
  }

  return (
    <td
      onClick={() => setExpanded(!expanded)}
      className={`p-3 text-xs text-gray-500 cursor-pointer transition-colors hover:text-gray-300 ${
        expanded
          ? "whitespace-normal break-words max-w-[400px]"
          : "max-w-[200px] truncate"
      }`}
      title={expanded ? "Click to collapse" : text}
    >
      {text}
    </td>
  );
}
