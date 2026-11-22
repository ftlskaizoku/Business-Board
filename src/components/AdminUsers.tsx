"use client";

import { useMemo, useState, useTransition } from "react";
import { setUserAllowed } from "@/app/admin/actions";
import DeleteUserButton from "@/components/DeleteUserButton";
import { EmptyNote } from "@/components/ui";
import type { AdminUser } from "@/lib/admin-stats";

type Filter = "all" | "allowed" | "blocked";

function Initial({ name, ok }: { name: string; ok: boolean }) {
  return (
    <span
      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-display font-semibold text-base ${
        ok ? "bg-indigo-soft text-indigo" : "bg-red-soft text-red"
      }`}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function ToggleButton({ user }: { user: AdminUser }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setUserAllowed(user.id, !user.allowed))}
      className="text-xs font-medium text-indigo underline underline-offset-2 disabled:opacity-50"
    >
      {pending ? "…" : user.allowed ? "Bloquer" : "Autoriser"}
    </button>
  );
}

export default function AdminUsers({ users }: { users: AdminUser[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "allowed" && !u.allowed) return false;
      if (filter === "blocked" && u.allowed) return false;
      if (!needle) return true;
      return [u.name, u.email, u.phone, u.business, u.niche].some((v) => v?.toLowerCase().includes(needle));
    });
  }, [users, q, filter]);

  const blocked = users.filter((u) => !u.allowed).length;
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: `Tous · ${users.length}` },
    { id: "allowed", label: `Autorisés · ${users.length - blocked}` },
    { id: "blocked", label: `Bloqués · ${blocked}` },
  ];

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un nom, e-mail, commerce…"
        aria-label="Rechercher un utilisateur"
        className="w-full rounded-2xl border border-line bg-card px-4 py-2.5 text-sm outline-none focus:border-indigo min-w-0"
      />
      <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={filter === t.id}
            onClick={() => setFilter(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              filter === t.id ? "bg-ink text-cream border-ink" : "bg-card text-muted border-line"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-2.5">
        {shown.map((u) => (
          <li key={u.id} className="bg-card border border-line rounded-[20px] card-surface p-3.5 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <Initial name={u.name} ok={u.allowed} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  {u.isSelf && (
                    <span className="shrink-0 text-[10px] font-medium rounded-full bg-ochre-soft text-ochre px-2 py-0.5">
                      Vous
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted truncate">{u.email || u.phone || "—"}</p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 ${
                  u.allowed ? "bg-green-soft text-green" : "bg-red-soft text-red"
                }`}
              >
                {u.allowed ? "Autorisé" : "Bloqué"}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 text-xs text-muted">
                <p className="truncate">{u.business ? `${u.business} · ${u.niche}` : "Pas encore de commerce"}</p>
                <p className="truncate">Inscrit le {u.joined} · {u.ago}</p>
              </div>
              {!u.isSelf && (
                <div className="flex items-center gap-3 shrink-0">
                  <ToggleButton user={u} />
                  <DeleteUserButton userId={u.id} label={u.name} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <EmptyNote>Aucun utilisateur ne correspond.</EmptyNote>}
    </div>
  );
}
