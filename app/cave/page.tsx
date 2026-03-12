import { getDashboardData } from "@/lib/queries";
import { getTradingStats, getNichePerformances, getTrades, getLatestCandidates, getRiskState } from "@/lib/trading-queries";
import OverviewShell from "@/components/trading/overview-shell";

export const revalidate = 1800;

export default async function CavePage() {
  const [dashData, stats, nichePerf, recentTrades, topCandidates, riskState] =
    await Promise.all([
      getDashboardData(),
      getTradingStats(),
      getNichePerformances(),
      getTrades({ limit: 20 }),
      getLatestCandidates(10),
      getRiskState(),
    ]);

  return (
    <OverviewShell
      stats={stats}
      nichePerformances={nichePerf}
      recentTrades={recentTrades}
      topCandidates={topCandidates}
      riskState={riskState}
      lastCycle={
        dashData.lastCycle?.completed_at
          ? new Date(dashData.lastCycle.completed_at)
          : new Date()
      }
    />
  );
}
