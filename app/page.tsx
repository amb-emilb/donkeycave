"use client";

import { useState } from "react";
import IntroScreen from "@/components/intro-screen";
import MotorcycleTransition from "@/components/motorcycle-transition";
import AuthGate from "@/components/dashboard/auth-gate";
import { useRouter } from "next/navigation";

type Phase = "intro" | "password" | "transition" | "done";

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const router = useRouter();

  async function handleEnter() {
    // Check if auth is required
    try {
      const resp = await fetch("/api/auth");
      const data = await resp.json();
      if (data.required && !data.authed) {
        setPhase("password");
        return;
      }
    } catch {
      // If auth check fails, proceed without auth
    }
    setPhase("transition");
  }

  return (
    <>
      {phase === "intro" && <IntroScreen onEnter={handleEnter} />}
      {phase === "password" && (
        <AuthGate onAuthenticated={() => setPhase("transition")} />
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
