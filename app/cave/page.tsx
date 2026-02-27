import { getDashboardData } from "@/lib/queries";
import DashboardShell from "@/components/dashboard/shell";
import type { DashboardData } from "@/components/dashboard/shell";

export const revalidate = 1800; // ISR: 30 min matches cron

export default async function CavePage() {
  const raw = await getDashboardData();

  // Transform Supabase snake_case → component camelCase
  const data: DashboardData = {
    divergences: raw.divergences.map((d) => ({
      id: String(d.id),
      niche: d.niche,
      question: d.market_question,
      polyYes: Number(d.poly_yes_price),
      signalProb: Number(d.signal_prob),
      divergence: Number(d.divergence),
      detail: d.signal_detail ?? "",
    })),
    nicheSummaries: raw.nicheSummaries.map((n) => ({
      niche: n.niche,
      count: Number(n.count),
      avgDivergence: Number(n.avg_abs_divergence),
      topMarket: n.top_market ?? "N/A",
      topDivergence: Number(n.top_divergence),
    })),
    timeseries: raw.timeseries.map((t) => ({
      bucket: new Date(t.bucket).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
      }),
      niche: t.niche,
      avgDivergence: Number(t.avg_abs_divergence),
      count: Number(t.record_count),
    })),
    lastCycle: raw.lastCycle?.completed_at
      ? new Date(raw.lastCycle.completed_at)
      : new Date(),
  };

  return <DashboardShell initialData={data} />;
}
