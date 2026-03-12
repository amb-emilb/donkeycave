"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "OVERVIEW", href: "/cave", exact: true },
  { label: "CANDIDATES", href: "/cave/candidates" },
  { label: "TRADES", href: "/cave/trades" },
  { label: "ACCURACY", href: "/cave/accuracy" },
  { label: "INSIGHTS", href: "/cave/insights" },
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

      <div className="flex items-center gap-1 overflow-x-auto md:gap-2">
        {TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 border-[2px] px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors md:px-3 md:text-xs ${
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
