"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasProducts } from "@/lib/niches";
import NicheIcon from "@/components/NicheIcon";
import { NAV_ICONS, NAV_ITEMS } from "@/components/BottomNav";
import type { BizType, Niche } from "@/lib/types";

// Full names for the wide layout (the phone tab bar uses the short ones).
const LONG_LABELS: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/stats": "Statistiques",
  "/depenses": "Dépenses",
  "/catalogue": "Catalogue",
  "/clients": "Clients",
};

/** Desktop navigation (1024px and up). Phones keep the bottom tab bar. */
export default function Sidebar({
  type,
  niche,
  businessName,
  nicheLabel,
  isAdmin,
}: {
  type: BizType;
  niche: Niche;
  businessName: string;
  nicheLabel: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const on = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const itemCls = (active: boolean) =>
    `flex items-center gap-3 h-11 px-3 rounded-xl text-sm transition-colors ${
      active ? "bg-ochre-soft text-ochre font-semibold" : "text-muted font-medium hover:bg-cream hover:text-ink"
    }`;

  return (
    <aside
      aria-label="Navigation principale"
      className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col bg-card border-r border-line px-4 py-6"
    >
      <div className="flex items-center gap-3 px-2 mb-8 min-w-0">
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-ochre-soft text-ochre flex items-center justify-center">
          <NicheIcon niche={niche} size={22} />
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold leading-tight truncate">{businessName}</p>
          <p className="text-xs text-muted leading-tight truncate">{nicheLabel}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const label = item.href === "/vente" ? (hasProducts(type) ? "Ventes" : "Rendez-vous") : LONG_LABELS[item.href] ?? item.label;
          const active = on(item.href);
          return (
            <Link key={item.href} href={item.href} prefetch aria-current={pathname === item.href ? "page" : undefined} className={itemCls(active)}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.1 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {NAV_ICONS[item.href]}
              </svg>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-6 border-t border-line">
        {isAdmin && (
          <Link href="/admin" className="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-indigo hover:bg-indigo-soft transition-colors">
            <span className="w-5 text-center text-[11px] font-semibold">A</span>
            Espace admin
          </Link>
        )}
        <Link href="/parametres" className={itemCls(on("/parametres"))}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
          </svg>
          Paramètres
        </Link>
      </div>
    </aside>
  );
}
