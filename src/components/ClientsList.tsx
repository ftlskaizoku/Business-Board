"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState, Icon } from "@/components/ui";
import { fmt } from "@/lib/format";

export interface ClientItem {
  id: string;
  name: string;
  phone: string | null;
  visits: number;
  total_spend: number;
}

type Sort = "recent" | "spend" | "visits";

const SORTS: { id: Sort; label: string }[] = [
  { id: "recent", label: "Récents" },
  { id: "spend", label: "Meilleurs clients" },
  { id: "visits", label: "Plus fidèles" },
];

export default function ClientsList({ clients, currency }: { clients: ClientItem[]; currency: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = clients.filter(
      (c) => !needle || c.name.toLowerCase().includes(needle) || (c.phone || "").replace(/\s/g, "").includes(needle.replace(/\s/g, ""))
    );
    // "recent" keeps the server order (newest first).
    if (sort === "spend") return [...filtered].sort((a, b) => b.total_spend - a.total_spend);
    if (sort === "visits") return [...filtered].sort((a, b) => b.visits - a.visits);
    return filtered;
  }, [clients, q, sort]);

  return (
    <div>
      {clients.length > 4 && (
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom ou téléphone…"
            aria-label="Chercher un client"
            className="field !pl-10"
          />
        </div>
      )}

      {clients.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar -mx-5 px-5">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sort === s.id}
              onClick={() => setSort(s.id)}
              className={`shrink-0 h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors ${
                sort === s.id ? "bg-ink text-cream border-ink" : "bg-card text-muted border-line"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon name="profit" size={20} />}
            title="Aucun client enregistré"
            hint="Ajoutez vos clients habituels pour suivre leurs visites et leurs achats."
          />
        </Card>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">Aucun client ne correspond.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 bg-card border border-line rounded-2xl card-surface px-3.5 py-3 min-w-0"
            >
              <span className="w-10 h-10 shrink-0 rounded-full bg-indigo-soft text-indigo flex items-center justify-center font-display font-semibold" aria-hidden>
                {c.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted truncate">
                  {c.visits} visite{c.visits > 1 ? "s" : ""}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1 -mr-1">
                <span className="font-mono text-[13px] font-medium text-right max-w-[7.5rem] break-words leading-tight">
                  {fmt(c.total_spend, currency)}
                </span>
                {c.phone && (
                  <a
                    href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                    aria-label={`Appeler ${c.name}`}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-ochre"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
                    </svg>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
