import { supabase } from "@/lib/supabase";
import LlmSidebar from "@/components/llm/llm-sidebar";

interface NicheAssessment {
  brier_score?: number | null;
  brier_trend?: string;
  bias_direction?: string;
  bias_magnitude?: number;
  convergence_rate_6h?: number | null;
  signal_quality?: string;
  recommendation?: string;
}

interface ActiveRecommendation {
  niche?: string;
  action?: string;
  confidence?: number;
  status?: string;
}

interface LlmLog {
  id: number;
  created_at: string;
  cycle_id: string | null;
  type: string;
  content: string;
  metadata: {
    record_count?: number;
    niches?: string[];
    top_divergence?: number;
    top_market?: string;
    niche_breakdown?: Record<string, number>;
    high_divergence_count?: number;
    // Nightly analysis fields
    date?: string;
    prose?: string;
    niche_assessments?: Record<string, NicheAssessment>;
    active_recommendations?: ActiveRecommendation[];
    accuracy_summary?: {
      overall_brier?: number | null;
      best_niche?: string;
      worst_niche?: string;
      trend?: string;
    };
    top_findings?: string[];
    previous_recommendation_review?: string;
  } | null;
}

export const dynamic = "force-dynamic";

function SignalQualityBadge({ quality }: { quality: string }) {
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

function NightlyAnalysisCard({ log }: { log: LlmLog }) {
  const meta = log.metadata;
  const assessments = meta?.niche_assessments ?? {};
  const recs = meta?.active_recommendations ?? [];
  const findings = meta?.top_findings ?? [];
  const accuracy = meta?.accuracy_summary;

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
            Brier: {typeof accuracy.overall_brier === "number" ? accuracy.overall_brier.toFixed(4) : accuracy.overall_brier}
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

      {/* Prose */}
      <div className="mb-4 font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-line">
        {log.content}
      </div>

      {/* Niche Assessments */}
      {Object.keys(assessments).length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1 font-pixel text-[9px] uppercase text-[#fe5733]/70">Niche Assessments</h4>
          <div className="space-y-1">
            {Object.entries(assessments).map(([niche, a]) => (
              <div key={niche} className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-gray-400">
                <span className="text-gray-300">{niche}</span>
                {a.signal_quality && <SignalQualityBadge quality={a.signal_quality} />}
                {a.brier_score != null && <span>brier={typeof a.brier_score === "number" ? a.brier_score.toFixed(3) : a.brier_score}</span>}
                {a.convergence_rate_6h != null && <span>conv6h={typeof a.convergence_rate_6h === "number" ? (a.convergence_rate_6h * 100).toFixed(0) : a.convergence_rate_6h}%</span>}
                {a.recommendation && <span className="text-gray-500">— {a.recommendation}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Findings */}
      {findings.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1 font-pixel text-[9px] uppercase text-[#fe5733]/70">Key Findings</h4>
          <ul className="space-y-0.5">
            {findings.map((f, i) => (
              <li key={i} className="font-mono text-[10px] text-gray-400">• {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Active Recommendations */}
      {recs.length > 0 && (
        <div>
          <h4 className="mb-1 font-pixel text-[9px] uppercase text-[#fe5733]/70">Recommendations</h4>
          <div className="space-y-1">
            {recs.map((r, i) => (
              <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                <span className={`border px-1 py-0.5 text-[8px] ${
                  r.status === "validated" ? "border-green-500/50 text-green-400" :
                  r.status === "invalidated" ? "border-red-500/50 text-red-400" :
                  r.status === "new" ? "border-blue-500/50 text-blue-400" :
                  "border-gray-500 text-gray-400"
                }`}>
                  {r.status}
                </span>
                <span className="text-gray-400">[{r.niche}]</span>
                <span className="text-gray-300">{r.action}</span>
                {r.confidence != null && <span className="text-gray-500">({r.confidence}/10)</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CycleSummaryCard({ log }: { log: LlmLog }) {
  const breakdown = log.metadata?.niche_breakdown;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      <span className="font-mono text-[10px] text-gray-600">
        {new Date(log.created_at).toLocaleTimeString()}
      </span>
      <span className="border border-[#333] px-1.5 py-0.5 font-mono text-[8px] text-gray-500">
        CYCLE
      </span>
      <span className="font-mono text-[10px] text-gray-500">
        {log.metadata?.record_count ?? 0} markets
      </span>
      {breakdown && Object.entries(breakdown).map(([n, c]) => (
        <span key={n} className="font-mono text-[9px] text-gray-600">
          {n}:{c}
        </span>
      ))}
      {log.metadata?.top_divergence != null && log.metadata.top_divergence > 0.1 && (
        <span className="font-mono text-[9px] text-[#fe5733]/50">
          top={log.metadata.top_divergence.toFixed(3)}
        </span>
      )}
    </div>
  );
}

function LegacyInsightCard({ log }: { log: LlmLog }) {
  return (
    <div className="p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] text-gray-500">
          {new Date(log.created_at).toLocaleString()}
        </span>
        {log.metadata?.record_count != null && (
          <span className="border border-[#333] px-1.5 py-0.5 font-mono text-[9px] text-gray-400">
            {log.metadata.record_count} markets
          </span>
        )}
        {log.metadata?.niches?.map((n) => (
          <span
            key={n}
            className="border border-[#fe5733]/30 px-1.5 py-0.5 font-mono text-[9px] text-[#fe5733]/70"
          >
            {n}
          </span>
        ))}
        {log.metadata?.top_divergence != null &&
          log.metadata.top_divergence > 0 && (
            <span className="border border-[#fe5733] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#fe5733]">
              top div: {log.metadata.top_divergence.toFixed(3)}
            </span>
          )}
      </div>
      <p className="font-mono text-xs leading-relaxed text-gray-300">
        {log.content}
      </p>
    </div>
  );
}

export default async function LlmLogPage() {
  const { data: logs } = await supabase
    .from("llm_logs")
    .select("*")
    .in("type", ["nightly_analysis", "cycle_summary", "insight"])
    .order("created_at", { ascending: false })
    .limit(100);

  const entries = (logs ?? []) as LlmLog[];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <LlmSidebar />
          </div>

          <div className="md:col-span-3">
            <div className="border-[3px] border-[#fe5733] bg-[#141414]">
              <div className="border-b-[3px] border-[#fe5733] p-4">
                <h2 className="font-pixel text-sm uppercase text-[#fe5733]">
                  Analysis Log
                </h2>
                <p className="mt-1 font-mono text-[10px] text-gray-500">
                  Nightly strategic analyses + cycle summaries
                </p>
              </div>

              {entries.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-gray-500">
                  No analyses yet. The resolver runs nightly at 04:00 UTC.
                </div>
              ) : (
                <div className="divide-y divide-[#222]">
                  {entries.map((log) => {
                    if (log.type === "nightly_analysis") {
                      return <NightlyAnalysisCard key={log.id} log={log} />;
                    }
                    if (log.type === "cycle_summary") {
                      return <CycleSummaryCard key={log.id} log={log} />;
                    }
                    return <LegacyInsightCard key={log.id} log={log} />;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
