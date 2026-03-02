"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS } from "@/lib/docs-content";

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden border-[3px] border-[#fe5733] bg-[#141414] md:block">
        <h3 className="border-b-[3px] border-[#fe5733] p-3 font-pixel text-sm uppercase text-[#fe5733]">
          Documentation
        </h3>
        <div className="flex flex-col">
          {DOCS.map((doc) => {
            const isActive = pathname === `/docs/${doc.slug}`;
            return (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className={`border-b border-[#222] px-4 py-3 font-mono text-xs uppercase tracking-wide transition-colors ${
                  isActive
                    ? "bg-[#fe5733]/10 text-[#fe5733]"
                    : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#fe5733]"
                }`}
              >
                {isActive && (
                  <span className="mr-2 inline-block h-1.5 w-1.5 bg-[#fe5733]" />
                )}
                {doc.title}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: horizontal scroll */}
      <nav className="flex gap-2 overflow-x-auto pb-2 md:hidden">
        {DOCS.map((doc) => {
          const isActive = pathname === `/docs/${doc.slug}`;
          return (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className={`shrink-0 border-[2px] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
                isActive
                  ? "border-[#fe5733] bg-[#fe5733] text-black"
                  : "border-[#333] text-gray-400 hover:border-[#fe5733]"
              }`}
            >
              {doc.title}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
