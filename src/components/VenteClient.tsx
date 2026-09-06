"use client";

import { useState, useTransition } from "react";
import { fmt } from "@/lib/format";
import { checkout } from "@/app/(app)/actions";
import type { Product } from "@/lib/types";

export default function VenteClient({ products, currency }: { products: Product[]; currency: string }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  function addToCart(p: Product) {
    setCart((c) => {
      const current = c[p.id] || 0;
      if (current >= p.stock) return c;
      return { ...c, [p.id]: current + 1 };
    });
  }

  function handleCheckout() {
    const items = Object.entries(cart).map(([productId, qty]) => ({ productId, qty }));
    startTransition(async () => {
      await checkout(items);
      setCart({});
      setMessage(`Vente enregistrée · ${fmt(total, currency)}`);
      setTimeout(() => setMessage(null), 2000);
    });
  }

  const groups = [...new Set(products.map((p) => p.category))].map((category) => ({
    category,
    items: products.filter((p) => p.category === category),
  }));

  return (
    <div className="pb-20">
      {groups.map((g) => (
        <div key={g.category} className="mb-5">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">{g.category}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {g.items.map((p) => {
              const inCart = cart[p.id] || 0;
              const disabled = inCart >= p.stock;
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-ink text-white text-xs px-4 py-2 rounded-full">
          {message}
        </div>
      )}

      {itemCount > 0 && (
        <button
          onClick={handleCheckout}
          disabled={pending}
          className="fixed bottom-16 left-0 right-0 bg-ochre text-white py-3.5 flex items-center justify-between px-6 font-medium disabled:opacity-70"
        >
          <span>{itemCount} article{itemCount > 1 ? "s" : ""}</span>
          <span>{pending ? "…" : `Encaisser · ${fmt(total, currency)}`}</span>
        </button>
      )}
    </div>
  );
}
