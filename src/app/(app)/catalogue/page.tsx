import { requireUserAndBusiness } from "@/lib/data";
import { fmt } from "@/lib/format";
import { hasProducts, hasServices } from "@/lib/niches";
import { Card, EmptyState, Field, Icon, PageHeader, SectionHeader, primaryBtn } from "@/components/ui";
import { addProduct, addService, deleteService } from "../actions";
import ProductRow from "@/components/ProductRow";
import TrackStockToggle from "@/components/TrackStockToggle";
import type { Product, ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function groupByCat<T extends { category: string }>(items: T[]) {
  const cats = [...new Set(items.map((x) => x.category))];
  return cats.map((category) => ({ category, items: items.filter((x) => x.category === category) }));
}

export default async function CataloguePage() {
  const { supabase, business } = await requireUserAndBusiness();
  const showProducts = hasProducts(business.type);
  const showServices = hasServices(business.type);

  const [{ data: products }, { data: services }] = await Promise.all([
    showProducts
      ? supabase.from("products").select("*").eq("business_id", business.id).order("category").returns<Product[]>()
      : Promise.resolve({ data: [] as Product[] }),
    showServices
      ? supabase.from("services").select("*").eq("business_id", business.id).order("category").returns<ServiceItem[]>()
      : Promise.resolve({ data: [] as ServiceItem[] }),
  ]);

  const parts = [
    showProducts ? `${products?.length ?? 0} produit${(products?.length ?? 0) > 1 ? "s" : ""}` : null,
    showServices ? `${services?.length ?? 0} service${(services?.length ?? 0) > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  return (
    <div>
      <PageHeader eyebrow="Catalogue" title="Ce que vous vendez" subtitle={parts.join(" · ")} />

      {showProducts && (
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:items-start">
          <div className="lg:col-span-5 lg:order-2 lg:sticky lg:top-8">
          <Card>
            <TrackStockToggle initial={business.track_stock} />
          </Card>

          <Card className="mt-3" data-tour="catalogue-form">
            <p className="font-display font-semibold mb-4">Nouveau produit</p>
            <form action={addProduct} className="space-y-4">
              <Field label="Nom">
                <input name="name" placeholder="ex. Thieboudienne" required className="field" />
              </Field>
              <Field label="Catégorie" hint="Regroupe les produits sur l'écran de vente.">
                <input name="category" placeholder="ex. Plats" className="field" />
              </Field>
              <div className={`grid gap-3 ${business.track_stock ? "grid-cols-2" : "grid-cols-1"}`}>
                <Field label={`Prix (${business.currency})`}>
                  <input name="price" type="number" inputMode="numeric" min={0} placeholder="2500" required className="field font-mono" />
                </Field>
                {business.track_stock && (
                  <Field label="Stock initial">
                    <input name="stock" type="number" inputMode="numeric" min={0} placeholder="20" className="field font-mono" />
                  </Field>
                )}
              </div>
              <button type="submit" className={primaryBtn}>
                Ajouter au catalogue
              </button>
            </form>
          </Card>
          </div>

          <div className="lg:col-span-7 lg:order-1 min-w-0 lg:-mt-8">
          {(products?.length ?? 0) === 0 ? (
            <Card className="mt-6 lg:mt-8">
              <EmptyState
                icon={<Icon name="box" size={20} />}
                title="Votre catalogue est vide"
                hint="Ajoutez un premier produit pour pouvoir l'encaisser."
              />
            </Card>
          ) : (
            groupByCat(products || []).map((g) => (
              <section key={g.category}>
                <SectionHeader title={g.category} aside={g.items.length} />
                <div className="space-y-2">
                  {g.items.map((p) => (
                    <ProductRow key={p.id} product={p} currency={business.currency} trackStock={business.track_stock} />
                  ))}
                </div>
              </section>
            ))
          )}
          </div>
        </div>
      )}

      {showServices && (
        <div className={`lg:grid lg:grid-cols-12 lg:gap-x-8 lg:items-start ${showProducts ? "mt-10" : ""}`}>
          <div className="lg:col-span-5 lg:order-2 lg:sticky lg:top-8">
          <Card data-tour="catalogue-form">
            <p className="font-display font-semibold mb-4">Nouveau service</p>
            <form action={addService} className="space-y-4">
              <Field label="Nom">
                <input name="name" placeholder="ex. Coupe + brushing" required className="field" />
              </Field>
              <Field label="Catégorie">
                <input name="category" placeholder="ex. Coiffure" className="field" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Durée">
                  <input name="duration" placeholder="45 min" className="field" />
                </Field>
                <Field label={`Prix (${business.currency})`}>
                  <input name="price" type="number" inputMode="numeric" min={0} placeholder="5000" required className="field font-mono" />
                </Field>
              </div>
              <button type="submit" className={primaryBtn}>
                Ajouter au catalogue
              </button>
            </form>
          </Card>
          </div>

          <div className="lg:col-span-7 lg:order-1 min-w-0 lg:-mt-8">
          {groupByCat(services || []).map((g) => (
            <section key={g.category}>
              <SectionHeader title={g.category} aside={g.items.length} />
              <div className="space-y-2">
                {g.items.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-card border border-line rounded-2xl card-surface px-3.5 py-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="font-mono text-xs text-muted mt-0.5 truncate">{fmt(s.price, business.currency)}</p>
                    </div>
                    {s.duration && (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-soft text-indigo whitespace-nowrap shrink-0">
                        {s.duration}
                      </span>
                    )}
                    <form action={deleteService.bind(null, s.id)} className="-mr-1.5 shrink-0">
                      <button className="w-9 h-9 flex items-center justify-center text-muted" aria-label={`Supprimer ${s.name}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
                        </svg>
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
