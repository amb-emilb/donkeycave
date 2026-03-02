import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildPrompt, type OpportunityInput, type Recommendation } from "@/lib/ai-recommend";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, opportunities } = body as {
      amount: number;
      opportunities: OpportunityInput[];
    };

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json(
        { error: "No opportunities provided" },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(opportunities, amount);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Kirkster, a degenerate but shrewd Polymarket trader who loves making bold bets. You analyze divergence data between market prices and real-world signals to find mispriced markets. You speak with confidence and a bit of humor. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

    const recommendation: Recommendation = JSON.parse(cleaned);

    // Normalize: if AI returned percentage instead of decimal, convert
    if (Math.abs(recommendation.divergence) > 1) {
      recommendation.divergence = recommendation.divergence / 100;
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DONKEY IN error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
