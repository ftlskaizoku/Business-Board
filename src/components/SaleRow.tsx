"use client";

import { useState, useTransition } from "react";
import { updateSale, deleteSale } from "@/app/(app)/actions";
import { fmt, todayKey } from "@/lib/format";
import { Field, ghostBtn } from "@/components/ui";

interface SaleItemDraft {
  key: string;
  name: string;
  qty: string;
  price: string;
}

interface SaleWithItems {
  id: string;
  sale_date: string;
  total: number;
  sale_items: { id: string; name: string; qty: number; price: number }[];
}

export default function SaleRow({ sale, currency }: { sale: SaleWithItems; currency: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(sale.sale_date);
  const [items, setItems] = useState<SaleItemDraft[]>(() =>
    sale.sale_items.map((it) => ({ key: it.id, name: it.name, qty: String(it.qty), price: String(it.price) }))
  );

  const count = sale.sale_items.reduce((n, it) => n + it.qty, 0);
  const summary = sale.sale_items.map((it) => `${it.name} ×${it.qty}`).join(", ");
  const title = sale.sale_items.length === 1 ? sale.sale_items[0].name : `${count} articles`;

  function updateLine(key: string, patch: Partial<SaleItemDraft>) {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeLine(key: string) {
    setItems((rows) => rows.filter((r) => r.key !== key));
  }
  function addLine() {
    setItems((rows) => [...rows, { key: crypto.randomUUID(), name: "", qty: "1", price: "0" }]);
  }

  function save() {
    const payload = items
      .filter((it) => it.name.trim())
      .map((it) => ({ name: it.name, qty: Number(it.qty) || 1, price: Number(it.price) || 0 }));
    if (payload.length === 0) return;
    startTransition(async () => {
      await updateSale({ saleId: sale.id, date, items: payload });
      setEditing(false);
      setOpen(false);
    });
  }

  function remove() {
    if (!window.confirm("Supprimer définitivement cette vente ?")) return;
    startTransition(async () => {
      await deleteSale(sale.id);
    });
  }

  if (editing) {
    return (
      <div className="row-in bg-card border border-line rounded-2xl card-surface p-3.5 space-y-3">
        <Field label="Date">
          <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} className="field" />
        </Field>

        <div className="space-y-2">
          <div className="flex gap-1.5 text-[11px] text-muted px-0.5">
            <span className="flex-1">Article</span>
            <span className="w-14 text-center">Qté</span>
            <span className="w-20 text-center">Prix</span>
            <span className="w-6" />
          </div>
          {items.map((it) => (
            <div key={it.key} className="flex gap-1.5 items-center">
              <input
                value={it.name}
                onChange={(e) => updateLine(it.key, { name: e.target.value })}
                placeholder="Article"
                className="field flex-1 !h-10 !px-2.5"
              />
              <input
                type="number"
                inputMode="numeric"
                value={it.qty}
                onChange={(e) => updateLine(it.key, { qty: e.target.value })}
                className="field !w-14 !h-10 !px-1 text-center font-mono"
              />
              <input
                type="number"
                inputMode="numeric"
                value={it.price}
                onChange={(e) => updateLine(it.key, { price: e.target.value })}
                className="field !w-20 !h-10 !px-1 text-center font-mono"
              />
              <button onClick={() => removeLine(it.key)} className="text-red w-6 text-sm" aria-label="Retirer la ligne">
                ✕
              </button>
            </div>
          ))}
        </div>

        <button onClick={addLine} className="text-xs text-ochre font-medium">
          + Ajouter une ligne
        </button>

        <div className="flex gap-2 pt-1">
          <button onClick={() => setEditing(false)} className={`${ghostBtn} flex-1`}>
            Annuler
          </button>
          <button onClick={save} disabled={pending} className="flex-1 h-10 rounded-xl bg-ochre text-sm font-medium disabled:opacity-50">
            {pending ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-2xl card-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left min-w-0"
      >
        <span className="w-9 h-9 shrink-0 rounded-full bg-green-soft text-green flex items-center justify-center" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium truncate">{title || "Vente"}</span>
          {sale.sale_items.length > 1 && <span className="block text-xs text-muted truncate">{summary}</span>}
          {sale.sale_items.length === 1 && sale.sale_items[0].qty > 1 && (
            <span className="block text-xs text-muted">×{sale.sale_items[0].qty}</span>
          )}
        </span>
        <span className="font-mono text-sm text-green shrink-0">+{fmt(sale.total, currency)}</span>
      </button>
      {open && (
        <div className="row-in flex border-t border-line text-sm">
          <button onClick={() => setEditing(true)} className="flex-1 py-2.5 font-medium">
            Modifier
          </button>
          <span className="w-px bg-line" />
          <button onClick={remove} disabled={pending} className="flex-1 py-2.5 font-medium text-red disabled:opacity-50">
            {pending ? "…" : "Supprimer"}
          </button>
        </div>
      )}
    </div>
  );
}
