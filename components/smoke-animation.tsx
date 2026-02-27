"use client";

import { useEffect, useState } from "react";
import smokeData from "./smoke-data.json";

interface SmokeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

const INTRO_FRAMES: SmokeRect[][] = smokeData.introFrames;
const MOTO_FRAMES: SmokeRect[][] = smokeData.motoFrames;

const FRAME_INTERVAL_MS = 150; // ~6.6 fps — pixel-art feel

interface SmokeOverlayProps {
  variant: "intro" | "motorcycle";
  className?: string;
}

export default function SmokeOverlay({ variant, className }: SmokeOverlayProps) {
  const frames = variant === "intro" ? INTRO_FRAMES : MOTO_FRAMES;
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [frames.length]);

  const currentFrame = frames[frameIndex];

  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {currentFrame.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          fill={rect.fill}
        />
      ))}
    </svg>
  );
}
