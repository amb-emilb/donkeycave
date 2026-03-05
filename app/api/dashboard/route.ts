import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = parseInt(searchParams.get("lookback") ?? "24", 10);
  // 0 = all time; otherwise clamp to [1, 87600] (10 years)
  const lookback = raw === 0 ? 0 : Math.min(87600, Math.max(1, raw));

  const data = await getDashboardData(lookback);

  // Pick date format based on range
  const formatBucket = (iso: string) => {
    const d = new Date(iso);
    if (lookback <= 48) {
      // Hourly: "Mar 5, 3 PM"
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" });
    }
    if (lookback <= 168) {
      // 4-hour: "Mar 5, 4 PM"
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" });
    }
    if (lookback <= 720) {
      // Daily: "Mar 5"
      return d.toLocaleString("en-US", { month: "short", day: "numeric" });
    }
    // Weekly: "Mar 5"
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  };

  // Same snake→camel transform as cave/page.tsx
  const result = {
    divergences: data.divergences.map((d) => ({
      id: String(d.id),
      niche: d.niche,
      question: d.market_question,
      polyYes: Number(d.poly_yes_price),
      signalProb: Number(d.signal_prob),
      divergence: Number(d.divergence),
      detail: d.signal_detail ?? "",
      conditionId: d.condition_id ?? null,
      yesTokenId: d.yes_token_id ?? null,
      volume24h: d.volume_24h ? Number(d.volume_24h) : null,
      spread: d.spread ? Number(d.spread) : null,
      endDate: d.end_date ?? null,
      clobYesPrice: d.clob_yes_price ? Number(d.clob_yes_price) : null,
      negRisk: d.neg_risk ?? false,
    })),
    nicheSummaries: data.nicheSummaries.map((n) => ({
      niche: n.niche,
      count: Number(n.count),
      avgDivergence: Number(n.avg_abs_divergence),
      topMarket: n.top_market ?? "N/A",
      topDivergence: Number(n.top_divergence),
    })),
    timeseries: data.timeseries.map((t) => ({
      bucket: formatBucket(t.bucket),
      niche: t.niche,
      avgDivergence: Number(t.avg_abs_divergence),
      count: Number(t.record_count),
    })),
    lastCycle: data.lastCycle?.completed_at
      ? new Date(data.lastCycle.completed_at).toISOString()
      : new Date().toISOString(),
  };

  return NextResponse.json(result);
}
