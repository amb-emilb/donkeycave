import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lookback = Math.min(168, Math.max(1, parseInt(searchParams.get("lookback") ?? "24", 10)));

  const raw = await getDashboardData(lookback);

  // Same snake→camel transform as cave/page.tsx
  const data = {
    divergences: raw.divergences.map((d) => ({
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
      ? new Date(raw.lastCycle.completed_at).toISOString()
      : new Date().toISOString(),
  };

  return NextResponse.json(data);
}
