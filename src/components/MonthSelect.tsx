"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { monthLabelFr } from "@/lib/format";

/**
 * Month picker as a horizontal strip of pills. Each pill is a real link
 * (prefetched, no scroll jump), and the current month slides into view.
 */
export default function MonthSelect({ months, current }: { months: string[]; current: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [current]);

  return (
    <div className="-mx-5 px-5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Choisir le mois">
      <div className="flex gap-2 w-max pb-1">
        {months.map((m) => {
          const active = m === current;
          return (
            <Link
              key={m}
              ref={active ? ref : undefined}
              href={`/stats?month=${m}`}
              scroll={false}
              role="tab"
              aria-selected={active}
              className={`shrink-0 rounded-full px-3.5 h-9 flex items-center text-[13px] font-medium capitalize border transition-colors ${
                active ? "bg-ink text-cream border-ink" : "bg-card text-muted border-line"
              }`}
            >
              {monthLabelFr(m, "short")}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
