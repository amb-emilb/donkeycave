export interface TradabilityInput {
  volume24h: number | null;
  spread: number | null;
  endDate: string | null;
  confidence: number | null;
  absDivergence: number;
}

export interface TradabilityBreakdown {
  score: number; // 0-100
  volume: number;
  spread: number;
  timing: number;
  edge: number;
  confidence: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export function computeTradability(
  input: TradabilityInput,
): TradabilityBreakdown {
  // Volume: log-scaled. $1K→0.3, $10K→0.6, $100K→1.0
  const vol = input.volume24h ?? 0;
  const volumeScore = Math.min(
    1,
    Math.max(0, Math.log10(Math.max(1, vol)) / 5),
  );

  // Spread: lower is better. 0%→1.0, 5%→0.5, 10%+→0.0
  const spr = input.spread ?? 0.1;
  const spreadScore = Math.max(0, Math.min(1, 1 - spr / 0.1));

  // Time to expiry: peak at 2-12h, penalty for very short or very long
  const hoursLeft = input.endDate
    ? Math.max(0, (new Date(input.endDate).getTime() - Date.now()) / 3_600_000)
    : 24;
  let timeScore: number;
  if (hoursLeft < 0.5) timeScore = 0.1;
  else if (hoursLeft < 2)
    timeScore = 0.5 + ((hoursLeft - 0.5) / 1.5) * 0.5;
  else if (hoursLeft <= 12) timeScore = 1.0;
  else if (hoursLeft <= 48)
    timeScore = 1.0 - ((hoursLeft - 12) / 36) * 0.3;
  else if (hoursLeft <= 168)
    timeScore = 0.7 - ((hoursLeft - 48) / 120) * 0.4;
  else timeScore = 0.3;

  // Edge: divergence minus half spread (net edge after slippage)
  const netEdge = input.absDivergence - spr * 0.5;
  const edgeScore = Math.max(0, Math.min(1, netEdge / 0.15));

  const confScore = input.confidence ?? 0.5;

  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        (volumeScore * 0.25 +
          spreadScore * 0.25 +
          timeScore * 0.2 +
          edgeScore * 0.2 +
          confScore * 0.1) *
          100,
      ),
    ),
  );

  let grade: TradabilityBreakdown["grade"];
  if (score >= 80) grade = "A";
  else if (score >= 60) grade = "B";
  else if (score >= 40) grade = "C";
  else if (score >= 20) grade = "D";
  else grade = "F";

  return {
    score,
    volume: volumeScore,
    spread: spreadScore,
    timing: timeScore,
    edge: edgeScore,
    confidence: confScore,
    grade,
  };
}

const GRADE_COLORS: Record<TradabilityBreakdown["grade"], string> = {
  A: "text-green-400",
  B: "text-emerald-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

const GRADE_BG: Record<TradabilityBreakdown["grade"], string> = {
  A: "bg-green-400/10 border-green-400/30",
  B: "bg-emerald-400/10 border-emerald-400/30",
  C: "bg-yellow-400/10 border-yellow-400/30",
  D: "bg-orange-400/10 border-orange-400/30",
  F: "bg-red-400/10 border-red-400/30",
};

export { GRADE_COLORS, GRADE_BG };
