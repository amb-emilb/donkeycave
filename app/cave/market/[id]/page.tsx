import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ExpandableCell from "@/components/dashboard/expandable-cell";
import Orderbook from "@/components/market/orderbook";
import PriceChart from "@/components/market/price-chart";

export const revalidate = 1800;

interface MarketDetailProps {
  params: Promise<{ id: string }>;
}

export default async function MarketDetailPage({ params }: MarketDetailProps) {
  const { id } = await params;

  // Get all divergence records for this market (by condition_id or market_question match)
  const { data: records } = await supabase
    .from("divergences")
    .select("*")
    .or(`condition_id.eq.${id},id.eq.${id}`)
    .order("timestamp", { ascending: false })
    .limit(50);

  if (!records || records.length === 0) {
    // Try matching by divergence ID → get market_question → fetch history
    const { data: single } = await supabase
      .from("divergences")
      .select("*")
      .eq("id", id)
      .single();

    if (!single) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <div className="text-center">
            <p className="font-pixel text-2xl text-[#fe5733]">NOT FOUND</p>
            <Link
              href="/cave"
              className="mt-4 inline-block font-mono text-sm text-gray-400 underline hover:text-[#fe5733]"
            >
              Back to Cave
            </Link>
          </div>
        </div>
      );
    }

    // Fetch all records for this market question
    const { data: history } = await supabase
      .from("divergences")
      .select("*")
      .eq("market_question", single.market_question)
      .order("timestamp", { ascending: false })
      .limit(50);

    return <MarketView records={history ?? [single]} />;
  }

  return <MarketView records={records} />;
}

function MarketView({
  records,
}: {
  records: Record<string, unknown>[];
}) {
  const latest = records[0];
  const question = (latest.market_question as string) ?? "Unknown Market";
  const slug = latest.slug as string | null;
  const conditionId = latest.condition_id as string | null;
  const yesTokenId = latest.yes_token_id as string | null;
  const volume24h = latest.volume_24h as number | null;
  const spread = latest.spread as number | null;
  const endDate = latest.end_date as string | null;
  const clobYesPrice = latest.clob_yes_price as number | null;
  const negRisk = latest.neg_risk as boolean | null;
  const niche = (latest.niche as string) ?? "";

  const polyUrl = slug
    ? `https://polymarket.com/event/${slug}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 border-[3px] border-[#fe5733] bg-[#141414] p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="border-[2px] border-[#fe5733]/50 bg-[#fe5733]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#fe5733]">
              {niche}
            </span>
            {negRisk && (
              <span className="border-[2px] border-yellow-500/50 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-yellow-500">
                NEG RISK
              </span>
            )}
          </div>
          <h1 className="mb-4 font-mono text-lg font-bold text-white">
            {question}
          </h1>

          {polyUrl && (
            <a
              href={polyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[#fe5733] underline hover:brightness-110"
            >
              View on Polymarket &rarr;
            </a>
          )}
        </div>

        {/* Price chart + Orderbook */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PriceChart tokenId={yesTokenId} />
          </div>
          <div className="lg:col-span-1">
            <Orderbook tokenId={yesTokenId} />
          </div>
        </div>

        {/* Metadata grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetaCard
            label="GAMMA PRICE"
            value={
              latest.poly_yes_price
                ? `${((latest.poly_yes_price as number) * 100).toFixed(1)}%`
                : "N/A"
            }
          />
          <MetaCard
            label="CLOB PRICE"
            value={
              clobYesPrice ? `${(clobYesPrice * 100).toFixed(1)}%` : "N/A"
            }
          />
          <MetaCard
            label="SPREAD"
            value={spread ? `${(spread * 100).toFixed(2)}%` : "N/A"}
          />
          <MetaCard
            label="24H VOLUME"
            value={
              volume24h
                ? `$${volume24h >= 1000 ? `${(volume24h / 1000).toFixed(1)}K` : volume24h.toFixed(0)}`
                : "N/A"
            }
          />
          <MetaCard
            label="END DATE"
            value={
              endDate
                ? new Date(endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A"
            }
          />
          <MetaCard label="CONDITION ID" value={conditionId ? `${conditionId.slice(0, 12)}...` : "N/A"} />
          <MetaCard label="TOKEN ID" value={yesTokenId ? `${yesTokenId.slice(0, 12)}...` : "N/A"} />
          <MetaCard
            label="LATEST DIV"
            value={`${((latest.divergence as number) * 100).toFixed(2)}%`}
            highlight
          />
        </div>

        {/* History table */}
        <div className="border-[3px] border-[#fe5733] bg-[#141414]">
          <h3 className="border-b-[3px] border-[#fe5733] p-4 font-pixel text-base uppercase text-[#fe5733]">
            Signal History ({records.length} records)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="p-3 text-left text-xs uppercase text-gray-500">
                    Time
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Poly YES
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Signal
                  </th>
                  <th className="p-3 text-right text-xs uppercase text-gray-500">
                    Divergence
                  </th>
                  <th className="p-3 text-left text-xs uppercase text-gray-500">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const div = r.divergence as number;
                  return (
                    <tr
                      key={i}
                      className="border-b border-[#222] hover:bg-[#1a1a1a]"
                    >
                      <td className="p-3 text-xs text-gray-400">
                        {new Date(r.timestamp as string).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td className="p-3 text-right text-gray-300">
                        {((r.poly_yes_price as number) * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right text-gray-300">
                        {((r.signal_prob as number) * 100).toFixed(1)}%
                      </td>
                      <td
                        className={`p-3 text-right font-bold ${
                          div > 0
                            ? "text-green-400"
                            : div < 0
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        {div > 0 ? "+" : ""}
                        {(div * 100).toFixed(2)}%
                      </td>
                      <ExpandableCell
                        text={(r.signal_detail as string) ?? ""}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="border-[2px] border-[#333] bg-[#0a0a0a] p-3">
      <p className="mb-1 font-mono text-[10px] uppercase text-gray-500">
        {label}
      </p>
      <p
        className={`font-mono text-sm font-bold ${
          highlight ? "text-[#fe5733]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
