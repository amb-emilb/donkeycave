"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import DonkeyInOverlay from "@/components/dashboard/donkey-in-overlay";
import DateRangeSelector, {
  type LookbackPreset,
} from "@/components/dashboard/date-range-selector";
import ExportButton from "@/components/dashboard/export-button";
import AuthGate from "@/components/dashboard/auth-gate";
import { useRealtime } from "@/hooks/use-realtime";

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
  const [showDonkeyIn, setShowDonkeyIn] = useState(false);
  const [lookback, setLookback] = useState<LookbackPreset>(24);
  const [authRequired, setAuthRequired] = useState(false);
  const [isAuthed, setIsAuthed] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.required) {
          setAuthRequired(true);
          setIsAuthed(d.authed);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch data when lookback changes
  useEffect(() => {
    if (lookback === 24) return; // Initial data is 24h

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
  }, [lookback]);

  // Realtime updates
  useRealtime({
    enabled: isAuthed,
    onNewCycle: () => {
      setData((prev) => ({ ...prev, lastCycle: new Date() }));
    },
  });

  // Filter divergences by active niche
  const filteredDivergences = useMemo(() => {
    if (activeNiche === "ALL") return data.divergences;
    return data.divergences.filter(
      (d) => d.niche.toUpperCase() === activeNiche
    );
  }, [data.divergences, activeNiche]);

  // Filter niche summaries
  const filteredNicheSummaries = useMemo(() => {
    if (activeNiche === "ALL") return data.nicheSummaries;
    return data.nicheSummaries.filter(
      (n) => n.niche.toUpperCase() === activeNiche
    );
  }, [data.nicheSummaries, activeNiche]);

  // Filter timeseries
  const filteredTimeseries = useMemo(() => {
    if (activeNiche === "ALL") return data.timeseries;
    return data.timeseries.filter(
      (t) => t.niche.toUpperCase() === activeNiche
    );
  }, [data.timeseries, activeNiche]);

  // Compute stats from filtered data
  const totalRecords = filteredDivergences.length;

  const avgDivergence = useMemo(() => {
    if (filteredDivergences.length === 0) return 0;
    const sum = filteredDivergences.reduce(
      (acc, d) => acc + Math.abs(d.divergence),
      0
    );
    return sum / filteredDivergences.length;
  }, [filteredDivergences]);

  const biggestOpportunity = useMemo(() => {
    if (filteredDivergences.length === 0) {
      return { question: "N/A", divergence: 0 };
    }
    const sorted = [...filteredDivergences].sort(
      (a, b) => Math.abs(b.divergence) - Math.abs(a.divergence)
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

  // Auth gate
  if (authRequired && !isAuthed) {
    return <AuthGate onAuthenticated={() => setIsAuthed(true)} />;
  }

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

        {/* DONKEY IN button */}
        <button
          onClick={() => setShowDonkeyIn(true)}
          className="group w-full cursor-pointer border-[3px] border-[#fe5733] bg-[#fe5733] px-8 py-4 font-pixel text-3xl uppercase text-black shadow-[6px_6px_0_0_#000] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          style={{
            textShadow: "none",
          }}
        >
          <span className="inline-block transition-transform group-hover:scale-110">
            DONKEY IN
          </span>
        </button>

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

        {/* Divergence table - full width */}
        <DivergenceTable
          data={data.divergences}
          activeNiche={activeNiche}
        />

        {/* Divergence chart - full width */}
        <DivergenceChart timeseriesData={filteredTimeseries} />
      </main>

      {/* DONKEY IN overlay */}
      {showDonkeyIn && (
        <DonkeyInOverlay
          opportunities={topOpportunities}
          onClose={() => setShowDonkeyIn(false)}
        />
      )}
    </div>
  );
}
