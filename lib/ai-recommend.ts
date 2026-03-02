export interface Recommendation {
  market_question: string;
  action: "BUY YES" | "BUY NO";
  confidence: number;
  reasoning: string;
  divergence: number;
  niche: string;
}

export interface OpportunityInput {
  question: string;
  niche: string;
  polyYes: number;
  signalProb: number;
  divergence: number;
}

export function buildPrompt(
  opportunities: OpportunityInput[],
  amount: number
): string {
  const rows = opportunities
    .map(
      (o, i) =>
        `${i + 1}. [${o.niche}] "${o.question}" | Poly YES: ${(o.polyYes * 100).toFixed(1)}% | Signal: ${(o.signalProb * 100).toFixed(1)}% | Divergence: ${(o.divergence * 100).toFixed(1)}%`
    )
    .join("\n");

  return `You have $${amount} to bet. Here are the top divergence opportunities between Polymarket prices and external signal probabilities:

${rows}

Pick the single best market to bet on. A positive divergence means the signal says YES is more likely than Polymarket prices reflect (BUY YES). A negative divergence means the signal says YES is less likely (BUY NO).

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "market_question": "exact question text",
  "action": "BUY YES" or "BUY NO",
  "confidence": 1-10,
  "reasoning": "2-3 sentences explaining why, be entertaining",
  "divergence": the raw decimal divergence value (e.g. 0.15 not 15),
  "niche": "the niche"
}`;
}
