import { supabase } from "./supabase";
import type {
  TradeCandidate,
  Trade,
  RiskState,
  NicheAccuracy,
  StrategicMemory,
  LlmLog,
  TradingStats,
  NichePerformance,
} from "./trading-types";

// ─── Trade Candidates ───

export async function getLatestCandidates(limit = 300): Promise<TradeCandidate[]> {
  // Get candidates from the latest cycle
  const { data: latest } = await supabase
    .from("trade_candidates")
    .select("cycle_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest?.cycle_id) return [];

  const { data } = await supabase
    .from("trade_candidates")
    .select("*")
    .eq("cycle_id", latest.cycle_id)
    .order("trade_score", { ascending: false })
    .limit(limit);

  return (data ?? []) as TradeCandidate[];
}

export async function getCandidateHistory(
  since: string,
  limit = 1000,
): Promise<TradeCandidate[]> {
  const { data } = await supabase
    .from("trade_candidates")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as TradeCandidate[];
}

// ─── Trades ───

export async function getTrades(
  opts: { status?: string; niche?: string; limit?: number; since?: string } = {},
): Promise<Trade[]> {
  let q = supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.status) q = q.eq("status", opts.status);
  if (opts.niche) q = q.eq("niche", opts.niche);
  if (opts.since) q = q.gte("created_at", opts.since);

  const { data } = await q;
  return (data ?? []) as Trade[];
}

export async function getTradesCount(): Promise<number> {
  const { count } = await supabase
    .from("trades")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

// ─── Risk State ───

export async function getRiskState(): Promise<RiskState | null> {
  const { data } = await supabase
    .from("risk_state")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();
  return data as RiskState | null;
}

export async function getRiskStateHistory(days = 30): Promise<RiskState[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const { data } = await supabase
    .from("risk_state")
    .select("*")
    .gte("date", since)
    .order("date", { ascending: true });
  return (data ?? []) as RiskState[];
}

// ─── Niche Accuracy ───

export async function getNicheAccuracies(): Promise<NicheAccuracy[]> {
  // Get latest accuracy record per niche
  const { data } = await supabase
    .from("niche_accuracy")
    .select("*")
    .order("computed_at", { ascending: false });

  if (!data) return [];

  // Dedupe: keep only the latest per niche
  const byNiche = new Map<string, NicheAccuracy>();
  for (const row of data as NicheAccuracy[]) {
    if (!byNiche.has(row.niche)) {
      byNiche.set(row.niche, row);
    }
  }
  return Array.from(byNiche.values());
}

export async function getNicheAccuracyHistory(
  niche: string,
  limit = 60,
): Promise<NicheAccuracy[]> {
  const { data } = await supabase
    .from("niche_accuracy")
    .select("*")
    .eq("niche", niche)
    .order("computed_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as NicheAccuracy[];
}

// ─── Strategic Memory ───

export async function getStrategicMemories(
  opts: { category?: string; niche?: string; status?: string } = {},
): Promise<StrategicMemory[]> {
  let q = supabase
    .from("strategic_memory")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (opts.category) q = q.eq("category", opts.category);
  if (opts.niche) q = q.eq("niche", opts.niche);
  if (opts.status) q = q.eq("status", opts.status ?? "active");

  const { data } = await q;
  return (data ?? []) as StrategicMemory[];
}

// ─── LLM Logs ───

export async function getNightlyAnalyses(limit = 30): Promise<LlmLog[]> {
  const { data } = await supabase
    .from("llm_logs")
    .select("*")
    .eq("type", "nightly_analysis")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as LlmLog[];
}

// ─── Aggregated Stats ───

export async function getTradingStats(): Promise<TradingStats> {
  const [trades, riskState] = await Promise.all([
    getTrades({ limit: 5000 }),
    getRiskState(),
  ]);

  const resolved = trades.filter((t) => t.resolved_yes !== null);
  const wins = resolved.filter((t) => (t.resolution_pnl ?? 0) > 0);
  const open = trades.filter((t) => ["open", "filled", "partial"].includes(t.status));

  const totalPnl = resolved.reduce((sum, t) => sum + (t.resolution_pnl ?? 0), 0);

  return {
    totalPnl,
    totalTrades: trades.length,
    winRate: resolved.length > 0 ? wins.length / resolved.length : 0,
    openPositions: open.length,
    todayTrades: riskState?.trades_today ?? 0,
    todayPnl: riskState?.daily_pnl ?? 0,
    bankroll: riskState?.bankroll ?? 7,
    openExposure: riskState?.open_exposure ?? 0,
    halted: riskState?.halted ?? false,
  };
}

export async function getNichePerformances(): Promise<NichePerformance[]> {
  const [trades, accuracies] = await Promise.all([
    getTrades({ limit: 5000 }),
    getNicheAccuracies(),
  ]);

  const accMap = new Map(accuracies.map((a) => [a.niche, a]));
  const byNiche = new Map<string, Trade[]>();

  for (const t of trades) {
    const arr = byNiche.get(t.niche) ?? [];
    arr.push(t);
    byNiche.set(t.niche, arr);
  }

  // Also include niches that have accuracy but no trades yet
  const allNiches = new Set([...byNiche.keys(), ...accMap.keys()]);

  return Array.from(allNiches).map((niche) => {
    const nicheTrades = byNiche.get(niche) ?? [];
    const resolved = nicheTrades.filter((t) => t.resolved_yes !== null);
    const wins = resolved.filter((t) => (t.resolution_pnl ?? 0) > 0);
    const totalPnl = resolved.reduce((sum, t) => sum + (t.resolution_pnl ?? 0), 0);
    const markouts = nicheTrades.filter((t) => t.markout_1h !== null);
    const avgMarkout = markouts.length > 0
      ? markouts.reduce((sum, t) => sum + (t.markout_1h ?? 0), 0) / markouts.length
      : null;

    const acc = accMap.get(niche);
    const sampleCount = acc?.sample_count ?? 0;

    return {
      niche,
      tradeCount: nicheTrades.length,
      totalPnl,
      winRate: resolved.length > 0 ? wins.length / resolved.length : 0,
      avgMarkout1h: avgMarkout,
      brierScore: acc?.brier_score ?? null,
      sampleCount,
      kellyFraction: 0.25 * (sampleCount / (sampleCount + 50)),
    };
  }).sort((a, b) => b.tradeCount - a.tradeCount);
}
