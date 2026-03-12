import { getNicheAccuracies, getNichePerformances } from "@/lib/trading-queries";
import AccuracyShell from "@/components/trading/accuracy-shell";

export const revalidate = 1800;

export default async function AccuracyPage() {
  const [accuracies, performances] = await Promise.all([
    getNicheAccuracies(),
    getNichePerformances(),
  ]);
  return <AccuracyShell accuracies={accuracies} performances={performances} />;
}
