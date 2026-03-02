"use client";

import { useEffect, useState } from "react";

export type PriceInterval = "1h" | "6h" | "1d" | "1w" | "1m" | "max";

export interface PricePoint {
  t: number; // Unix timestamp
  p: number; // Price (0-1)
}

interface UsePriceHistoryResult {
  data: PricePoint[];
  loading: boolean;
  error: string | null;
}

export function usePriceHistory(
  tokenId: string | null,
  interval: PriceInterval = "1d"
): UsePriceHistoryResult {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/api/polymarket/prices-history?token_id=${encodeURIComponent(tokenId)}&interval=${interval}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        // API returns {history: [{t, p}, ...]}
        const history: PricePoint[] = (json.history ?? []).map(
          (point: { t: number; p: string | number }) => ({
            t: point.t,
            p: typeof point.p === "string" ? parseFloat(point.p) : point.p,
          })
        );
        setData(history);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tokenId, interval]);

  return { data, loading, error };
}
