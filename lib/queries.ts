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

export async function getNicheSummaries(
  since: string
): Promise<NicheSummary[]> {
  const { data } = await supabase.rpc("get_niche_summaries", {
    since_timestamp: since,
  });
  return (data as NicheSummary[]) ?? [];
}

export async function getTimeseries(
  since: string,
  bucketInterval = "1 hour"
): Promise<TimeseriesBucket[]> {
  const { data } = await supabase.rpc("get_divergence_timeseries", {
    since_timestamp: since,
    bucket_interval: bucketInterval,
  });
  return (data as TimeseriesBucket[]) ?? [];
}

/**
 * Compute niche summaries from a set of divergences (no RPC needed).
 */
function computeNicheSummaries(divergences: Divergence[]): NicheSummary[] {
  const byNiche: Record<string, Divergence[]> = {};
  for (const d of divergences) {
    (byNiche[d.niche] ??= []).push(d);
  }

  return Object.entries(byNiche)
    .map(([niche, rows]) => {
      const absValues = rows.map((r) => Math.abs(r.divergence));
      const sum = absValues.reduce((a, b) => a + b, 0);
      const maxIdx = absValues.indexOf(Math.max(...absValues));
      return {
        niche,
        count: rows.length,
        avg_abs_divergence: parseFloat((sum / rows.length).toFixed(4)),
        max_abs_divergence: absValues[maxIdx],
        top_market: rows[maxIdx].market_question,
        top_divergence: rows[maxIdx].divergence,
      };
    })
    .sort((a, b) => b.avg_abs_divergence - a.avg_abs_divergence);
}

/** Pick a bucket interval that keeps the chart around 30-80 data points per niche. */
function bucketIntervalForLookback(hours: number): string {
  if (hours <= 48) return "1 hour";
  if (hours <= 168) return "4 hours";   // 7D → ~42 buckets
  if (hours <= 720) return "1 day";     // 1M → ~30 buckets
  return "1 week";                       // 1Y / ALL → ~52 buckets
}

export async function getDashboardData(
  lookbackHours = 24,
): Promise<DashboardData> {
  // 0 = all time — use a far-past date
  const since = lookbackHours === 0
    ? new Date("2020-01-01T00:00:00Z").toISOString()
    : new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const bucketInterval = bucketIntervalForLookback(lookbackHours);

  const [lastCycle, rawDivergences, timeseries] = await Promise.all([
    getLastCycle(),
    getRecentDivergences(since, 2000),
    getTimeseries(since, bucketInterval),
  ]);

  const divergences = rawDivergences;

  const nicheSummaries = computeNicheSummaries(divergences);

  return {
    divergences,
    nicheSummaries,
    timeseries,
    lastCycle,
    totalRecords: divergences.length,
  };
}
