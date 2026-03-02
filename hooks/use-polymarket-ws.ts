"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
const RECONNECT_BASE_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface PolymarketWsState {
  orderbook: OrderbookData | null;
  lastTradePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  connected: boolean;
}

export function usePolymarketWs(tokenId: string | null): PolymarketWsState {
  const [state, setState] = useState<PolymarketWsState>({
    orderbook: null,
    lastTradePrice: null,
    bestBid: null,
    bestAsk: null,
    connected: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Handle text ping/pong (some WS servers send text pings)
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

      if (eventType === "book") {
        const bids = ((data.bids as { price: string; size: string }[]) ?? [])
          .map((b) => ({ price: parseFloat(b.price), size: parseFloat(b.size) }))
          .filter((b) => b.size > 0)
          .sort((a, b) => b.price - a.price);

        const asks = ((data.asks as { price: string; size: string }[]) ?? [])
          .map((a) => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
          .filter((a) => a.size > 0)
          .sort((a, b) => a.price - b.price);

        setState((prev) => ({
          ...prev,
          orderbook: { bids, asks },
          bestBid: bids.length > 0 ? bids[0].price : prev.bestBid,
          bestAsk: asks.length > 0 ? asks[0].price : prev.bestAsk,
        }));
      } else if (eventType === "price_change") {
        const changes = data.price_changes as {
          asset_id: string;
          price: string;
          size: string;
          side: string;
          best_bid?: string;
          best_ask?: string;
        }[];

        if (!changes) return;

        setState((prev) => {
          if (!prev.orderbook) return prev;

          const newBids = [...prev.orderbook.bids];
          const newAsks = [...prev.orderbook.asks];
          let newBestBid = prev.bestBid;
          let newBestAsk = prev.bestAsk;

          for (const change of changes) {
            if (change.asset_id !== tokenId) continue;

            const price = parseFloat(change.price);
            const size = parseFloat(change.size);
            const levels = change.side === "BUY" ? newBids : newAsks;

            const idx = levels.findIndex((l) => l.price === price);
            if (size === 0) {
              if (idx >= 0) levels.splice(idx, 1);
            } else if (idx >= 0) {
              levels[idx].size = size;
            } else {
              levels.push({ price, size });
            }

            if (change.best_bid) newBestBid = parseFloat(change.best_bid);
            if (change.best_ask) newBestAsk = parseFloat(change.best_ask);
          }

          newBids.sort((a, b) => b.price - a.price);
          newAsks.sort((a, b) => a.price - b.price);

          return {
            ...prev,
            orderbook: { bids: newBids, asks: newAsks },
            bestBid: newBestBid,
            bestAsk: newBestAsk,
          };
        });
      } else if (eventType === "last_trade_price") {
        if (data.asset_id === tokenId) {
          setState((prev) => ({
            ...prev,
            lastTradePrice: parseFloat(data.price as string),
          }));
        }
      } else if (eventType === "best_bid_ask") {
        if (data.asset_id === tokenId) {
          setState((prev) => ({
            ...prev,
            bestBid: parseFloat(data.best_bid as string),
            bestAsk: parseFloat(data.best_ask as string),
          }));
        }
      }
    },
    [tokenId]
  );

  useEffect(() => {
    if (!tokenId) return;

    function connect() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setState((prev) => ({ ...prev, connected: true }));

        ws.send(
          JSON.stringify({
            assets_ids: [tokenId],
            type: "market",
            custom_feature_enabled: true,
          })
        );
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setState((prev) => ({ ...prev, connected: false }));
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    function scheduleReconnect() {
      const delay = Math.min(
        RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptRef.current),
        MAX_RECONNECT_DELAY
      );
      reconnectAttemptRef.current++;
      reconnectTimerRef.current = setTimeout(connect, delay);
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      setState({
        orderbook: null,
        lastTradePrice: null,
        bestBid: null,
        bestAsk: null,
        connected: false,
      });
    };
  }, [tokenId, handleMessage]);

  return state;
}
