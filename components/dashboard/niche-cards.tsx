"use client";

export interface NicheCardData {
  niche: string;
  count: number;
  avgDivergence: number;
  topMarket: string;
  topDivergence: number;
}

interface NicheCardsProps {
  nicheData: NicheCardData[];
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function divergenceColor(value: number): string {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

export default function NicheCards({ nicheData }: NicheCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nicheData.map((card) => (
        <div
          key={card.niche}
          className="border-[3px] border-[#fe5733] bg-[#141414] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-pixel text-base uppercase tracking-wide text-[#fe5733]">
              {card.niche}
            </h3>
            <span className="border-[2px] border-[#fe5733] bg-[#fe5733]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#fe5733]">
              {card.count}
            </span>
          </div>

          <div className="mb-2 font-mono text-xs uppercase text-gray-500">
            Avg Divergence
          </div>
          <div
            className={`mb-3 font-mono text-lg font-bold ${divergenceColor(card.avgDivergence)}`}
          >
            {card.avgDivergence > 0 ? "+" : ""}
            {(card.avgDivergence * 100).toFixed(2)}%
          </div>

          <div className="border-t-[2px] border-[#333] pt-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
              Top Market
            </div>
            <div className="mb-1 font-mono text-xs text-gray-300">
              {truncateText(card.topMarket, 50)}
            </div>
            <div
              className={`font-mono text-sm font-bold ${divergenceColor(card.topDivergence)}`}
            >
              {card.topDivergence > 0 ? "+" : ""}
              {(card.topDivergence * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
