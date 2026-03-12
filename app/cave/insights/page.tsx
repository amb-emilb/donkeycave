import { getNightlyAnalyses, getStrategicMemories } from "@/lib/trading-queries";
import InsightsShell from "@/components/trading/insights-shell";

export const revalidate = 1800;

export default async function InsightsPage() {
  const [analyses, memories] = await Promise.all([
    getNightlyAnalyses(30),
    getStrategicMemories({ status: "active" }),
  ]);
  return <InsightsShell analyses={analyses} memories={memories} />;
}
