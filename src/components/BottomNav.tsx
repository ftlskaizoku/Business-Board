"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasProducts } from "@/lib/niches";
import type { BizType } from "@/lib/types";

// Same six tabs, same order and same labels as before; only the icons are
// now real line icons instead of text symbols.
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-md border-t border-line flex z-10">
      {BASE_ITEMS.map((item) => {
        const label = item.href === "/vente" ? venteLabel : item.label;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors active:scale-95 ${
              active ? "text-ochre font-semibold" : "text-muted font-medium"
            }`}
          >
            <span
              className={`flex items-center justify-center h-7 w-12 rounded-full transition-all duration-200 ${
                active ? "bg-ochre-soft scale-100" : "bg-transparent scale-95"
              }`}
            >
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
