"use client";

import { useMemo, useState, useTransition } from "react";
import { fmt } from "@/lib/format";
import { checkout } from "@/app/(app)/actions";
import { primaryBtn } from "@/components/ui";
import type { Product } from "@/lib/types";

const NAV_OFFSET = "var(--bb-nav)";

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
  const [filterOpen, setFilterOpen] = useState(false);

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

  const cartRows = (
    <>
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
    </>
  );

  return (
    <div className={`lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:items-start ${itemCount > 0 ? "pb-24 lg:pb-0" : ""}`} data-tour="vente-grid">
      <div className="min-w-0">
      {(products.length > 6 || categories.length > 1) && (
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1 min-w-0">
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
          {categories.length > 1 && (
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label="Filtrer par catégorie"
              className={`lg:hidden relative shrink-0 w-11 h-11 rounded-[14px] border flex items-center justify-center transition-colors ${
                category ? "bg-ochre border-ochre" : "bg-card border-line text-ink"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
            </button>
          )}
        </div>
      )}

      {category && (
        <button
          type="button"
          onClick={() => setCategory(null)}
          className="lg:hidden row-in mb-3 inline-flex items-center gap-1.5 h-8 pl-3 pr-2.5 rounded-full bg-ochre-soft text-ochre text-xs font-medium max-w-full"
        >
          <span className="truncate">{category}</span>
          <span aria-hidden>✕</span>
          <span className="sr-only">Retirer le filtre</span>
        </button>
      )}

      {categories.length > 1 && (
        <div className="hidden lg:flex flex-wrap gap-2 mb-4">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors ${
                category === c ? "bg-ink text-cream border-ink" : "bg-card text-muted border-line hover:text-ink"
              }`}
            >
              {c ?? "Tout"}
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 && <p className="text-sm text-muted text-center py-10">Aucun produit ne correspond.</p>}

      <div className="lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-2.5">
      {groups.map((g) => (
        <section key={g.category} className="mb-5 lg:mb-0 lg:contents">
          {(categories.length > 1 && !category) && (
            <h2 className="lg:hidden text-xs font-medium uppercase tracking-wider text-muted mb-2 px-1">{g.category}</h2>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:contents">
            {g.items.map((p) => {
              const inCart = cart[p.id] || 0;
              const soldOut = trackStock && p.stock <= 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 bg-card border rounded-2xl card-surface pl-3.5 pr-2.5 py-2.5 min-w-0 transition-colors ${
                    inCart > 0 ? "border-ochre" : "border-line"
                  } ${soldOut ? "opacity-60" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setQty(p.id, inCart + 1)}
                    disabled={soldOut}
                    className="flex-1 min-w-0 text-left py-0.5"
                  >
                    {categories.length > 1 && (
                      <span className="hidden lg:block text-[10px] uppercase tracking-wider text-muted mb-0.5 truncate">{p.category}</span>
                    )}
                    <span className="block text-sm font-medium leading-snug line-clamp-2 break-words">{p.name}</span>
                    <span className="block font-mono text-xs text-muted mt-0.5 truncate">
                      {fmt(p.price, currency)}
                      {trackStock && (
                        <span className={p.stock < 5 ? "text-red" : ""}>
                          {" · "}
                          {soldOut ? "Rupture" : `${p.stock} en stock`}
                        </span>
                      )}
                    </span>
                  </button>
                  {inCart === 0 ? (
                    <button
                      type="button"
                      onClick={() => setQty(p.id, 1)}
                      disabled={soldOut}
                      aria-label={`Ajouter ${p.name}`}
                      className="shrink-0 w-10 h-10 rounded-full bg-ochre-soft text-ochre text-xl leading-none flex items-center justify-center disabled:opacity-40"
                    >
                      +
                    </button>
                  ) : (
                    <>
                      <span className="lg:hidden"><Stepper qty={inCart} onChange={(q) => setQty(p.id, q)} size="sm" /></span>
                      <button
                        type="button"
                        onClick={() => setQty(p.id, inCart + 1)}
                        aria-label={`Ajouter un autre ${p.name}`}
                        className="hidden lg:flex shrink-0 h-10 min-w-10 px-2.5 rounded-full bg-ochre font-mono text-sm font-medium items-center justify-center"
                      >
                        ×{inCart}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      </div>
      </div>

      {/* Desktop: the basket stays in view next to the products. */}
      <aside className="hidden lg:block sticky top-8" aria-label="Panier">
        <div className="bg-card border border-line rounded-[20px] card-surface overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-line">
            <p className="font-display font-semibold text-lg">Panier</p>
            <span className="font-mono text-xs text-muted">{itemCount} article{itemCount > 1 ? "s" : ""}</span>
          </div>
          <div className="px-5 max-h-[52vh] overflow-y-auto">
            {cartLines.length === 0 ? (
              <p className="text-sm text-muted text-center py-10 [text-wrap:balance]">Touchez un produit pour l&apos;ajouter à la vente.</p>
            ) : (
              cartRows
            )}
          </div>
          <div className="px-5 py-4 border-t border-line">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">Total</span>
              <span className="font-mono text-xl font-medium">{fmt(total, currency)}</span>
            </div>
            <button onClick={handleCheckout} disabled={pending || itemCount === 0} className={primaryBtn}>
              {pending ? "Enregistrement…" : "Encaisser"}
            </button>
          </div>
        </div>
      </aside>

      {filterOpen && (
        <div className="sheet-root fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Filtrer par catégorie">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setFilterOpen(false)} />
          <div className="sheet-up sheet-panel relative bg-card rounded-t-3xl border-t border-line max-w-2xl w-full mx-auto max-h-[70vh] flex flex-col">
            <div className="pt-2.5 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-line" />
            </div>
            <div className="px-5 pt-3 pb-3 flex items-center justify-between">
              <p className="font-display font-semibold text-lg">Catégorie</p>
              <button onClick={() => setFilterOpen(false)} className="text-muted text-sm h-9 px-2">
                Fermer
              </button>
            </div>
            <ul className="overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-line pt-2">
              {[null, ...categories].map((c) => {
                const selected = category === c;
                const count = c ? products.filter((p) => p.category === c).length : products.length;
                return (
                  <li key={c ?? "all"}>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(c);
                        setFilterOpen(false);
                      }}
                      aria-pressed={selected}
                      className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl text-left ${selected ? "bg-ochre-soft" : ""}`}
                    >
                      <span className={`flex-1 min-w-0 truncate text-sm ${selected ? "font-semibold text-ochre" : "font-medium"}`}>
                        {c ?? "Toutes les catégories"}
                      </span>
                      <span className="font-mono text-xs text-muted shrink-0">{count}</span>
                      {selected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-ochre shrink-0" aria-hidden="true">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="toast-in fixed left-1/2 lg:left-[calc(50%+8rem)] z-30 bg-ink text-cream text-sm px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap"
          style={{ bottom: `calc(${NAV_OFFSET} + 0.75rem)` }}
        >
          ✓ {message}
        </div>
      )}

      {itemCount > 0 && !drawerOpen && (
        <div className="lg:hidden fixed inset-x-0 z-10 px-4 pointer-events-none" style={{ bottom: `calc(${NAV_OFFSET} + 0.625rem)` }}>
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
        <div className="lg:hidden sheet-root fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Panier">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <div className="sheet-up sheet-panel relative bg-card rounded-t-3xl border-t border-line max-h-[80vh] flex flex-col max-w-2xl w-full mx-auto">
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
              {cartRows}
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
