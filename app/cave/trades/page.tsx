import { getTrades, getTradingStats } from "@/lib/trading-queries";
import TradesShell from "@/components/trading/trades-shell";

export const revalidate = 1800;

export default async function TradesPage() {
  const [trades, stats] = await Promise.all([
    getTrades({ limit: 500 }),
    getTradingStats(),
  ]);
  return <TradesShell trades={trades} stats={stats} />;
}
