"use client";

import { useState, useEffect, useRef } from "react";
import LlmSidebar from "@/components/llm/llm-sidebar";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export default function LlmChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from("llm_logs")
        .select("*")
        .eq("type", "chat")
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        setMessages(
          data.map((d) => ({
            id: d.id,
            role: d.role as "user" | "assistant",
            content: d.content,
            created_at: d.created_at,
          })),
        );
      }
    }
    loadHistory();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to reach the server." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <LlmSidebar />
          </div>

          <div className="flex h-[calc(100vh-120px)] flex-col md:col-span-3">
            <div className="flex flex-1 flex-col border-[3px] border-[#fe5733] bg-[#141414]">
              {/* Header */}
              <div className="border-b-[3px] border-[#fe5733] p-4">
                <h2 className="font-pixel text-sm uppercase text-[#fe5733]">
                  Chat with Kirkster
                </h2>
                <p className="mt-1 font-mono text-[10px] text-gray-500">
                  Ask about divergences, market data, or strategy
                </p>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto p-4"
              >
                {messages.length === 0 && (
                  <div className="py-12 text-center font-mono text-xs text-gray-500">
                    Start a conversation. Kirkster has context on your latest
                    divergence data.
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={msg.id ?? i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 font-mono text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "border-[2px] border-[#fe5733] bg-[#fe5733]/10 text-gray-200"
                          : "border-[2px] border-[#333] bg-[#1a1a1a] text-gray-300"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <span className="mb-1 block font-pixel text-[9px] text-[#fe5733]">
                          KIRKSTER
                        </span>
                      )}
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="border-[2px] border-[#333] bg-[#1a1a1a] px-3 py-2 font-mono text-xs text-gray-500">
                      <span className="font-pixel text-[9px] text-[#fe5733]">
                        KIRKSTER
                      </span>
                      <br />
                      thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t-[3px] border-[#fe5733] p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask Kirkster something..."
                    className="flex-1 border-[2px] border-[#333] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-[#fe5733]"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="border-[2px] border-[#fe5733] bg-[#fe5733] px-4 py-2 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-[#fe5733]/80 disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
