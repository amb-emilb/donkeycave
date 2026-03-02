"use client";

import { useState } from "react";

interface AuthGateProps {
  onAuthenticated: () => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const resp = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await resp.json();

      if (data.ok) {
        onAuthenticated();
      } else {
        setError("WRONG PASSWORD");
      }
    } catch {
      setError("AUTH FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90">
      <div className="w-full max-w-sm border-[3px] border-[#fe5733] bg-[#0a0a0a] p-8 shadow-[8px_8px_0_0_#fe5733]">
        <h2 className="mb-6 text-center font-pixel text-2xl uppercase text-[#fe5733]">
          ENTER THE CAVE
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            className="w-full border-[2px] border-[#333] bg-[#141414] p-3 font-mono text-sm text-white placeholder:text-gray-600 focus:border-[#fe5733] focus:outline-none"
            autoFocus
          />

          {error && (
            <p className="font-mono text-xs font-bold uppercase text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border-[3px] border-[#fe5733] bg-[#fe5733] px-6 py-3 font-pixel text-lg uppercase text-black shadow-[4px_4px_0_0_#000] transition-all hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
          >
            {loading ? "..." : "DONKEY IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
