"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { hasProducts } from "@/lib/niches";
import type { BizType } from "@/lib/types";

const ICONS: Record<string, React.ReactNode> = {
  "/dashboard": <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z" />,
  "/stats": <path d="M4 20V10m6 10V4m6 16v-7m4 7H3" />,
  "/vente": <path d="M12 5v14M5 12h14" />,
  "/depenses": <path d="M3 8l9 5 9-5M5 8v9a2 2 0 002 2h10a2 2 0 002-2V8M9 4h6" />,
  "/catalogue": <path d="M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4" />,
  "/clients": <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm10 9v-1.5a3.5 3.5 0 00-2.5-3.35M15.5 4.2a3.5 3.5 0 010 6.6" />,
};

const BASE_ITEMS: { href: string; label: string }[] = [
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

  const idx = BASE_ITEMS.findIndex((i) => current === i.href || current.startsWith(i.href + "/"));
  const n = BASE_ITEMS.length;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-10 bg-card/90 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <div className="relative flex h-16 max-w-2xl mx-auto">
        {idx >= 0 && (
          <span
            aria-hidden
            className="nav-pill absolute top-2 left-0 h-7 flex items-center justify-center pointer-events-none"
            style={{ width: `${100 / n}%`, transform: `translateX(${idx * 100}%)` }}
          >
            <span className="h-7 w-12 rounded-full bg-ochre-soft" />
          </span>
        )}
        {BASE_ITEMS.map((item, i) => {
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
                  {ICONS[item.href]}
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
