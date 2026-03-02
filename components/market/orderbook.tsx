"use client";

import { usePolymarketWs } from "@/hooks/use-polymarket-ws";

interface OrderbookProps {
  tokenId: string | null;
}

const MAX_LEVELS = 12;

export default function Orderbook({ tokenId }: OrderbookProps) {
  const { orderbook, bestBid, bestAsk, connected } = usePolymarketWs(tokenId);

  if (!tokenId) {
    return (
      <div className="flex h-full items-center justify-center border-[3px] border-[#333] bg-[#141414] p-4">
        <p className="font-mono text-xs text-gray-600">NO TOKEN DATA</p>
      </div>
    );
  }

  const spread =
    bestBid != null && bestAsk != null
      ? ((bestAsk - bestBid) * 100).toFixed(1)
      : null;

  const bids = (orderbook?.bids ?? []).slice(0, MAX_LEVELS);
  const asks = (orderbook?.asks ?? []).slice(0, MAX_LEVELS);

  // Calculate max cumulative size for depth bars
  let bidCum = 0;
  const bidCumSizes = bids.map((b) => {
    bidCum += b.size;
    return bidCum;
  });
  let askCum = 0;
  const askCumSizes = asks.map((a) => {
    askCum += a.size;
    return askCum;
  });
  const maxCum = Math.max(bidCum, askCum, 1);

  return (
    <div className="border-[3px] border-[#fe5733] bg-[#141414]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-[3px] border-[#fe5733] p-3">
        <h3 className="font-pixel text-sm uppercase text-[#fe5733]">
          Orderbook
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 ${connected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="font-mono text-[10px] uppercase text-gray-500">
            {connected ? "LIVE" : "CONNECTING..."}
          </span>
        </div>
      </div>

      {!orderbook ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin border-[3px] border-[#333] border-t-[#fe5733]" />
        </div>
      ) : (
        <div className="p-2">
          {/* Column headers */}
          <div className="mb-1 flex justify-between px-2 font-mono text-[10px] uppercase text-gray-600">
            <span>Size</span>
            <span>Price</span>
          </div>

          {/* Asks (reversed — lowest ask at bottom) */}
          <div className="flex flex-col-reverse">
            {asks.map((level, i) => (
              <div
                key={`ask-${level.price}`}
                className="relative flex justify-between px-2 py-0.5 font-mono text-xs"
              >
                <div
                  className="absolute inset-0 bg-red-500/10"
                  style={{
                    width: `${(askCumSizes[i] / maxCum) * 100}%`,
                    right: 0,
                    left: "auto",
                  }}
                />
                <span className="relative text-gray-400">
                  {level.size.toFixed(0)}
                </span>
                <span className="relative text-red-400">
                  {(level.price * 100).toFixed(1)}&cent;
                </span>
              </div>
            ))}
          </div>

          {/* Spread */}
          <div className="my-1 flex items-center justify-center border-y border-[#333] py-1.5">
            <span className="font-mono text-[10px] uppercase text-gray-500">
              Spread:{" "}
              <span className="font-bold text-white">
                {spread ? `${spread}&cent;` : "—"}
              </span>
            </span>
          </div>

          {/* Bids */}
          <div>
            {bids.map((level, i) => (
              <div
                key={`bid-${level.price}`}
                className="relative flex justify-between px-2 py-0.5 font-mono text-xs"
              >
                <div
                  className="absolute inset-0 bg-green-500/10"
                  style={{
                    width: `${(bidCumSizes[i] / maxCum) * 100}%`,
                  }}
                />
                <span className="relative text-green-400">
                  {(level.price * 100).toFixed(1)}&cent;
                </span>
                <span className="relative text-gray-400">
                  {level.size.toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {bids.length === 0 && asks.length === 0 && (
            <p className="py-8 text-center font-mono text-xs text-gray-600">
              Empty orderbook
            </p>
          )}
        </div>
      )}
    </div>
  );
}
