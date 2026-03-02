import { supabase } from "./supabase";

export async function getLlmLogs(type: "insight" | "chat", limit = 50) {
  const { data, error } = await supabase
    .from("llm_logs")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: type === "chat" })
    .limit(limit);

  if (error) console.error("getLlmLogs error:", error.message);
  return data ?? [];
}

export async function saveChatMessage(
  role: "user" | "assistant",
  content: string,
) {
  const { error } = await supabase.from("llm_logs").insert({
    type: "chat",
    role,
    content,
  });
  if (error) console.error("saveChatMessage error:", error.message);
}
