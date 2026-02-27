"use client";

const NICHES = [
  "ALL",
  "TEMPERATURE",
  "FINANCE",
  "XTRACKER",
  "SPORTS",
  "YOUTUBE",
  "CRYPTO",
  "WEATHER",
] as const;

export type Niche = (typeof NICHES)[number];

interface NicheTabsProps {
  activeNiche: Niche;
  onNicheChange: (niche: Niche) => void;
}

export default function NicheTabs({
  activeNiche,
  onNicheChange,
}: NicheTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {NICHES.map((niche) => {
        const isActive = niche === activeNiche;
        return (
          <button
            key={niche}
            onClick={() => onNicheChange(niche)}
            className={`
              shrink-0 cursor-pointer rounded-none border-[3px] px-4 py-2
              font-mono text-sm font-bold uppercase tracking-wide
              transition-all
              ${
                isActive
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#fe5733] bg-transparent text-[#fe5733] hover:bg-[#fe5733]/10"
              }
            `}
          >
            {niche}
          </button>
        );
      })}
    </div>
  );
}
