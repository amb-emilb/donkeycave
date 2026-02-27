"use client";

import { motion } from "framer-motion";
import SmokeOverlay from "@/components/smoke-animation";

interface MotorcycleTransitionProps {
  onComplete: () => void;
}

export default function MotorcycleTransition({
  onComplete,
}: MotorcycleTransitionProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center bg-[#0a0a0a]">
      {/* Neon trail line */}
      <motion.div
        className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 bg-[#fe5733]"
        initial={{ width: 0 }}
        animate={{ width: "100vw" }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        style={{
          boxShadow: "0 0 10px #fe5733, 0 0 20px #fe5733, 0 0 40px #fe5733",
        }}
      />

      {/* Motorcycle with smoke overlay */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2"
        initial={{ left: -400 }}
        animate={{ left: "calc(100vw + 400px)" }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        onAnimationComplete={onComplete}
      >
        <div
          className="relative h-[350px] w-[350px]"
          style={{
            filter:
              "drop-shadow(0 0 15px #fe5733) drop-shadow(0 0 30px #fe5733)",
          }}
        >
          {/* Base SVG without smoke */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/donkeymotorcycle.svg"
            alt="Donkey on motorcycle"
            width={350}
            height={350}
            className="h-[350px] w-[350px]"
          />
          {/* Animated smoke overlay */}
          <SmokeOverlay variant="motorcycle" />
        </div>
      </motion.div>
    </div>
  );
}
