"use client";

import { useState } from "react";
import type { LlmLog, StrategicMemory } from "@/lib/trading-types";

interface Props {
  analyses: LlmLog[];
  memories: StrategicMemory[];
}

type Tab = "analyses" | "memory" | "chat";

interface NicheAssessment {
  brier_score?: number | null;
  brier_trend?: string;
  signal_quality?: string;
  convergence_rate_6h?: number | null;
  recommendation?: string;
}

function SignalBadge({ quality }: { quality: string }) {
  const colors: Record<string, string> = {
    strong: "border-green-500/50 text-green-400",
    moderate: "border-yellow-500/50 text-yellow-400",
    weak: "border-orange-500/50 text-orange-400",
    noise: "border-red-500/50 text-red-400",
  };
  return (
    <span className={`border px-1 py-0.5 font-mono text-[9px] ${colors[quality] ?? "border-gray-500 text-gray-400"}`}>
      {quality}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    niche_profile: "border-purple-500/50 text-purple-400",
    validated_pattern: "border-green-500/50 text-green-400",
    failed_hypothesis: "border-red-500/50 text-red-400",
    strategy: "border-blue-500/50 text-blue-400",
    observation: "border-gray-500 text-gray-400",
    monthly_summary: "border-yellow-500/50 text-yellow-400",
  };
  return (
    <span className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase ${colors[category] ?? "border-gray-500 text-gray-400"}`}>
      {category.replace(/_/g, " ")}
    </span>
  );
}

function AnalysisCard({ log }: { log: LlmLog }) {
  const meta = log.metadata as Record<string, unknown> | null;
  const assessments = (meta?.niche_assessments ?? {}) as Record<string, NicheAssessment>;
  const findings = (meta?.top_findings ?? []) as string[];
  const accuracy = meta?.accuracy_summary as { overall_brier?: number; trend?: string } | undefined;

  return (
    <div className="border-l-4 border-[#fe5733] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="bg-[#fe5733] px-2 py-0.5 font-pixel text-[10px] uppercase text-black">
          Nightly Analysis
        </span>
        <span className="font-mono text-[10px] text-gray-500">
          {new Date(log.created_at).toLocaleDateString()}
        </span>
        {accuracy?.overall_brier != null && (
          <span className="border border-[#333] px-1.5 py-0.5 font-mono text-[9px] text-gray-400">
            Brier: {accuracy.overall_brier.toFixed(4)}
          </span>
        )}
        {accuracy?.trend && (
          <span className={`border px-1.5 py-0.5 font-mono text-[9px] ${
            accuracy.trend === "improving" ? "border-green-500/50 text-green-400" :
            accuracy.trend === "degrading" ? "border-red-500/50 text-red-400" :
            "border-gray-500 text-gray-400"
          }`}>
            {accuracy.trend}
          </span>
        )}
      </div>

      <div className="mb-4 whitespace-pre-line font-mono text-xs leading-relaxed text-gray-300">
        {log.content}
      </div>

      {Object.keys(assessments).length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1 font-pixel text-[9px] uppercase text-[#fe5733]/70">
            Niche Assessments
          </h4>
          <div className="space-y-1">
            {Object.entries(assessments).map(([niche, a]) => (
              <div key={niche} className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-gray-400">
                <span className="text-gray-300">{niche}</span>
                {a.signal_quality && <SignalBadge quality={a.signal_quality} />}
                {a.brier_score != null && <span>brier={a.brier_score.toFixed(3)}</span>}
                {a.convergence_rate_6h != null && (
                  <span>conv6h={(a.convergence_rate_6h * 100).toFixed(0)}%</span>
                )}
                {a.recommendation && (
                  <span className="text-gray-500">— {a.recommendation}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {findings.length > 0 && (
        <div>
          <h4 className="mb-1 font-pixel text-[9px] uppercase text-[#fe5733]/70">
            Key Findings
          </h4>
          <ul className="space-y-0.5">
            {findings.map((f, i) => (
              <li key={i} className="font-mono text-[10px] text-gray-400">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MemoryCard({ memory }: { memory: StrategicMemory }) {
  return (
    <div className="border-l-4 border-[#333] p-4 transition-colors hover:border-[#fe5733]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <CategoryBadge category={memory.category} />
        {memory.niche && (
          <span className="border border-[#333] px-1.5 py-0.5 font-mono text-[9px] text-gray-400">
            {memory.niche}
          </span>
        )}
        <span className="font-mono text-[9px] text-gray-600">
          conf: {memory.confidence.toFixed(1)} | evidence: {memory.evidence_count}
        </span>
        <span className="font-mono text-[9px] text-gray-600">
          {new Date(memory.updated_at).toLocaleDateString()}
        </span>
      </div>
      <p className="whitespace-pre-line font-mono text-xs leading-relaxed text-gray-300">
        {memory.content}
      </p>
    </div>
  );
}

export default function InsightsShell({ analyses, memories }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("analyses");
  const [memoryFilter, setMemoryFilter] = useState<string>("all");

  const categories = ["all", ...new Set(memories.map((m) => m.category))];

  const filteredMemories =
    memoryFilter === "all"
      ? memories
      : memories.filter((m) => m.category === memoryFilter);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#222] bg-[#141414] px-4 py-3 md:px-6">
        <div className="mx-auto max-w-[1400px]">
          <h1 className="font-pixel text-lg uppercase text-[#fe5733]">Insights</h1>
          <p className="font-mono text-[10px] text-gray-500">
            Nightly analyses, strategic memory, and system decisions
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] space-y-4 p-4 md:p-6">
        {/* Tab bar */}
        <div className="flex items-center gap-2">
          {(["analyses", "memory", "chat"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-[2px] px-3 py-1.5 font-mono text-[10px] font-bold uppercase transition-colors ${
                activeTab === tab
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] text-gray-400 hover:border-[#fe5733]"
              }`}
            >
              {tab === "analyses" ? `Analyses (${analyses.length})` :
               tab === "memory" ? `Memory (${memories.length})` :
               "Chat with Kirkster"}
            </button>
          ))}
        </div>

        {/* Analyses Tab */}
        {activeTab === "analyses" && (
          <div className="border-[3px] border-[#fe5733] bg-[#141414]">
            {analyses.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-gray-500">
                No nightly analyses yet. The resolver generates these at 04:00 UTC.
              </div>
            ) : (
              <div className="divide-y divide-[#222]">
                {analyses.map((log) => (
                  <AnalysisCard key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === "memory" && (
          <>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setMemoryFilter(c)}
                  className={`border-[2px] px-2 py-1 font-mono text-[10px] uppercase transition-colors ${
                    memoryFilter === c
                      ? "border-[#fe5733] bg-[#fe5733] text-black"
                      : "border-[#333] text-gray-400 hover:border-[#fe5733]"
                  }`}
                >
                  {c.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <div className="border-[3px] border-[#fe5733] bg-[#141414]">
              {filteredMemories.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-gray-500">
                  No strategic memories yet. The resolver builds these from nightly analysis.
                </div>
              ) : (
                <div className="divide-y divide-[#222]">
                  {filteredMemories.map((m) => (
                    <MemoryCard key={m.id} memory={m} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="border-[3px] border-[#fe5733] bg-[#141414] p-6 text-center">
            <p className="font-mono text-xs text-gray-400">
              Chat with Kirkster is available at{" "}
              <a href="/llm/chat" className="text-[#fe5733] hover:underline">
                /llm/chat
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
