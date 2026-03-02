"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "CAVE", href: "/cave" },
  { label: "DOCS", href: "/docs" },
  { label: "LLM", href: "/llm" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b-[3px] border-[#fe5733] bg-[#141414] px-4 py-3">
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

      <div className="flex items-center gap-2">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-[2px] px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                isActive
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] bg-transparent text-gray-400 hover:border-[#fe5733] hover:text-[#fe5733]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
