import { supabase } from "./supabase";
import type {
  Divergence,
  Cycle,
  NicheSummary,
  TimeseriesBucket,
  DashboardData,
} from "./types";

export async function getLastCycle(): Promise<Cycle | null> {
  const { data } = await supabase
    .from("cycles")
    .select("*")
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();
  return data as Cycle | null;
}

export async function getRecentDivergences(
  since: string,
  limit = 500
): Promise<Divergence[]> {
  const { data } = await supabase
    .from("divergences")
    .select("*")
    .gte("timestamp", since)
    .order("abs_divergence", { ascending: false })
    .limit(limit);
  return (data as Divergence[]) ?? [];
}

export async function getLatestCycleDivergences(): Promise<Divergence[]> {
  const lastCycle = await getLastCycle();
  if (!lastCycle) return [];

  const { data } = await supabase
    .from("divergences")
    .select("*")
    .eq("cycle_id", lastCycle.id)
    .order("abs_divergence", { ascending: false });
  return (data as Divergence[]) ?? [];
}

export async function getNicheSummaries(
  since: string
): Promise<NicheSummary[]> {
  const { data } = await supabase.rpc("get_niche_summaries", {
    since_timestamp: since,
  });
  return (data as NicheSummary[]) ?? [];
}

export async function getTimeseries(
  since: string
): Promise<TimeseriesBucket[]> {
  const { data } = await supabase.rpc("get_divergence_timeseries", {
    since_timestamp: since,
  });
  return (data as TimeseriesBucket[]) ?? [];
}

export async function getDashboardData(
  lookbackHours = 24,
): Promise<DashboardData> {
  const since = new Date(
    Date.now() - lookbackHours * 60 * 60 * 1000
  ).toISOString();

  const [lastCycle, divergences, nicheSummaries, timeseries] =
    await Promise.all([
      getLastCycle(),
      getRecentDivergences(since),
      getNicheSummaries(since),
      getTimeseries(since),
    ]);

  return {
    divergences,
    nicheSummaries,
    timeseries,
    lastCycle,
    totalRecords: divergences.length,
  };
}
