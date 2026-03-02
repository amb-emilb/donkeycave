import { supabase } from "@/lib/supabase";
import LlmSidebar from "@/components/llm/llm-sidebar";

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
  } | null;
}

export const dynamic = "force-dynamic";

export default async function LlmLogPage() {
  const { data: logs } = await supabase
    .from("llm_logs")
    .select("*")
    .eq("type", "insight")
    .order("created_at", { ascending: false })
    .limit(50);

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
                  Cycle Insights
                </h2>
                <p className="mt-1 font-mono text-[10px] text-gray-500">
                  Auto-generated after each monitor cycle
                </p>
              </div>

              {entries.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-gray-500">
                  No insights yet. Run a monitor cycle to generate the first
                  one.
                </div>
              ) : (
                <div className="divide-y divide-[#222]">
                  {entries.map((log) => (
                    <div key={log.id} className="p-4">
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
