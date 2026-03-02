export interface Divergence {
  id: number;
  cycle_id: string;
  timestamp: string;
  niche: string;
  market_question: string;
  poly_yes_price: number;
  signal_value: string | null;
  signal_prob: number;
  divergence: number;
  signal_detail: string | null;
  abs_divergence: number;
  condition_id: string | null;
  yes_token_id: string | null;
  volume_24h: number | null;
  spread: number | null;
  end_date: string | null;
  clob_yes_price: number | null;
  neg_risk: boolean | null;
}

export interface Cycle {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  total_records: number;
  duration_ms: number | null;
  error_message: string | null;
  niches_run: string[] | null;
}

export interface NicheSummary {
  niche: string;
  count: number;
  avg_abs_divergence: number;
  max_abs_divergence: number;
  top_market: string;
  top_divergence: number;
}

export interface TimeseriesBucket {
  bucket: string;
  niche: string;
  avg_abs_divergence: number;
  record_count: number;
}

export interface DashboardData {
  divergences: Divergence[];
  nicheSummaries: NicheSummary[];
  timeseries: TimeseriesBucket[];
  lastCycle: Cycle | null;
  totalRecords: number;
}

export const NICHE_COLORS: Record<string, string> = {
  temperature: "#fe5733",
  finance: "#ffd700",
  xtracker: "#00ff88",
  sports: "#00bfff",
  youtube: "#ff0050",
  crypto_hourly: "#a855f7",
  weather: "#38bdf8",
};

export const NICHE_LABELS: Record<string, string> = {
  temperature: "TEMPERATURE",
  finance: "FINANCE",
  xtracker: "XTRACKER",
  sports: "SPORTS",
  youtube: "YOUTUBE",
  crypto_hourly: "CRYPTO",
  weather: "WEATHER",
};
