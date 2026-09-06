"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasProducts } from "@/lib/niches";
import type { BizType } from "@/lib/types";

const BASE_ITEMS: { href: string; label: string; icon: string }[] = [
  { href: "/dashboard", label: "Bord", icon: "◆" },
  { href: "/stats", label: "Stats", icon: "▲" },
  { href: "/vente", label: "Vente", icon: "＋" },
  { href: "/depenses", label: "Dépenses", icon: "▼" },
  { href: "/catalogue", label: "Catalogue", icon: "▤" },
  { href: "/clients", label: "Clients", icon: "◍" },
];

export default function BottomNav({ type }: { type: BizType }) {
  const pathname = usePathname();
  const venteLabel = hasProducts(type) ? "Vente" : "RDV";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-line flex z-10">
      {BASE_ITEMS.map((item) => {
        const label = item.href === "/vente" ? venteLabel : item.label;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
              active ? "text-ochre" : "text-muted"
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
