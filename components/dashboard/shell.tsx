"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/dashboard/header";
import StatsBar from "@/components/dashboard/stats-bar";
import NicheTabs, { type Niche } from "@/components/dashboard/niche-tabs";
import NicheCards, { type NicheCardData } from "@/components/dashboard/niche-cards";
import DivergenceTable, {
  type DivergenceRecord,
} from "@/components/dashboard/divergence-table";
import DivergenceChart, {
  type TimeseriesBucket,
} from "@/components/dashboard/divergence-chart";
import TopOpportunities, {
  type Opportunity,
} from "@/components/dashboard/top-opportunities";
import DateRangeSelector, {
  type LookbackPreset,
} from "@/components/dashboard/date-range-selector";
import ExportButton from "@/components/dashboard/export-button";
import { useRealtime } from "@/hooks/use-realtime";
import { useLivePrices } from "@/hooks/use-live-prices";

export interface DashboardData {
  divergences: DivergenceRecord[];
  nicheSummaries: NicheCardData[];
  timeseries: TimeseriesBucket[];
  lastCycle: Date;
}

interface DashboardShellProps {
  initialData: DashboardData;
}

export default function DashboardShell({ initialData }: DashboardShellProps) {
  const [data, setData] = useState(initialData);
  const [activeNiche, setActiveNiche] = useState<Niche>("ALL");
  const [lookback, setLookback] = useState<LookbackPreset>(24);
  const [loading, setLoading] = useState(false);

  // Extract unique token IDs for live price subscription
  const tokenIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of data.divergences) {
      if (d.yesTokenId) ids.add(d.yesTokenId);
    }
    return Array.from(ids);
  }, [data.divergences]);

  // Live CLOB WebSocket prices
  const { prices: livePrices, connected: wsConnected } =
    useLivePrices(tokenIds);

  // Track whether user has changed lookback from the SSR default
  const hasChangedLookback = useRef(false);

  // Fetch data when lookback changes
  useEffect(() => {
    // On first mount, SSR data matches 24h — skip fetch
    if (lookback === 24 && !hasChangedLookback.current) return;
    hasChangedLookback.current = true;

    // Clicking back to 24h? Restore SSR data instead of re-fetching
    if (lookback === 24) {
      setData(initialData);
      return;
    }

    setLoading(true);
    fetch(`/api/dashboard?lookback=${lookback}`)
      .then((r) => r.json())
      .then((d) => {
        setData({
          divergences: d.divergences,
          nicheSummaries: d.nicheSummaries,
          timeseries: d.timeseries,
          lastCycle: new Date(d.lastCycle),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lookback, initialData]);

  // Realtime updates
  useRealtime({
    enabled: true,
    onNewCycle: () => {
      setData((prev) => ({ ...prev, lastCycle: new Date() }));
    },
  });

  // Filter divergences by active niche
  const filteredDivergences = useMemo(() => {
    if (activeNiche === "ALL") return data.divergences;
    return data.divergences.filter(
      (d) => d.niche.toUpperCase() === activeNiche,
    );
  }, [data.divergences, activeNiche]);

  // Filter niche summaries
  const filteredNicheSummaries = useMemo(() => {
    if (activeNiche === "ALL") return data.nicheSummaries;
    return data.nicheSummaries.filter(
      (n) => n.niche.toUpperCase() === activeNiche,
    );
  }, [data.nicheSummaries, activeNiche]);

  // Filter timeseries
  const filteredTimeseries = useMemo(() => {
    if (activeNiche === "ALL") return data.timeseries;
    return data.timeseries.filter(
      (t) => t.niche.toUpperCase() === activeNiche,
    );
  }, [data.timeseries, activeNiche]);

  // Compute stats from filtered data
  const totalRecords = filteredDivergences.length;

  const avgDivergence = useMemo(() => {
    if (filteredDivergences.length === 0) return 0;
    const sum = filteredDivergences.reduce(
      (acc, d) => acc + Math.abs(d.divergence),
      0,
    );
    return sum / filteredDivergences.length;
  }, [filteredDivergences]);

  const biggestOpportunity = useMemo(() => {
    if (filteredDivergences.length === 0) {
      return { question: "N/A", divergence: 0 };
    }
    const sorted = [...filteredDivergences].sort(
      (a, b) => Math.abs(b.divergence) - Math.abs(a.divergence),
    );
    return {
      question: sorted[0].question,
      divergence: sorted[0].divergence,
    };
  }, [filteredDivergences]);

  // Top 10 opportunities by |divergence|
  const topOpportunities: Opportunity[] = useMemo(() => {
    return [...filteredDivergences]
      .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence))
      .slice(0, 10)
      .map((d) => ({
        id: d.id,
        question: d.question,
        niche: d.niche,
        polyYes: d.polyYes,
        signalProb: d.signalProb,
        divergence: d.divergence,
      }));
  }, [filteredDivergences]);

  // Export data getter
  const getExportData = useCallback(() => {
    return filteredDivergences.map((d) => ({
      niche: d.niche,
      question: d.question,
      polyYes: d.polyYes,
      signalProb: d.signalProb,
      divergence: d.divergence,
      detail: d.detail,
    }));
  }, [filteredDivergences]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header lastUpdate={data.lastCycle} />

      <main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
        {/* Controls row: date range + export */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DateRangeSelector value={lookback} onChange={setLookback} />
          <ExportButton getData={getExportData} />
        </div>

        {loading && (
          <div className="text-center font-mono text-xs text-gray-500">
            Loading...
          </div>
        )}

        {/* Stats row */}
        <StatsBar
          totalRecords={totalRecords}
          avgDivergence={avgDivergence}
          biggestOpportunity={biggestOpportunity}
          lastUpdate={data.lastCycle}
        />

        {/* Niche filter tabs */}
        <NicheTabs activeNiche={activeNiche} onNicheChange={setActiveNiche} />

        {/* Two-column: niche cards + top opportunities */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <NicheCards nicheData={filteredNicheSummaries} />
          </div>
          <div className="lg:col-span-2">
            <TopOpportunities topOpportunities={topOpportunities} />
          </div>
        </div>

        {/* Divergence table - full width, with live prices + tradability */}
        <DivergenceTable
          data={data.divergences}
          activeNiche={activeNiche}
          livePrices={livePrices}
          wsConnected={wsConnected}
        />

        {/* Divergence chart - full width */}
        <DivergenceChart timeseriesData={filteredTimeseries} />
      </main>

    </div>
  );
}
