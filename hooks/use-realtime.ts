"use client";

import { useEffect, useRef } from "react";
import { subscribeToUpdates } from "@/lib/realtime";

interface UseRealtimeOptions {
  onNewCycle?: (cycle: Record<string, unknown>) => void;
  onNewDivergence?: (div: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useRealtime({
  onNewCycle,
  onNewDivergence,
  enabled = true,
}: UseRealtimeOptions) {
  const callbacksRef = useRef({ onNewCycle, onNewDivergence });
  callbacksRef.current = { onNewCycle, onNewDivergence };

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToUpdates({
      onNewCycle: (cycle) => callbacksRef.current.onNewCycle?.(cycle),
      onNewDivergences: (divs) => {
        for (const d of divs) {
          callbacksRef.current.onNewDivergence?.(d);
        }
      },
    });

    return unsubscribe;
  }, [enabled]);
}
