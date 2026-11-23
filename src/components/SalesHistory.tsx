"use client";

import { useMemo, useState } from "react";
import SaleRow from "@/components/SaleRow";
import ManualSaleForm from "@/components/ManualSaleForm";
import { Card, EmptyState, Icon } from "@/components/ui";
import { dayLabelFr, fmt, groupByDay, todayKey } from "@/lib/format";

export interface HistorySale {
  id: string;
  sale_date: string;
  total: number;
  sale_items: { id: string; name: string; qty: number; price: number }[];
}

const PERIODS = [
  { id: 7, label: "7 jours" },
  { id: 30, label: "30 jours" },
  { id: 90, label: "90 jours" },
] as const;

const PAGE = 6; // days shown before "Afficher plus"

function cutoff(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Sales history built for browsing: pick a period, see its total up front,
 * search by item, then scroll a short list of days that expands on demand.
 */
export default function SalesHistory({ sales, currency }: { sales: HistorySale[]; currency: string }) {
  const [period, setPeriod] = useState<number>(30);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const needle = q.trim().toLowerCase();
  const rows = useMemo(() => {
    const from = cutoff(period);
    return sales.filter(
      (s) =>
        s.sale_date >= from &&
        (!needle || s.sale_items.some((it) => it.name.toLowerCase().includes(needle)))
    );
  }, [sales, period, needle]);

  const total = rows.reduce((n, s) => n + s.total, 0);
  const days = groupByDay(rows, (s) => s.sale_date);
  const visibleDays = days.slice(0, shown);
  const today = todayKey();

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Chercher un article vendu…"
            aria-label="Chercher dans l'historique"
            className="field !pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar -mx-5 px-5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={period === p.id}
            onClick={() => {
              setPeriod(p.id);
              setShown(PAGE);
            }}
            className={`shrink-0 h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors ${
              period === p.id ? "bg-ink text-cream border-ink" : "bg-card text-muted border-line"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Period summary */}
      <Card className="!p-0 overflow-hidden mb-5">
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted">Total · {PERIODS.find((p) => p.id === period)?.label}</p>
            <p className="font-mono text-[15px] font-medium text-green mt-1 break-words">{fmt(total, currency)}</p>
          </div>
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted">Ventes</p>
            <p className="font-mono text-[15px] font-medium mt-1">
              {rows.length}
              {rows.length > 0 && (
                <span className="text-[11px] text-muted font-sans"> · moy. {fmt(total / rows.length, currency)}</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {days.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon name="sales" size={20} />}
            title={needle ? "Aucun résultat" : "Aucune vente sur cette période"}
            hint={needle ? "Essayez un autre nom d'article." : "Choisissez une période plus longue."}
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {visibleDays.map((d) => (
            <section key={d.date}>
              <div className="flex items-baseline justify-between gap-3 px-1 mb-2 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted capitalize truncate">
                  {dayLabelFr(d.date, today)}
                  <span className="normal-case tracking-normal font-normal"> · {d.rows.length}</span>
                </p>
                <p className="font-mono text-xs text-ink shrink-0">{fmt(d.rows.reduce((n, s) => n + s.total, 0), currency)}</p>
              </div>
              <div className="space-y-2">
                {d.rows.map((s) => (
                  <SaleRow key={s.id} sale={s} currency={currency} />
                ))}
              </div>
            </section>
          ))}
          {days.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="w-full h-11 rounded-2xl border border-line bg-card text-sm font-medium"
            >
              Afficher plus · {days.length - shown} jour{days.length - shown > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        <ManualSaleForm currency={currency} />
      </div>
    </div>
  );
}
