import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message: string };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Fetch recent divergences for context
    const { data: recentDivs } = await supabase
      .from("divergences")
      .select(
        "niche, market_question, poly_yes_price, signal_prob, divergence, signal_detail, confidence",
      )
      .order("created_at", { ascending: false })
      .limit(30);

    // Fetch last cycle info
    const { data: lastCycle } = await supabase
      .from("cycles")
      .select("id, status, total_records, duration_ms, completed_at, niches_run")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    // Build context string
    const divContext = (recentDivs ?? [])
      .map(
        (d) =>
          `[${d.niche}] "${d.market_question}" — poly=${d.poly_yes_price}, signal=${d.signal_prob}, div=${d.divergence.toFixed(3)}${d.confidence ? `, conf=${d.confidence}` : ""}`,
      )
      .join("\n");

    const cycleInfo = lastCycle
      ? `Last cycle: ${lastCycle.total_records} records, ${lastCycle.duration_ms}ms, niches: ${(lastCycle.niches_run ?? []).join(", ")}, at ${lastCycle.completed_at}`
      : "No cycle data available yet.";

    // Save user message
    await supabase.from("llm_logs").insert({
      type: "chat",
      role: "user",
      content: message.trim(),
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Kirkster, a sharp and slightly degenerate Polymarket analyst. You help the user understand divergence data, market opportunities, and trading strategy. Be concise, punchy, and data-driven. You have access to the latest monitor data.

${cycleInfo}

Recent divergences (top 30):
${divContext || "No data yet — the monitor hasn't run."}`,
        },
        { role: "user", content: message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const response =
      completion.choices[0]?.message?.content?.trim() ?? "No response.";

    // Save assistant response
    await supabase.from("llm_logs").insert({
      type: "chat",
      role: "assistant",
      content: response,
    });

    return NextResponse.json({ response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("LLM chat error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
