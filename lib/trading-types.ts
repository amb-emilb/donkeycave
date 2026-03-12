// Types for SSAT trading tables (trade_candidates, trades, risk_state, niche_accuracy)

export interface TradeCandidate {
  id: string;
  created_at: string;
  cycle_id: string | null;
  niche: string;
  market_question: string;
  condition_id: string | null;
  yes_token_id: string | null;
  no_token_id: string | null;
  mkt_price: number;
  signal_prob: number;
  divergence: number;
  confidence: number | null;
  spread: number | null;
  k: number;
  p_estimated: number;
  kelly: number;
  edge_decay: number;
  kelly_fraction: number;
  trade_score: number;
  position_size: number;
  side: "BUY_YES" | "BUY_NO";
  status: "scored" | "executing" | "executed" | "skipped" | "expired" | "failed";
  skip_reason: string | null;
  executed_at: string | null;
}

export interface Trade {
  id: string;
  candidate_id: string | null;
  created_at: string;
  niche: string;
  market_question: string;
  condition_id: string;
  token_id: string;
  side: "BUY_YES" | "BUY_NO";
  size: number;
  limit_price: number | null;
  fill_price: number | null;
  fill_size: number | null;
  order_id: string | null;
  status: "pending" | "open" | "filled" | "partial" | "cancelled" | "failed";
  exit_price: number | null;
  realized_pnl: number | null;
  fees: number;
  price_at_1h: number | null;
  price_at_6h: number | null;
  price_at_24h: number | null;
  markout_1h: number | null;
  markout_6h: number | null;
  markout_24h: number | null;
  resolved_yes: boolean | null;
  resolution_pnl: number | null;
}

export interface RiskState {
  date: string;
  bankroll: number;
  daily_pnl: number;
  open_exposure: number;
  trades_today: number;
  wins_today: number;
  losses_today: number;
  halted: boolean;
  halt_reason: string | null;
  exposure_by_niche: Record<string, number>;
  updated_at: string;
}

export interface NicheAccuracy {
  id: number;
  computed_at: string;
  niche: string;
  brier_score: number | null;
  sample_count: number;
  window_days: number;
  avg_confidence: number | null;
  detail: Record<string, unknown> | null;
}

export interface StrategicMemory {
  id: string;
  category: string;
  niche: string | null;
  content: string;
  metadata: Record<string, unknown>;
  confidence: number;
  evidence_count: number;
  status: "active" | "archived" | "invalidated";
  created_at: string;
  updated_at: string;
}

export interface LlmLog {
  id: number;
  created_at: string;
  cycle_id: string | null;
  type: string;
  role: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
}

// Aggregated stats for the overview
export interface TradingStats {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  openPositions: number;
  todayTrades: number;
  todayPnl: number;
  bankroll: number;
  openExposure: number;
  halted: boolean;
}

export interface NichePerformance {
  niche: string;
  tradeCount: number;
  totalPnl: number;
  winRate: number;
  avgMarkout1h: number | null;
  brierScore: number | null;
  sampleCount: number;
  kellyFraction: number;
}
