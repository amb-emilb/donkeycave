"use client";

import { useState } from "react";
import type { Opportunity } from "@/components/dashboard/top-opportunities";
import type { Recommendation } from "@/lib/ai-recommend";

interface DonkeyInOverlayProps {
  opportunities: Opportunity[];
  onClose: () => void;
}

export default function DonkeyInOverlay({
  opportunities,
  onClose,
}: DonkeyInOverlayProps) {
  const [amount, setAmount] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const amountValid = amount !== "" && parseFloat(amount) > 0;

  async function handleLetsGo() {
    if (!amountValid) return;
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const resp = await fetch("/api/donkey-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          opportunities: opportunities.map((o) => ({
            question: o.question,
            niche: o.niche,
            polyYes: o.polyYes,
            signalProb: o.signalProb,
            divergence: o.divergence,
          })),
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setRecommendation(data.recommendation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0a0a0a]/95">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 cursor-pointer border-[2px] border-[#fe5733] bg-transparent px-3 py-1 font-mono text-lg font-bold text-[#fe5733] transition-colors hover:bg-[#fe5733] hover:text-black"
      >
        X
      </button>

      <div className="flex w-full max-w-md flex-col items-center gap-6 p-6">
        {/* Kirkster image */}
        {!recommendation && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                amountValid && isHovering
                  ? "/kirkster_laser.png"
                  : "/kirkster.png"
              }
              alt="Kirkster"
              width={300}
              height={300}
              className="h-[300px] w-[300px] border-[3px] border-[#fe5733] object-cover shadow-[6px_6px_0_0_#fe5733]"
            />

            {/* Title */}
            <h2 className="text-glow font-pixel text-4xl uppercase text-[#fe5733]">
              DONKEY IN
            </h2>

            {/* Amount input */}
            <div className="flex w-full items-center border-[3px] border-[#fe5733] bg-[#141414]">
              <span className="border-r-[3px] border-[#fe5733] bg-[#fe5733]/10 px-4 py-3 font-mono text-xl font-bold text-[#fe5733]">
                $
              </span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent px-4 py-3 font-mono text-xl text-white outline-none placeholder:text-gray-600"
              />
            </div>

            {/* LETS GO button */}
            <button
              disabled={!amountValid || loading}
              onClick={handleLetsGo}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className={`
                w-full border-[3px] px-8 py-4 font-pixel text-2xl uppercase
                transition-all
                ${
                  amountValid && !loading
                    ? "cursor-pointer border-black bg-[#fe5733] text-black shadow-[6px_6px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                    : "cursor-not-allowed border-[#333] bg-[#333] text-gray-600 shadow-none"
                }
              `}
            >
              {loading ? "ANALYZING..." : "LETS GO"}
            </button>
          </>
        )}

        {/* Loading state */}
        {loading && !recommendation && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin border-[4px] border-[#333] border-t-[#fe5733]" />
            <p className="font-pixel text-lg uppercase text-[#fe5733] animate-pulse">
              Kirkster is thinking...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full border-[3px] border-red-500 bg-red-500/10 p-4">
            <p className="font-mono text-sm text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setRecommendation(null);
              }}
              className="mt-3 cursor-pointer border-[2px] border-red-500 bg-transparent px-4 py-1 font-mono text-sm font-bold uppercase text-red-400 transition-colors hover:bg-red-500 hover:text-black"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recommendation result */}
        {recommendation && (
          <div className="flex w-full flex-col items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kirkster_laser.png"
              alt="Kirkster Laser"
              width={200}
              height={200}
              className="h-[200px] w-[200px] border-[3px] border-[#fe5733] object-cover shadow-[4px_4px_0_0_#fe5733]"
            />

            <h3 className="text-glow font-pixel text-2xl uppercase text-[#fe5733]">
              Kirkster Says
            </h3>

            <div className="w-full border-[3px] border-[#fe5733] bg-[#141414] p-5">
              {/* Action badge */}
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={`border-[2px] px-3 py-1 font-mono text-sm font-bold uppercase ${
                    recommendation.action === "BUY YES"
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-red-500 bg-red-500/10 text-red-400"
                  }`}
                >
                  {recommendation.action}
                </span>
                <span className="border-[2px] border-[#fe5733]/50 bg-[#fe5733]/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#fe5733]">
                  {recommendation.niche}
                </span>
                <span className="font-mono text-xs text-gray-500">
                  Confidence: {recommendation.confidence}/10
                </span>
              </div>

              {/* Market question */}
              <p className="mb-3 font-mono text-sm leading-relaxed text-gray-200">
                {recommendation.market_question}
              </p>

              {/* Reasoning */}
              <p className="mb-4 border-l-[3px] border-[#fe5733]/50 pl-3 font-mono text-xs italic leading-relaxed text-gray-400">
                &ldquo;{recommendation.reasoning}&rdquo;
              </p>

              {/* Divergence + Amount */}
              <div className="flex items-center justify-between border-t-[2px] border-[#333] pt-3">
                <span className="font-mono text-xs uppercase text-gray-500">
                  Divergence:{" "}
                  <span
                    className={`font-bold ${
                      recommendation.divergence > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {recommendation.divergence > 0 ? "+" : ""}
                    {(recommendation.divergence * 100).toFixed(1)}%
                  </span>
                </span>
                <span className="font-mono text-xs uppercase text-gray-500">
                  Bet: <span className="font-bold text-[#fe5733]">${amount}</span>
                </span>
              </div>
            </div>

            {/* Trade button (disabled POC) */}
            <button
              disabled
              className="w-full cursor-not-allowed border-[3px] border-[#333] bg-[#333] px-8 py-4 font-pixel text-xl uppercase text-gray-600 shadow-none"
            >
              EXECUTE TRADE (COMING SOON)
            </button>

            {/* Back button */}
            <button
              onClick={() => {
                setRecommendation(null);
                setAmount("");
              }}
              className="cursor-pointer border-[2px] border-[#fe5733] bg-transparent px-6 py-2 font-mono text-sm font-bold uppercase text-[#fe5733] transition-colors hover:bg-[#fe5733] hover:text-black"
            >
              Go Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
