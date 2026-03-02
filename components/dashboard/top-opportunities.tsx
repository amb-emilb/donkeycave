"use client";

import Link from "next/link";

export interface Opportunity {
  id: string;
  question: string;
  niche: string;
  polyYes: number;
  signalProb: number;
  divergence: number;
}

interface TopOpportunitiesProps {
  topOpportunities: Opportunity[];
}

function divergenceColor(value: number): string {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function TopOpportunities({
  topOpportunities,
}: TopOpportunitiesProps) {
  return (
    <div className="border-[3px] border-[#fe5733] bg-[#141414] p-4">
      <h3 className="mb-4 font-pixel text-base uppercase tracking-wide text-[#fe5733]">
        Top Opportunities
      </h3>

      <div className="flex flex-col gap-3">
        {topOpportunities.length === 0 ? (
          <p className="py-4 text-center font-mono text-sm text-gray-500">
            No opportunities found
          </p>
        ) : (
          topOpportunities.map((opp, index) => (
            <div
              key={opp.id}
              className="flex items-start gap-3 border-[2px] border-[#333] bg-[#0a0a0a] p-3 transition-colors hover:border-[#fe5733]"
            >
              {/* Rank number */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-[#fe5733] font-mono text-sm font-bold text-[#fe5733]">
                {index + 1}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="border-[2px] border-[#fe5733]/50 bg-[#fe5733]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#fe5733]">
                    {opp.niche}
                  </span>
                </div>
                <Link
                  href={`/cave/market/${opp.id}`}
                  className="mb-2 block font-mono text-xs text-gray-300 hover:text-[#fe5733] hover:underline"
                  title={opp.question}
                >
                  {truncateText(opp.question, 60)}
                </Link>
                <div className="flex items-center gap-4 font-mono text-[10px] uppercase text-gray-500">
                  <span>
                    Poly: <span className="text-gray-300">{(opp.polyYes * 100).toFixed(1)}%</span>
                  </span>
                  <span>
                    Signal: <span className="text-gray-300">{(opp.signalProb * 100).toFixed(1)}%</span>
                  </span>
                </div>
              </div>

              {/* Divergence */}
              <div
                className={`shrink-0 font-mono text-lg font-bold ${divergenceColor(opp.divergence)}`}
              >
                {opp.divergence > 0 ? "+" : ""}
                {(opp.divergence * 100).toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
