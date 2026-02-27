"use client";

import { useMemo, useState } from "react";
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
  const [activeNiche, setActiveNiche] = useState<Niche>("ALL");

  // Filter divergences by active niche
  const filteredDivergences = useMemo(() => {
    if (activeNiche === "ALL") return initialData.divergences;
    return initialData.divergences.filter(
      (d) => d.niche.toUpperCase() === activeNiche
    );
  }, [initialData.divergences, activeNiche]);

  // Filter niche summaries
  const filteredNicheSummaries = useMemo(() => {
    if (activeNiche === "ALL") return initialData.nicheSummaries;
    return initialData.nicheSummaries.filter(
      (n) => n.niche.toUpperCase() === activeNiche
    );
  }, [initialData.nicheSummaries, activeNiche]);

  // Filter timeseries
  const filteredTimeseries = useMemo(() => {
    if (activeNiche === "ALL") return initialData.timeseries;
    return initialData.timeseries.filter(
      (t) => t.niche.toUpperCase() === activeNiche
    );
  }, [initialData.timeseries, activeNiche]);

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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header lastUpdate={initialData.lastCycle} />

      <main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
        {/* Stats row */}
        <StatsBar
          totalRecords={totalRecords}
          avgDivergence={avgDivergence}
          biggestOpportunity={biggestOpportunity}
          lastUpdate={initialData.lastCycle}
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

        {/* Divergence table - full width */}
        <DivergenceTable
          data={initialData.divergences}
          activeNiche={activeNiche}
        />

        {/* Divergence chart - full width */}
        <DivergenceChart timeseriesData={filteredTimeseries} />
      </main>
    </div>
  );
}
