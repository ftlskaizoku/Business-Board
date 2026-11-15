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

  return (
    <div className="bg-card border border-line rounded-xl px-3.5 py-2.5">
      <div className="flex justify-between items-center gap-2">
        <div className="min-w-0">
          <p className="text-sm truncate">{product.name}</p>
          <p className="text-xs text-muted truncate">
            {product.category} · {fmt(product.price, currency)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {trackStock && (
            <>
              <span
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  product.stock < 5 ? "bg-red-soft text-red" : "bg-green-soft text-green"
                }`}
              >
                {product.stock <= 0 ? "Rupture" : `${product.stock} en stock`}
              </span>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-xs font-medium text-ochre whitespace-nowrap"
              >
                {open ? "Fermer" : "＋ Stock"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => startTransition(() => deleteProduct(product.id))}
            disabled={pending}
            className="text-muted px-1 disabled:opacity-50"
            aria-label={`Supprimer ${product.name}`}
          >
            ✕
          </button>
        </div>
      </div>

      {trackStock && open && (
        <div className="mt-3 pt-3 border-t border-line">
          <label className="block text-xs text-muted mb-1.5">Combien d&apos;unités avez-vous ajoutées ?</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="ex. 24"
              className="w-24 border border-line rounded-lg px-2.5 py-1.5 bg-cream text-sm font-mono"
            />
            <button
              type="button"
              onClick={submit}
              disabled={pending || add <= 0}
              className="bg-ochre text-white rounded-lg px-3.5 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "…" : "Ajouter"}
            </button>
            {add > 0 && (
              <span className="text-xs text-muted">
                {product.stock} → <b className="text-ink">{product.stock + add}</b>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
