"use client";

import BrutalistButton from "@/components/ui/brutalist-button";
import SmokeOverlay from "@/components/smoke-animation";

interface IntroScreenProps {
  onEnter: () => void;
}

export default function IntroScreen({ onEnter }: IntroScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-8">
        <div className="animate-glow-pulse relative h-[300px] w-[300px]">
          {/* Base SVG without KIRK */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/donkeyintro.svg"
            alt="Donkey Cave"
            width={300}
            height={300}
            className="h-[300px] w-auto"
          />
          {/* Animated smoke overlay - aligned via same viewBox */}
          <SmokeOverlay variant="intro" />
        </div>

        <h1 className="font-pixel text-5xl uppercase tracking-wider text-[#fe5733] text-glow md:text-7xl">
          DONKEY CAVE
        </h1>

        <p className="font-mono text-sm uppercase tracking-widest text-gray-400 md:text-base">
          POLYMARKET DIVERGENCE MONITOR
        </p>

        <div className="mt-4">
          <BrutalistButton variant="primary" size="lg" onClick={onEnter}>
            ENTER CAVE
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
}
