"use client";

import { useState } from "react";

export interface VenteTab {
  id: string;
  label: string;
  panel: React.ReactNode;
}

/**
 * Splits the sales screen into a few short panels instead of one long page.
 * Every panel stays mounted (just hidden), so a half-built cart is still
 * there when the owner comes back from the history tab.
 */
export default function VenteTabs({ tabs }: { tabs: VenteTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const idx = Math.max(0, tabs.findIndex((t) => t.id === active));

  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections de la page"
        className="relative flex p-1 rounded-2xl bg-line/60 mb-5 lg:max-w-md"
      >
        <span
          aria-hidden
          className="nav-pill absolute top-1 bottom-1 left-1 rounded-xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
          style={{
            width: `calc((100% - 0.5rem) / ${tabs.length})`,
            transform: `translateX(${idx * 100}%)`,
          }}
        />
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`vente-tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`vente-panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`relative z-10 flex-1 min-w-0 h-10 rounded-xl text-sm truncate px-2 transition-colors ${
              t.id === active ? "font-semibold text-ink" : "font-medium text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`vente-panel-${t.id}`}
          aria-labelledby={`vente-tab-${t.id}`}
          hidden={t.id !== active}
          className={t.id === active ? "row-in" : undefined}
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
