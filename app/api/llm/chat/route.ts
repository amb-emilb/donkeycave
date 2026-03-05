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

    // Fetch latest nightly analysis for strategic context
    const { data: latestAnalysis } = await supabase
      .from("llm_logs")
      .select("content, metadata, created_at")
      .eq("type", "nightly_analysis")
      .order("created_at", { ascending: false })
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

    // Fetch relevant long-term memories via vector search
    let memoriesContext = "";
    try {
      const embResp = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: message.trim(),
      });
      const queryEmbedding = embResp.data[0]?.embedding;
      if (queryEmbedding) {
        const { data: memories } = await supabase.rpc("match_memories", {
          query_embedding: queryEmbedding,
          match_count: 10,
          match_threshold: 0.35,
        });
        if (memories && memories.length > 0) {
          memoriesContext = "\n--- LONG-TERM KNOWLEDGE ---\n" +
            // deno-lint-ignore no-explicit-any
            (memories as any[])
              .map((m: { category: string; niche: string; content: string; confidence: number; evidence_count: number }) =>
                `[${m.category}${m.niche ? `/${m.niche}` : ""}] (conf=${m.confidence}, evidence=${m.evidence_count}) ${m.content}`)
              .join("\n");
        }
      }
    } catch {
      // Non-fatal — chat works without memories
    }

    // Build strategic context from nightly analysis
    // deno-lint-ignore no-explicit-any
    const meta = latestAnalysis?.metadata as Record<string, any> | null;
    const analysisContext = latestAnalysis
      ? `
--- NIGHTLY STRATEGIC ANALYSIS (${new Date(latestAnalysis.created_at).toLocaleDateString()}) ---
${latestAnalysis.content}

Accuracy: overall Brier=${meta?.accuracy_summary?.overall_brier?.toFixed?.(4) ?? meta?.accuracy_summary?.overall_brier ?? "N/A"}, best niche: ${meta?.accuracy_summary?.best_niche ?? "N/A"}, worst: ${meta?.accuracy_summary?.worst_niche ?? "N/A"}, trend: ${meta?.accuracy_summary?.trend ?? "N/A"}
Active recommendations: ${JSON.stringify(meta?.active_recommendations ?? [])}`
      : "";

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
          content: `You are Kirkster, a sharp and slightly degenerate Polymarket analyst. You help the user understand divergence data, market opportunities, and trading strategy. Be concise, punchy, and data-driven. You have access to the latest monitor data, nightly strategic analysis, and long-term accumulated knowledge.

${cycleInfo}
${analysisContext}
${memoriesContext}

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
