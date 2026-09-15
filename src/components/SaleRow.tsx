"use client";

import { useState, useTransition } from "react";
import { updateSale, deleteSale } from "@/app/(app)/actions";
import { fmt, todayKey } from "@/lib/format";

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
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(sale.sale_date);
  const [items, setItems] = useState<SaleItemDraft[]>(() =>
    sale.sale_items.map((it) => ({ key: it.id, name: it.name, qty: String(it.qty), price: String(it.price) }))
  );

  const summary = sale.sale_items.map((it) => `${it.name} ×${it.qty}`).join(", ");

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
      <div className="bg-card border border-line rounded-xl px-3.5 py-3 space-y-2.5">
        <input
          type="date"
          value={date}
          max={todayKey()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-line rounded-lg px-2.5 py-1.5 bg-cream text-sm"
        />

        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.key} className="flex gap-1.5 items-center">
              <input
                value={it.name}
                onChange={(e) => updateLine(it.key, { name: e.target.value })}
                placeholder="Article"
                className="flex-1 min-w-0 border border-line rounded-lg px-2 py-1.5 bg-cream text-sm"
              />
              <input
                type="number"
                inputMode="numeric"
                value={it.qty}
                onChange={(e) => updateLine(it.key, { qty: e.target.value })}
                placeholder="Qté"
                className="w-14 border border-line rounded-lg px-2 py-1.5 bg-cream text-sm text-center"
              />
              <input
                type="number"
                value={it.price}
                onChange={(e) => updateLine(it.key, { price: e.target.value })}
                placeholder="Prix"
                className="w-20 border border-line rounded-lg px-2 py-1.5 bg-cream text-sm text-center"
              />
              <button onClick={() => removeLine(it.key)} className="text-red text-sm px-1" aria-label="Retirer la ligne">
                ✕
              </button>
            </div>
          ))}
        </div>

        <button onClick={addLine} className="text-xs text-ochre font-medium">
          + Ajouter une ligne
        </button>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 border border-line rounded-lg py-2 text-sm font-medium"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={pending}
            className="flex-1 bg-ochre text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center gap-2 bg-card border border-line rounded-xl px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-sm truncate">{summary || "Vente"}</p>
        <p className="text-xs text-muted">{sale.sale_date}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-mono text-sm text-green">+{fmt(sale.total, currency)}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-muted underline underline-offset-2">
          Modifier
        </button>
        <button onClick={remove} className="text-xs text-red underline underline-offset-2">
          Supprimer
        </button>
      </div>
    </div>
  );
}
