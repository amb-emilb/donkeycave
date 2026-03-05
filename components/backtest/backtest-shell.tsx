"use client";

import { useState, useCallback } from "react";
import BrutalistButton from "@/components/ui/brutalist-button";
import BacktestResults from "@/components/backtest/backtest-results";
import type { BacktestResult } from "@/lib/backtest";
import { DEFAULT_CONFIG } from "@/lib/backtest";

const ALL_NICHES = [
  "temperature",
  "finance",
  "xtracker",
  "sports",
  "youtube",
  "crypto_hourly",
];

const NICHE_LABELS: Record<string, string> = {
  temperature: "TEMP",
  finance: "FIN",
  xtracker: "XTRK",
  sports: "SPORT",
  youtube: "YT",
  crypto_hourly: "CRYPTO",
};

const LOOKBACK_OPTIONS = [
  { label: "3D", value: 3 },
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
];

export default function BacktestShell() {
  const [minDiv, setMinDiv] = useState(DEFAULT_CONFIG.minDivergence);
  const [minConf, setMinConf] = useState(DEFAULT_CONFIG.minConfidence);
  const [minVol, setMinVol] = useState(DEFAULT_CONFIG.minVolume);
  const [maxSpread, setMaxSpread] = useState(DEFAULT_CONFIG.maxSpread);
  const [stake, setStake] = useState(DEFAULT_CONFIG.stakeSize);
  const [days, setDays] = useState(DEFAULT_CONFIG.lookbackDays);
  const [niches, setNiches] = useState<string[]>(DEFAULT_CONFIG.niches);

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleNiche = useCallback((niche: string) => {
    setNiches((prev) =>
      prev.includes(niche)
        ? prev.filter((n) => n !== niche)
        : [...prev, niche],
    );
  }, []);

  const runBacktest = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      minDiv: String(minDiv),
      minConf: String(minConf),
      minVol: String(minVol),
      maxSpread: String(maxSpread),
      stake: String(stake),
      days: String(days),
      niches: niches.join(","),
    });

    try {
      const resp = await fetch(`/api/backtest?${params}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [minDiv, minConf, minVol, maxSpread, stake, days, niches]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
        {/* Title */}
        <h1 className="font-pixel text-2xl uppercase text-[#fe5733]">
          Backtester
        </h1>

        {/* Config panel */}
        <div className="border-[3px] border-[#fe5733] bg-[#141414] p-4 md:p-6">
          <h2 className="mb-4 font-pixel text-base uppercase text-[#fe5733]">
            Parameters
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Lookback */}
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase text-gray-500">
                Lookback
              </label>
              <div className="flex gap-1">
                {LOOKBACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDays(opt.value)}
                    className={`cursor-pointer border-[2px] px-3 py-1 font-mono text-xs font-bold uppercase ${
                      days === opt.value
                        ? "border-[#fe5733] bg-[#fe5733] text-black"
                        : "border-[#333] text-gray-500 hover:border-[#fe5733]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min Divergence */}
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase text-gray-500">
                Min Divergence: {(minDiv * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.01"
                value={minDiv}
                onChange={(e) => setMinDiv(parseFloat(e.target.value))}
                className="w-full accent-[#fe5733]"
              />
            </div>

            {/* Min Confidence */}
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase text-gray-500">
                Min Confidence: {(minConf * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.1"
                value={minConf}
                onChange={(e) => setMinConf(parseFloat(e.target.value))}
                className="w-full accent-[#fe5733]"
              />
            </div>

            {/* Min Volume */}
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase text-gray-500">
                Min Volume: ${minVol.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={minVol}
                onChange={(e) => setMinVol(parseFloat(e.target.value))}
                className="w-full accent-[#fe5733]"
              />
            </div>

            {/* Max Spread */}
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase text-gray-500">
                Max Spread: {(maxSpread * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.01"
                value={maxSpread}
                onChange={(e) => setMaxSpread(parseFloat(e.target.value))}
                className="w-full accent-[#fe5733]"
              />
            </div>

            {/* Stake Size */}
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase text-gray-500">
                Stake: ${stake}
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={stake}
                onChange={(e) => setStake(parseFloat(e.target.value))}
                className="w-full accent-[#fe5733]"
              />
            </div>
          </div>

          {/* Niche toggles */}
          <div className="mt-4">
            <label className="mb-2 block font-mono text-[10px] uppercase text-gray-500">
              Niches
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_NICHES.map((niche) => (
                <button
                  key={niche}
                  onClick={() => toggleNiche(niche)}
                  className={`cursor-pointer border-[2px] px-3 py-1 font-mono text-xs font-bold uppercase ${
                    niches.includes(niche)
                      ? "border-[#fe5733] bg-[#fe5733] text-black"
                      : "border-[#333] text-gray-500 hover:border-[#fe5733]"
                  }`}
                >
                  {NICHE_LABELS[niche] ?? niche}
                </button>
              ))}
            </div>
          </div>

          {/* Run button */}
          <div className="mt-6">
            <BrutalistButton
              onClick={runBacktest}
              disabled={loading || niches.length === 0}
              className={loading ? "opacity-50" : ""}
            >
              {loading ? "RUNNING..." : "RUN BACKTEST"}
            </BrutalistButton>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-[3px] border-red-500 bg-red-500/10 p-4">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && <BacktestResults result={result} />}
      </main>
    </div>
  );
}
