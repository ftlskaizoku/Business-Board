"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export interface PeriodItem {
  key: string;
  label: string;
  href: string;
}

/**
 * Horizontal strip of periods (weeks, months or years). Each pill is a real
 * link, and the selected one slides into view.
 */
export default function PeriodStrip({ items, current, ariaLabel }: { items: PeriodItem[]; current: string; ariaLabel: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [current, items.length]);

  return (
    <div className="-mx-5 px-5 overflow-x-auto no-scrollbar" role="tablist" aria-label={ariaLabel}>
      <div className="flex gap-2 w-max pb-1">
        {items.map((it) => {
          const active = it.key === current;
          return (
            <Link
              key={it.key}
              ref={active ? ref : undefined}
              href={it.href}
              scroll={false}
              role="tab"
              aria-selected={active}
              className={`shrink-0 rounded-full px-3.5 h-9 flex items-center text-[13px] font-medium border transition-colors ${
                active ? "bg-ink text-cream border-ink" : "bg-card text-muted border-line"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
