"use client";

import { useState } from "react";
import IntroScreen from "@/components/intro-screen";
import MotorcycleTransition from "@/components/motorcycle-transition";
import { useRouter } from "next/navigation";

type Phase = "intro" | "transition" | "done";

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const router = useRouter();

  return (
    <>
      {phase === "intro" && (
        <IntroScreen onEnter={() => setPhase("transition")} />
      )}
      {phase === "transition" && (
        <MotorcycleTransition
          onComplete={() => {
            setPhase("done");
            router.push("/cave");
          }}
        />
      )}
    </>
  );
}
