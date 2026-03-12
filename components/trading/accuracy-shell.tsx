"use client";

import type { NicheAccuracy, NichePerformance } from "@/lib/trading-types";
import { NICHE_COLORS } from "@/lib/types";

interface Props {
  accuracies: NicheAccuracy[];
  performances: NichePerformance[];
}

function BrierBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-600">--</span>;
  const color =
    score < 0.15 ? "text-green-400 border-green-500/50" :
    score < 0.25 ? "text-yellow-400 border-yellow-500/50" :
    score < 0.35 ? "text-orange-400 border-orange-500/50" :
    "text-red-400 border-red-500/50";
  return (
    <span className={`border px-1.5 py-0.5 font-mono text-[10px] ${color}`}>
      {score.toFixed(4)}
    </span>
  );
}

function GraduationBar({ fraction }: { fraction: number }) {
  const pct = Math.min(fraction * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 bg-[#222]">
        <div
          className="h-full bg-[#fe5733]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[9px] text-gray-400">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function AccuracyShell({ accuracies, performances }: Props) {
  // Merge accuracy and performance data by niche
  const accMap = new Map(accuracies.map((a) => [a.niche, a]));

  // Sort by sample count descending
  const sorted = [...performances].sort((a, b) => b.sampleCount - a.sampleCount);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#222] bg-[#141414] px-4 py-3 md:px-6">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="font-pixel text-lg uppercase text-[#fe5733]">Accuracy</h1>
          <p className="font-mono text-[10px] text-gray-500">
            Niche accuracy, calibration, and Kelly graduation status
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
        {/* Niche Accuracy Table */}
        <div className="border-[3px] border-[#fe5733] bg-[#141414]">
          <div className="border-b border-[#222] px-4 py-2">
            <h2 className="font-pixel text-xs uppercase text-[#fe5733]">
              Niche Accuracy Table
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[10px]">
              <thead>
                <tr className="border-b border-[#333] text-left text-[9px] uppercase text-gray-500">
                  <th className="px-4 py-2">Niche</th>
                  <th className="px-4 py-2 text-right">Brier Score</th>
                  <th className="px-4 py-2 text-right">Sample Count</th>
                  <th className="px-4 py-2 text-right">Avg Confidence</th>
                  <th className="px-4 py-2 text-right">Trades</th>
                  <th className="px-4 py-2 text-right">Win Rate</th>
                  <th className="px-4 py-2 text-right">P&L</th>
                  <th className="px-4 py-2 text-right">Avg Markout 1h</th>
                  <th className="px-4 py-2">Kelly Graduation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {sorted.map((np) => {
                  const acc = accMap.get(np.niche);
                  return (
                    <tr key={np.niche} className="transition-colors hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0"
                            style={{ backgroundColor: NICHE_COLORS[np.niche] ?? "#666" }}
                          />
                          <span className="uppercase text-gray-300">{np.niche}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <BrierBadge score={np.brierScore} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-300">
                        {np.sampleCount}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-300">
                        {acc?.avg_confidence ? (acc.avg_confidence * 100).toFixed(1) + "%" : "--"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-300">
                        {np.tradeCount}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-300">
                        {np.tradeCount > 0 ? `${(np.winRate * 100).toFixed(1)}%` : "--"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {np.tradeCount > 0 ? (
                          <span className={np.totalPnl > 0 ? "text-green-400" : np.totalPnl < 0 ? "text-red-400" : "text-gray-400"}>
                            {np.totalPnl >= 0 ? "+" : ""}${np.totalPnl.toFixed(4)}
                          </span>
                        ) : "--"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {np.avgMarkout1h !== null ? (
                          <span className={np.avgMarkout1h > 0 ? "text-green-400" : np.avgMarkout1h < 0 ? "text-red-400" : "text-gray-400"}>
                            {(np.avgMarkout1h * 100).toFixed(2)}%
                          </span>
                        ) : "--"}
                      </td>
                      <td className="px-4 py-2.5">
                        <GraduationBar fraction={np.kellyFraction / 0.25} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {sorted.length === 0 && (
              <div className="p-8 text-center font-mono text-xs text-gray-500">
                No accuracy data yet. The resolver computes Brier scores nightly at 04:00 UTC.
              </div>
            )}
          </div>
        </div>

        {/* Kelly Graduation Explainer */}
        <div className="border-[3px] border-[#333] bg-[#141414] p-4">
          <h3 className="mb-2 font-pixel text-xs uppercase text-[#fe5733]">
            Kelly Graduation Formula
          </h3>
          <div className="font-mono text-[10px] text-gray-400 space-y-1">
            <p>
              <span className="text-gray-300">kelly_fraction</span> = 0.25 * (n_resolved / (n_resolved + 50))
            </p>
            <p>Each niche earns trust independently based on resolved sample count.</p>
            <p>
              At 50 samples → 12.5% of full Kelly | At 200 samples → 20% | At 500 samples → 22.7% | Max → 25%
            </p>
          </div>
        </div>

        {/* Calibration Guide */}
        <div className="border-[3px] border-[#333] bg-[#141414] p-4">
          <h3 className="mb-2 font-pixel text-xs uppercase text-[#fe5733]">
            Brier Score Reference
          </h3>
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px] md:grid-cols-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-400" />
              <span className="text-gray-400">&lt; 0.15: Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-yellow-400" />
              <span className="text-gray-400">0.15 - 0.25: Good</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-orange-400" />
              <span className="text-gray-400">0.25 - 0.35: Fair</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-red-400" />
              <span className="text-gray-400">&gt; 0.35: Poor (disable?)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
