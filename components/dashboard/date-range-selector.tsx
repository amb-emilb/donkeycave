"use client";

export type LookbackPreset = 6 | 12 | 24 | 48 | 168 | 720 | 8760 | 0;

interface DateRangeSelectorProps {
  value: LookbackPreset;
  onChange: (v: LookbackPreset) => void;
}

const PRESETS: { label: string; value: LookbackPreset }[] = [
  { label: "6H", value: 6 },
  { label: "12H", value: 12 },
  { label: "24H", value: 24 },
  { label: "48H", value: 48 },
  { label: "7D", value: 168 },
  { label: "1M", value: 720 },
  { label: "1Y", value: 8760 },
  { label: "ALL", value: 0 },
];

export default function DateRangeSelector({
  value,
  onChange,
}: DateRangeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {PRESETS.map((p) => {
        const active = p.value === value;
        return (
          <button
            key={p.label}
            onClick={() => onChange(p.value)}
            className={`border-[2px] px-3 py-1 font-mono text-xs font-bold uppercase transition-colors ${
              active
                ? "border-[#fe5733] bg-[#fe5733] text-black"
                : "border-[#333] bg-transparent text-gray-400 hover:border-[#fe5733] hover:text-[#fe5733]"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
