"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
const RECONNECT_BASE = 3000;
const MAX_RECONNECT = 30000;

export interface LivePrice {
  bestBid: number | null;
  bestAsk: number | null;
  mid: number | null;
  lastTradePrice: number | null;
}

export function useLivePrices(tokenIds: string[]): {
  prices: Map<string, LivePrice>;
  connected: boolean;
} {
  const [prices, setPrices] = useState<Map<string, LivePrice>>(new Map());
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenIdsRef = useRef<string[]>([]);

  // Stable key for dependency tracking — avoids re-subscribing on every render
  const tokenKey = [...tokenIds].sort().join(",");

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data === "ping") {
      wsRef.current?.send("pong");
      return;
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(event.data as string);
    } catch {
      return;
    }

    const eventType = data.event_type as string;
    const assetId = data.asset_id as string | undefined;

    if (eventType === "best_bid_ask" && assetId) {
      const bid =
        data.best_bid != null ? parseFloat(data.best_bid as string) : null;
      const ask =
        data.best_ask != null ? parseFloat(data.best_ask as string) : null;

      setPrices((prev) => {
        const next = new Map(prev);
        const existing = next.get(assetId) ?? {
          bestBid: null,
          bestAsk: null,
          mid: null,
          lastTradePrice: null,
        };
        const newBid = bid ?? existing.bestBid;
        const newAsk = ask ?? existing.bestAsk;
        const mid =
          newBid != null && newAsk != null ? (newBid + newAsk) / 2 : null;
        next.set(assetId, { ...existing, bestBid: newBid, bestAsk: newAsk, mid });
        return next;
      });
    } else if (eventType === "last_trade_price" && assetId) {
      const price = parseFloat(data.price as string);

      setPrices((prev) => {
        const next = new Map(prev);
        const existing = next.get(assetId) ?? {
          bestBid: null,
          bestAsk: null,
          mid: null,
          lastTradePrice: null,
        };
        next.set(assetId, { ...existing, lastTradePrice: price });
        return next;
      });
    } else if (eventType === "price_change") {
      const changes = data.price_changes as
        | Array<{
            asset_id: string;
            best_bid?: string;
            best_ask?: string;
          }>
        | undefined;
      if (!changes) return;

      setPrices((prev) => {
        const next = new Map(prev);
        for (const change of changes) {
          if (!tokenIdsRef.current.includes(change.asset_id)) continue;
          const existing = next.get(change.asset_id) ?? {
            bestBid: null,
            bestAsk: null,
            mid: null,
            lastTradePrice: null,
          };
          const newBid = change.best_bid
            ? parseFloat(change.best_bid)
            : existing.bestBid;
          const newAsk = change.best_ask
            ? parseFloat(change.best_ask)
            : existing.bestAsk;
          const mid =
            newBid != null && newAsk != null ? (newBid + newAsk) / 2 : null;
          next.set(change.asset_id, {
            ...existing,
            bestBid: newBid,
            bestAsk: newAsk,
            mid,
          });
        }
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (tokenIds.length === 0) return;
    tokenIdsRef.current = tokenIds;

    function connect() {
      if (wsRef.current) wsRef.current.close();
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
        setConnected(true);
        ws.send(
          JSON.stringify({
            assets_ids: tokenIdsRef.current,
            type: "market",
            custom_feature_enabled: true,
          }),
        );
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(
          RECONNECT_BASE * Math.pow(2, reconnectRef.current),
          MAX_RECONNECT,
        );
        reconnectRef.current++;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      setPrices(new Map());
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenKey, handleMessage]);

  return { prices, connected };
}
