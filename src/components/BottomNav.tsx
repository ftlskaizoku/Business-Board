"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { hasProducts } from "@/lib/niches";
import type { BizType } from "@/lib/types";

import { NAV_ICONS } from "@/lib/nav-icons";

export { NAV_ICONS };

export const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Bord" },
  { href: "/stats", label: "Stats" },
  { href: "/vente", label: "Vente" },
  { href: "/depenses", label: "Dépenses" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/clients", label: "Clients" },
];

export default function BottomNav({ type }: { type: BizType }) {
  const pathname = usePathname();
  const venteLabel = hasProducts(type) ? "Vente" : "RDV";

  // The tab lights up the instant it is tapped (before the next screen has
  // loaded), so the app answers immediately. `target` is dropped as soon as
  // the real route catches up — compared during render, no effect needed.
  const [target, setTarget] = useState<{ href: string; from: string } | null>(null);
  const pending = target && target.from === pathname ? target.href : null;
  const current = pending ?? pathname;

  const idx = NAV_ITEMS.findIndex((i) => current === i.href || current.startsWith(i.href + "/"));
  const n = NAV_ITEMS.length;

  return (
    <nav
      aria-label="Navigation principale"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-card/90 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <div className="relative flex h-16 max-w-2xl md:max-w-3xl mx-auto">
        {idx >= 0 && (
          <span
            aria-hidden
            className="nav-pill absolute top-2 left-0 h-7 flex items-center justify-center pointer-events-none"
            style={{ width: `${100 / n}%`, transform: `translateX(${idx * 100}%)` }}
          >
            <span className="h-7 w-12 rounded-full bg-ochre-soft" />
          </span>
        )}
        {NAV_ITEMS.map((item, i) => {
          const label = item.href === "/vente" ? venteLabel : item.label;
          const active = i === idx;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => item.href !== pathname && setTarget({ href: item.href, from: pathname })}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 pt-0.5 text-[10px] transition-colors duration-200 active:scale-95 ${
                active ? "text-ochre font-semibold" : "text-muted font-medium"
              }`}
            >
              <span className="flex items-center justify-center h-7 w-12">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.2 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {NAV_ICONS[item.href]}
                </svg>
              </span>
              <span className="truncate max-w-full px-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
