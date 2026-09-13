"use client";

import { useState, useTransition } from "react";
import { fmt } from "@/lib/format";
import { checkout } from "@/app/(app)/actions";
import type { Product } from "@/lib/types";

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

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  function addToCart(p: Product) {
    setCart((c) => {
      const current = c[p.id] || 0;
      if (trackStock && current >= p.stock) return c;
      return { ...c, [p.id]: current + 1 };
    });
  }

  function setQty(p: Product, qty: number) {
    const clamped = trackStock ? Math.max(0, Math.min(qty, p.stock)) : Math.max(0, qty);
    setCart((c) => {
      if (clamped <= 0) {
        const next = { ...c };
        delete next[p.id];
        return next;
      }
      return { ...c, [p.id]: clamped };
    });
  }

  function removeFromCart(productId: string) {
    setCart((c) => {
      const next = { ...c };
      delete next[productId];
      return next;
    });
  }

  function handleCheckout() {
    const items = Object.entries(cart).map(([productId, qty]) => ({ productId, qty }));
    startTransition(async () => {
      await checkout(items);
      setCart({});
      setDrawerOpen(false);
      setMessage(`Vente enregistrée · ${fmt(total, currency)}`);
      setTimeout(() => setMessage(null), 2000);
    });
  }

  const groups = [...new Set(products.map((p) => p.category))].map((category) => ({
    category,
    items: products.filter((p) => p.category === category),
  }));

  const cartLines = Object.entries(cart)
    .map(([productId, qty]) => {
      const p = products.find((x) => x.id === productId);
      if (!p) return null;
      return { product: p, qty };
    })
    .filter((l): l is { product: Product; qty: number } => !!l);

  return (
    <div className="pb-20">
      {groups.map((g) => (
        <div key={g.category} className="mb-5">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">{g.category}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {g.items.map((p) => {
              const inCart = cart[p.id] || 0;
              const disabled = trackStock && inCart >= p.stock;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={disabled}
                  className="text-left bg-card border border-line rounded-xl p-3 disabled:opacity-40 relative"
                >
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted mt-0.5">{fmt(p.price, currency)}</p>
                  {inCart > 0 && (
                    <span className="absolute top-2 right-2 bg-ochre text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {inCart}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {message && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-ink text-white text-xs px-4 py-2 rounded-full z-30">
          {message}
        </div>
      )}

      {itemCount > 0 && !drawerOpen && (
        <div className="fixed bottom-16 left-0 right-0 bg-ochre text-white flex items-stretch z-10">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 py-3.5 px-6 text-left border-r border-white/25"
          >
            <span className="block text-[10px] uppercase tracking-widest opacity-80">Modifier</span>
            <span className="font-medium">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </span>
          </button>
          <button
            onClick={handleCheckout}
            disabled={pending}
            className="flex-1 py-3.5 px-6 text-right font-medium disabled:opacity-70"
          >
            {pending ? "…" : `Encaisser · ${fmt(total, currency)}`}
          </button>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-20 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative bg-card rounded-t-2xl border-t border-line max-h-[75vh] flex flex-col">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-line">
              <p className="font-display font-semibold">Panier</p>
              <button onClick={() => setDrawerOpen(false)} className="text-muted text-sm">
                Fermer
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-3 flex-1">
              {cartLines.length === 0 && (
                <p className="text-sm text-muted text-center py-6">Panier vide.</p>
              )}
              {cartLines.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b border-line last:border-0">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {fmt(product.price, currency)} × {qty} = {fmt(product.price * qty, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setQty(product, qty - 1)}
                      className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-lg leading-none"
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={trackStock ? product.stock : undefined}
                      value={qty}
                      onChange={(e) => setQty(product, Number(e.target.value) || 0)}
                      className="w-12 text-center border border-line rounded-lg py-1 bg-cream font-mono text-sm outline-none focus:border-ochre"
                    />
                    <button
                      onClick={() => setQty(product, qty + 1)}
                      disabled={trackStock && qty >= product.stock}
                      className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-lg leading-none disabled:opacity-30"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-red text-xs ml-1"
                      aria-label="Retirer du panier"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-line">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted">Total</span>
                <span className="font-mono text-lg font-medium">{fmt(total, currency)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={pending || itemCount === 0}
                className="w-full bg-ochre text-white rounded-lg py-3 font-medium disabled:opacity-40"
              >
                {pending ? "…" : "Encaisser"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
