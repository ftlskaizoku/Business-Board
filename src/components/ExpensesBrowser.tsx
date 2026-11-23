"use client";

import { useMemo, useState } from "react";
import { fmt, dayLabelFr, groupByDay, todayKey } from "@/lib/format";
import { addDays } from "@/lib/periods";
import { Card, EmptyState, Icon, PageHeader } from "@/components/ui";
import ExpenseRow from "@/components/ExpenseRow";
import ExpenseForm from "@/components/ExpenseForm";
import type { Expense } from "@/lib/types";

type Period = "month" | "last" | "quarter" | "year" | "all";
type Sort = "recent" | "amount";

const PERIODS: { id: Period; label: string }[] = [
  { id: "month", label: "Ce mois" },
  { id: "last", label: "Mois dernier" },
  { id: "quarter", label: "3 mois" },
  { id: "year", label: "Cette année" },
  { id: "all", label: "Tout" },
];
const PAGE = 40;

function rangeOf(period: Period, today: string): { start: string; end: string } {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  if (period === "month") return { start: `${y}-${pad(m)}-01`, end: today };
  if (period === "last") {
    const first = new Date(Date.UTC(y, m - 2, 1));
    const last = new Date(Date.UTC(y, m - 1, 0));
    return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
  }
  if (period === "quarter") return { start: addDays(today, -90), end: today };
  if (period === "year") return { start: `${y}-01-01`, end: today };
  return { start: "0000-01-01", end: "9999-12-31" };
}

export default function ExpensesBrowser({
  expenses,
  currency,
  history,
  defaults,
  businessName,
}: {
  expenses: Expense[];
  currency: string;
  history: string[];
  defaults: string[];
  businessName: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [names, setNames] = useState<string[]>([]); // lower-cased; empty = all
  const [sort, setSort] = useState<Sort>("recent");
  const [shown, setShown] = useState(PAGE);

  const today = todayKey();

  // Everything in the chosen period, before the name filter, so the name
  // chips can show what each name cost in that period.
  const inPeriod = useMemo(() => {
    const r = rangeOf(period, today);
    return expenses.filter((e) => e.expense_date >= r.start && e.expense_date <= r.end);
  }, [expenses, period, today]);

  const nameStats = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    inPeriod.forEach((e) => {
      const k = e.category.trim().toLowerCase();
      const cur = map.get(k);
      if (cur) cur.total += e.amount;
      else map.set(k, { name: e.category.trim(), total: e.amount });
    });
    return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.total - a.total);
  }, [inPeriod]);

  const rows = useMemo(() => {
    const filtered = names.length ? inPeriod.filter((e) => names.includes(e.category.trim().toLowerCase())) : inPeriod;
    return sort === "amount" ? [...filtered].sort((a, b) => b.amount - a.amount) : filtered;
  }, [inPeriod, names, sort]);

  const total = rows.reduce((n, e) => n + e.amount, 0);
  const topName = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((e) => m.set(e.category.trim(), (m.get(e.category.trim()) || 0) + e.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [rows]);

  const periodLabel = PERIODS.find((p) => p.id === period)!.label;
  const activeCount = (period !== "month" ? 1 : 0) + (names.length ? 1 : 0) + (sort !== "recent" ? 1 : 0);
  const visible = rows.slice(0, shown);
  const days = sort === "recent" ? groupByDay(visible, (e) => e.expense_date) : null;

  function reset() {
    setPeriod("month");
    setNames([]);
    setSort("recent");
    setShown(PAGE);
  }
  function toggleName(k: string) {
    setNames((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
    setShown(PAGE);
  }

  const chip = (on: boolean) =>
    `text-[13px] rounded-full border px-3.5 h-9 transition-colors ${
      on ? "border-ochre bg-ochre-soft text-ochre font-medium" : "border-line text-muted bg-card"
    }`;

  return (
    <div>
      <PageHeader eyebrow="Dépenses" title="Où part l'argent" subtitle={businessName} />

      {/* New expense: one tap opens the form, so the list is never pushed down. */}
      <div data-tour="depenses-form">
        {formOpen ? (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-semibold">Nouvelle dépense</p>
              <button onClick={() => setFormOpen(false)} aria-label="Fermer" className="h-8 w-8 -mr-1 flex items-center justify-center text-muted">
                <Icon name="close" size={18} />
              </button>
            </div>
            <ExpenseForm currency={currency} history={history} defaults={defaults} onSaved={() => setFormOpen(false)} />
          </Card>
        ) : (
          <button
            onClick={() => setFormOpen(true)}
            className="w-full h-12 rounded-2xl bg-ochre font-medium text-[15px] flex items-center justify-center gap-2 shadow-[0_6px_16px_-8px_var(--color-ochre)]"
          >
            <Icon name="plus" size={18} />
            Nouvelle dépense
          </button>
        )}
      </div>

      {/* Summary + filter */}
      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">Total · {periodLabel.toLowerCase()}</p>
            <p className="font-mono text-[26px] leading-tight font-medium text-red mt-1 break-words">−{fmt(total, currency)}</p>
            <p className="text-[11px] text-muted mt-1">
              {rows.length} dépense{rows.length > 1 ? "s" : ""}
              {topName && rows.length > 1 ? ` · surtout ${topName[0]}` : ""}
            </p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Filtrer les dépenses"
            className={`relative shrink-0 h-11 w-11 rounded-2xl border flex items-center justify-center ${
              activeCount ? "border-ochre bg-ochre-soft text-ochre" : "border-line bg-cream text-ink"
            }`}
          >
            <Icon name="filter" size={20} />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-ochre text-[11px] font-medium flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {(names.length > 0 || period !== "month") && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-line">
            {period !== "month" && (
              <button onClick={() => setPeriod("month")} className="text-xs rounded-full bg-cream border border-line pl-3 pr-2 h-8 flex items-center gap-1">
                {periodLabel}
                <Icon name="close" size={12} />
              </button>
            )}
            {names.map((k) => (
              <button key={k} onClick={() => toggleName(k)} className="text-xs rounded-full bg-cream border border-line pl-3 pr-2 h-8 flex items-center gap-1 max-w-full">
                <span className="truncate">{nameStats.find((n) => n.key === k)?.name ?? k}</span>
                <Icon name="close" size={12} />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* List */}
      <div className="mt-6">
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Icon name="expense" size={20} />}
              title={expenses.length === 0 ? "Aucune dépense enregistrée" : "Aucune dépense ici"}
              hint={
                expenses.length === 0
                  ? "Notez vos achats et charges pour connaître votre vrai bénéfice."
                  : "Essayez une autre période ou retirez un filtre."
              }
            />
            {expenses.length > 0 && activeCount > 0 && (
              <button onClick={reset} className="block mx-auto mt-1 mb-2 text-sm font-medium text-ochre h-10 px-3">
                Réinitialiser les filtres
              </button>
            )}
          </Card>
        ) : days ? (
          <div className="space-y-5">
            {days.map((d) => (
              <section key={d.date}>
                <div className="flex items-baseline justify-between px-1 mb-2 gap-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted capitalize">{dayLabelFr(d.date)}</p>
                  <p className="font-mono text-xs text-muted shrink-0">−{fmt(d.rows.reduce((n, e) => n + e.amount, 0), currency)}</p>
                </div>
                <div className="space-y-2">
                  {d.rows.map((e) => (
                    <ExpenseRow key={e.id} expense={e} currency={currency} suggestions={history} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((e) => (
              <ExpenseRow key={e.id} expense={e} currency={currency} suggestions={history} />
            ))}
          </div>
        )}
        {rows.length > shown && (
          <button onClick={() => setShown((n) => n + PAGE)} className="w-full mt-4 h-11 rounded-2xl border border-line bg-card text-sm font-medium">
            Voir plus ({rows.length - shown})
          </button>
        )}
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Filtrer les dépenses">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSheetOpen(false)} />
          <div className="sheet-up relative bg-card rounded-t-3xl border-t border-line max-w-2xl w-full mx-auto max-h-[85vh] flex flex-col">
            <div className="pt-2.5 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-line" />
            </div>
            <div className="px-5 pt-3 pb-3 flex items-center justify-between">
              <p className="font-display font-semibold text-lg">Filtrer</p>
              <button onClick={reset} disabled={activeCount === 0} className="text-sm text-ochre font-medium h-9 px-2 disabled:text-muted disabled:opacity-60">
                Réinitialiser
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-4 border-t border-line pt-4 space-y-6">
              <section>
                <p className="text-xs font-medium text-muted mb-2">Période</p>
                <div className="flex flex-wrap gap-2">
                  {PERIODS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPeriod(p.id);
                        setNames([]);
                        setShown(PAGE);
                      }}
                      className={chip(period === p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-xs font-medium text-muted mb-2">Trier par</p>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-cream border border-line">
                  {([["recent", "Plus récentes"], ["amount", "Plus grosses"]] as const).map(([id, l]) => (
                    <button
                      key={id}
                      onClick={() => setSort(id)}
                      className={`h-9 rounded-xl text-[13px] font-medium ${sort === id ? "bg-ochre" : "text-muted"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </section>

              {nameStats.length > 0 && (
                <section>
                  <p className="text-xs font-medium text-muted mb-2">Type de dépense</p>
                  <div className="flex flex-wrap gap-2">
                    {nameStats.map((n) => (
                      <button key={n.key} onClick={() => toggleName(n.key)} className={`${chip(names.includes(n.key))} max-w-full`}>
                        <span className="truncate">{n.name}</span>
                        <span className="ml-1.5 font-mono text-[11px] opacity-70">{fmt(n.total, "").trim()}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-line">
              <button onClick={() => setSheetOpen(false)} className="w-full h-12 rounded-2xl bg-ochre font-medium text-[15px]">
                Voir {rows.length} dépense{rows.length > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
