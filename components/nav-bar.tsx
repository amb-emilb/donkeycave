"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const CAVE_TABS = [
  { label: "OVERVIEW", href: "/cave", exact: true },
  { label: "CANDIDATES", href: "/cave/candidates" },
  { label: "TRADES", href: "/cave/trades" },
  { label: "ACCURACY", href: "/cave/accuracy" },
  { label: "INSIGHTS", href: "/cave/insights" },
];

const SECTIONS = [
  { label: "CAVE", href: "/cave" },
  { label: "DOCS", href: "/docs" },
  { label: "LLM", href: "/llm" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative border-b-[3px] border-[#fe5733] bg-[#141414]">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/cave" className="flex items-center gap-3">
          <Image
            src="/donkeyintro.svg"
            alt="Donkey Cave"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="font-pixel text-lg uppercase tracking-wider text-[#fe5733] md:text-xl">
            DONKEY CAVE
          </span>
        </Link>

        {/* Desktop tabs */}
        <div className="hidden items-center gap-2 md:flex">
          {CAVE_TABS.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`border-[2px] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "border-[#fe5733] bg-[#fe5733] text-black"
                    : "border-[#333] bg-transparent text-gray-400 hover:border-[#fe5733] hover:text-[#fe5733]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
          <div className="mx-1 h-5 w-px bg-[#333]" />
          {SECTIONS.filter((s) => s.href !== "/cave").map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`border-[2px] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                pathname.startsWith(s.href)
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] bg-transparent text-gray-400 hover:border-[#fe5733] hover:text-[#fe5733]"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center border-[2px] border-[#333] md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke="#fe5733" strokeWidth="2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14M2 8H14M2 12H14" stroke="#fe5733" strokeWidth="2" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b-[3px] border-[#fe5733] bg-[#141414] md:hidden">
          <div className="border-b border-[#222] px-4 py-2">
            <p className="font-mono text-[9px] uppercase text-gray-500">Pages</p>
          </div>
          <div className="grid grid-cols-2 gap-1 p-3">
            {CAVE_TABS.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMenuOpen(false)}
                  className={`border-[2px] px-3 py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "border-[#fe5733] bg-[#fe5733] text-black"
                      : "border-[#333] text-gray-400 active:border-[#fe5733] active:text-[#fe5733]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-[#222] px-4 py-2">
            <p className="font-mono text-[9px] uppercase text-gray-500">Sections</p>
          </div>
          <div className="flex gap-1 p-3 pt-1">
            {SECTIONS.map((s) => {
              const isActive = pathname.startsWith(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex-1 border-[2px] px-3 py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "border-[#fe5733] bg-[#fe5733] text-black"
                      : "border-[#333] text-gray-400 active:border-[#fe5733] active:text-[#fe5733]"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
