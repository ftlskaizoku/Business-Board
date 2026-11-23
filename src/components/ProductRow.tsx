"use client";

import { useState, useTransition } from "react";
import { restockProduct, deleteProduct } from "@/app/(app)/actions";
import { fmt } from "@/lib/format";
import type { Product } from "@/lib/types";

// One catalogue line. When stock tracking is on it also lets the owner add
// units received ("+24") — they enter how many came in, not the new total.
export default function ProductRow({
  product,
  currency,
  trackStock,
}: {
  product: Product;
  currency: string;
  trackStock: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [pending, startTransition] = useTransition();

  const add = Math.round(Number(qty)) || 0;

  function submit() {
    if (add <= 0) return;
    startTransition(async () => {
      await restockProduct(product.id, add);
      setQty("");
      setOpen(false);
    });
  }

  const low = product.stock > 0 && product.stock < 5;
  const out = product.stock <= 0;

  return (
    <div className="bg-card border border-line rounded-2xl card-surface px-3.5 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{product.name}</p>
          <p className="font-mono text-xs text-muted mt-0.5 truncate">{fmt(product.price, currency)}</p>
        </div>
        {trackStock && (
          <span
            className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
              out || low ? "bg-red-soft text-red" : "bg-green-soft text-green"
            }`}
          >
            {out ? "Rupture" : `${product.stock} en stock`}
          </span>
        )}
        <div className="flex items-center shrink-0 -mr-1.5">
          {trackStock && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="h-9 px-2 text-xs font-medium text-ochre whitespace-nowrap"
            >
              {open ? "Fermer" : "+ Stock"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Supprimer « ${product.name} » du catalogue ?`)) {
                startTransition(() => deleteProduct(product.id));
              }
            }}
            disabled={pending}
            className="w-9 h-9 flex items-center justify-center text-muted disabled:opacity-50"
            aria-label={`Supprimer ${product.name}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      </div>

      {trackStock && open && (
        <div className="row-in mt-3 pt-3 border-t border-line">
          <label className="block text-xs text-muted mb-2">Combien d&apos;unités avez-vous reçues ?</label>
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="ex. 24"
              className="field !w-24 font-mono"
            />
            <button
              type="button"
              onClick={submit}
              disabled={pending || add <= 0}
              className="h-11 bg-ochre rounded-xl px-4 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "…" : "Ajouter"}
            </button>
            {add > 0 && (
              <span className="text-xs text-muted font-mono truncate">
                {product.stock} → <b className="text-ink">{product.stock + add}</b>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
