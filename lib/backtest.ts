export interface RawDivergence {
  id: number;
  timestamp: string;
  niche: string;
  market_question: string;
  poly_yes_price: number;
  signal_prob: number;
  divergence: number;
  signal_detail: string | null;
  confidence: number | null;
  volume_24h: number | null;
  spread: number | null;
  end_date: string | null;
  clob_yes_price: number | null;
}

export interface BacktestConfig {
  minDivergence: number;
  minConfidence: number;
  minVolume: number;
  maxSpread: number;
  stakeSize: number;
  niches: string[];
  lookbackDays: number;
}

export interface TradeResult {
  timestamp: string;
  exitTimestamp: string;
  market: string;
  niche: string;
  side: "YES" | "NO";
  entryPrice: number;
  exitPrice: number;
  divergence: number;
  confidence: number;
  pnl: number;
  returnPct: number;
  holdingMinutes: number;
}

export interface NicheStats {
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgReturn: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  avgReturn: number;
  maxDrawdown: number;
  profitFactor: number;
  trades: TradeResult[];
  nicheBreakdown: Record<string, NicheStats>;
  equityCurve: { timestamp: string; equity: number }[];
}

export const DEFAULT_CONFIG: BacktestConfig = {
  minDivergence: 0.05,
  minConfidence: 0,
  minVolume: 0,
  maxSpread: 0.1,
  stakeSize: 100,
  niches: [
    "temperature",
    "finance",
    "xtracker",
    "sports",
    "youtube",
    "crypto_hourly",
  ],
  lookbackDays: 7,
};

export function runBacktest(
  divergences: RawDivergence[],
  config: BacktestConfig,
): BacktestResult {
  // Group by market_question
  const byMarket = new Map<string, RawDivergence[]>();
  for (const d of divergences) {
    if (!config.niches.includes(d.niche)) continue;
    const arr = byMarket.get(d.market_question) ?? [];
    arr.push(d);
    byMarket.set(d.market_question, arr);
  }

  // Sort each group by timestamp
  for (const [, records] of byMarket) {
    records.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  const trades: TradeResult[] = [];

  for (const [market, records] of byMarket) {
    for (let i = 0; i < records.length - 1; i++) {
      const entry = records[i];
      const exit = records[i + 1];

      // Filter criteria
      if (Math.abs(entry.divergence) < config.minDivergence) continue;
      if ((entry.confidence ?? 0) < config.minConfidence) continue;
      if ((entry.volume_24h ?? 0) < config.minVolume) continue;
      if ((entry.spread ?? 1) > config.maxSpread) continue;

      // Need valid prices for both entry and exit
      const entryClob = entry.clob_yes_price ?? entry.poly_yes_price;
      const exitClob = exit.clob_yes_price ?? exit.poly_yes_price;
      if (
        entryClob <= 0.01 ||
        entryClob >= 0.99 ||
        exitClob <= 0.01 ||
        exitClob >= 0.99
      )
        continue;

      const halfSpread = (entry.spread ?? 0.02) / 2;
      const side: "YES" | "NO" = entry.divergence > 0 ? "YES" : "NO";

      let entryPrice: number;
      let exitPrice: number;

      if (side === "YES") {
        // Signal says underpriced → buy YES at ask
        entryPrice = Math.min(0.99, entryClob + halfSpread);
        exitPrice = Math.max(0.01, exitClob - halfSpread);
      } else {
        // Signal says overpriced → buy NO
        entryPrice = Math.min(0.99, 1 - entryClob + halfSpread);
        exitPrice = Math.max(0.01, 1 - exitClob - halfSpread);
      }

      if (entryPrice <= 0.01) continue;

      const shares = config.stakeSize / entryPrice;
      const pnl = shares * (exitPrice - entryPrice);
      const returnPct = (exitPrice - entryPrice) / entryPrice;
      const holdingMinutes =
        (new Date(exit.timestamp).getTime() -
          new Date(entry.timestamp).getTime()) /
        60_000;

      trades.push({
        timestamp: entry.timestamp,
        exitTimestamp: exit.timestamp,
        market,
        niche: entry.niche,
        side,
        entryPrice,
        exitPrice,
        divergence: entry.divergence,
        confidence: entry.confidence ?? 0,
        pnl,
        returnPct,
        holdingMinutes,
      });
    }
  }

  // Sort by timestamp for equity curve
  trades.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Stats
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

  // Equity curve + max drawdown
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const equityCurve: { timestamp: string; equity: number }[] = [];

  for (const trade of trades) {
    equity += trade.pnl;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
    equityCurve.push({ timestamp: trade.timestamp, equity });
  }

  // Per-niche breakdown
  const nicheBreakdown: Record<string, NicheStats> = {};
  for (const trade of trades) {
    if (!nicheBreakdown[trade.niche]) {
      nicheBreakdown[trade.niche] = {
        trades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        avgReturn: 0,
      };
    }
    const ns = nicheBreakdown[trade.niche];
    ns.trades++;
    if (trade.pnl > 0) ns.wins++;
    else ns.losses++;
    ns.totalPnl += trade.pnl;
  }
  for (const ns of Object.values(nicheBreakdown)) {
    ns.winRate = ns.trades > 0 ? ns.wins / ns.trades : 0;
    ns.avgReturn = ns.trades > 0 ? ns.totalPnl / ns.trades : 0;
  }

  return {
    config,
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: trades.length > 0 ? wins.length / trades.length : 0,
    totalPnl,
    avgReturn: trades.length > 0 ? totalPnl / trades.length : 0,
    maxDrawdown,
    profitFactor:
      grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0
          ? Infinity
          : 0,
    trades,
    nicheBreakdown,
    equityCurve,
  };
}
