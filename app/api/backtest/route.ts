import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runBacktest, DEFAULT_CONFIG, type BacktestConfig } from "@/lib/backtest";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const config: BacktestConfig = {
    minDivergence: parseFloat(
      searchParams.get("minDiv") ?? String(DEFAULT_CONFIG.minDivergence),
    ),
    minConfidence: parseFloat(
      searchParams.get("minConf") ?? String(DEFAULT_CONFIG.minConfidence),
    ),
    minVolume: parseFloat(
      searchParams.get("minVol") ?? String(DEFAULT_CONFIG.minVolume),
    ),
    maxSpread: parseFloat(
      searchParams.get("maxSpread") ?? String(DEFAULT_CONFIG.maxSpread),
    ),
    stakeSize: parseFloat(
      searchParams.get("stake") ?? String(DEFAULT_CONFIG.stakeSize),
    ),
    niches: searchParams.get("niches")?.split(",") ?? DEFAULT_CONFIG.niches,
    lookbackDays: parseInt(
      searchParams.get("days") ?? String(DEFAULT_CONFIG.lookbackDays),
      10,
    ),
  };

  // Clamp to reasonable bounds
  config.lookbackDays = Math.min(30, Math.max(1, config.lookbackDays));
  config.stakeSize = Math.min(10000, Math.max(1, config.stakeSize));

  const since = new Date(
    Date.now() - config.lookbackDays * 86_400_000,
  ).toISOString();

  const { data: divergences, error } = await supabase
    .from("divergences")
    .select(
      "id, timestamp, niche, market_question, poly_yes_price, signal_prob, divergence, signal_detail, confidence, volume_24h, spread, end_date, clob_yes_price",
    )
    .gte("timestamp", since)
    .order("timestamp", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = runBacktest(divergences ?? [], config);

  // Trim trades to keep response size reasonable
  return NextResponse.json({
    ...result,
    trades: result.trades.slice(-500),
  });
}
