"use client";

import { useMemo, useState, useTransition } from "react";
import { fmt } from "@/lib/format";
import { checkout } from "@/app/(app)/actions";
import { primaryBtn } from "@/components/ui";
import type { Product } from "@/lib/types";

const NAV_OFFSET = "calc(4rem + env(safe-area-inset-bottom))";

function Stepper({
  qty,
  onChange,
  size = "md",
}: {
  qty: number;
  onChange: (q: number) => void;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "w-7 h-7 text-base" : "w-9 h-9 text-lg";
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        className={`${btn} rounded-full border border-line bg-card flex items-center justify-center leading-none`}
        aria-label="Diminuer la quantité"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={qty}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        aria-label="Quantité"
        className="w-11 h-9 text-center border border-line rounded-xl bg-cream font-mono text-sm outline-none focus:border-ochre"
      />
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        className={`${btn} rounded-full border border-line bg-card flex items-center justify-center leading-none`}
        aria-label="Augmenter la quantité"
      >
        +
      </button>
    </div>
  );
}

export default function VenteClient({
  products,
  currency,
  trackStock,
}: {
  products: Product[];
  currency: string;
  trackStock: boolean;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const needle = query.trim().toLowerCase();
  const visible = products.filter(
    (p) => (!category || p.category === category) && (!needle || p.name.toLowerCase().includes(needle))
  );

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  function setQty(productId: string, qty: number) {
    const clamped = Math.max(0, Math.round(qty));
    setCart((c) => {
      if (clamped <= 0) {
        const next = { ...c };
        delete next[productId];
        return next;
      }
      return { ...c, [productId]: clamped };
    });
  }

  function handleCheckout() {
    const items = Object.entries(cart).map(([productId, qty]) => ({ productId, qty }));
    const paid = total;
    startTransition(async () => {
      await checkout(items);
      setCart({});
      setDrawerOpen(false);
      setMessage(`Vente enregistrée · ${fmt(paid, currency)}`);
      setTimeout(() => setMessage(null), 2200);
    });
  }

  const groups = categories
    .map((c) => ({ category: c, items: visible.filter((p) => p.category === c) }))
    .filter((g) => g.items.length > 0);

  const cartLines = Object.entries(cart)
    .map(([productId, qty]) => {
      const p = products.find((x) => x.id === productId);
      return p ? { product: p, qty } : null;
    })
    .filter((l): l is { product: Product; qty: number } => !!l);

  return (
    <div className={itemCount > 0 ? "pb-24" : ""} data-tour="vente-grid">
      {products.length > 6 && (
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un produit…"
            aria-label="Chercher un produit"
            className="field !pl-10"
          />
        </div>
      )}

      {categories.length > 1 && (
        <div className="-mx-5 px-5 overflow-x-auto no-scrollbar mb-4">
          <div className="flex gap-2 w-max">
            {[null, ...categories].map((c) => (
              <button
                key={c ?? "all"}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`shrink-0 h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors ${
                  category === c ? "bg-ink text-cream border-ink" : "bg-card text-muted border-line"
                }`}
              >
                {c ?? "Tout"}
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <p className="text-sm text-muted text-center py-10">Aucun produit ne correspond.</p>
      )}

      {groups.map((g) => (
        <section key={g.category} className="mb-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted mb-2.5 px-1">{g.category}</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {g.items.map((p) => {
              const inCart = cart[p.id] || 0;
              const soldOut = trackStock && p.stock <= 0;
              return (
                <div
                  key={p.id}
                  className={`relative bg-card border rounded-2xl card-surface min-w-0 transition-colors ${
                    inCart > 0 ? "border-ochre" : "border-line"
                  } ${soldOut ? "opacity-60" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setQty(p.id, inCart + 1)}
                    disabled={soldOut}
                    className="w-full text-left p-3.5 pb-3 min-w-0"
                  >
                    <p className="text-sm font-medium leading-snug line-clamp-2 break-words pr-6">{p.name}</p>
                    <p className="font-mono text-[13px] mt-1.5">{fmt(p.price, currency)}</p>
                    {trackStock && (
                      <p className={`text-[11px] mt-0.5 ${p.stock < 5 ? "text-red" : "text-muted"}`}>
                        {soldOut ? "Rupture" : `${p.stock} en stock`}
                      </p>
                    )}
                  </button>
                  {inCart > 0 && (
                    <span className="absolute top-2.5 right-2.5 min-w-6 h-6 px-1.5 rounded-full bg-ochre text-[11px] font-mono font-medium flex items-center justify-center">
                      {inCart}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {message && (
        <div
          role="status"
          className="toast-in fixed left-1/2 z-30 bg-ink text-cream text-sm px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap"
          style={{ bottom: `calc(${NAV_OFFSET} + 0.75rem)` }}
        >
          ✓ {message}
        </div>
      )}

      {itemCount > 0 && !drawerOpen && (
        <div className="fixed inset-x-0 z-10 px-4 pointer-events-none" style={{ bottom: `calc(${NAV_OFFSET} + 0.625rem)` }}>
          <div className="row-in pointer-events-auto max-w-2xl mx-auto bg-ochre rounded-2xl flex items-stretch overflow-hidden shadow-[0_12px_28px_-10px_var(--color-ochre)]">
            <button onClick={() => setDrawerOpen(true)} className="px-4 py-3 text-left border-r border-white/25 min-w-0">
              <span className="block text-[10px] uppercase tracking-widest opacity-80">Panier</span>
              <span className="font-medium text-sm">
                {itemCount} article{itemCount > 1 ? "s" : ""}
              </span>
            </button>
            <button
              onClick={handleCheckout}
              disabled={pending}
              className="flex-1 min-w-0 px-4 py-3 text-right font-medium disabled:opacity-70 truncate"
            >
              {pending ? "…" : `Encaisser · ${fmt(total, currency)}`}
            </button>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Panier">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <div className="sheet-up relative bg-card rounded-t-3xl border-t border-line max-h-[80vh] flex flex-col max-w-2xl w-full mx-auto">
            <div className="pt-2.5 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-line" />
            </div>
            <div className="px-5 pt-3 pb-3 flex items-center justify-between">
              <p className="font-display font-semibold text-lg">Panier</p>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-sm h-9 px-2">
                Fermer
              </button>
            </div>

            <div className="overflow-y-auto px-5 flex-1 border-t border-line">
              {cartLines.length === 0 && <p className="text-sm text-muted text-center py-8">Panier vide.</p>}
              {cartLines.map(({ product, qty }) => (
                <div key={product.id} className="py-3.5 border-b border-line last:border-0">
                  <div className="flex items-baseline justify-between gap-3 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="font-mono text-sm shrink-0">{fmt(product.price * qty, currency)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-3">
                    <p className="text-xs text-muted font-mono">
                      {fmt(product.price, currency)} × {qty}
                    </p>
                    <div className="flex items-center gap-3">
                      <Stepper qty={qty} onChange={(q) => setQty(product.id, q)} size="sm" />
                      <button onClick={() => setQty(product.id, 0)} className="text-red text-xs" aria-label="Retirer du panier">
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-line">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted">Total</span>
                <span className="font-mono text-xl font-medium">{fmt(total, currency)}</span>
              </div>
              <button onClick={handleCheckout} disabled={pending || itemCount === 0} className={primaryBtn}>
                {pending ? "Enregistrement…" : "Encaisser"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
