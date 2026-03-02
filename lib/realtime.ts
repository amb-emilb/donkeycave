/**
 * Supabase Realtime subscription for live dashboard updates.
 */

import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeCallbacks {
  onNewCycle?: (cycle: Record<string, unknown>) => void;
  onNewDivergences?: (divergences: Record<string, unknown>[]) => void;
}

let channel: RealtimeChannel | null = null;

export function subscribeToUpdates(callbacks: RealtimeCallbacks): () => void {
  // Unsubscribe from any existing channel
  if (channel) {
    supabase.removeChannel(channel);
  }

  channel = supabase
    .channel("dashboard-realtime")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "cycles",
        filter: "status=eq.completed",
      },
      (payload) => {
        callbacks.onNewCycle?.(payload.new as Record<string, unknown>);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "divergences",
      },
      (payload) => {
        callbacks.onNewDivergences?.([payload.new as Record<string, unknown>]);
      }
    )
    .subscribe();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}
