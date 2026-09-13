import { requireUserAndBusiness } from "@/lib/data";
import { fmt } from "@/lib/format";
import { hasProducts, hasServices } from "@/lib/niches";
import { Card, EyebrowLabel } from "@/components/ui";
import { addProduct, deleteProduct, addService, deleteService, setTrackStock } from "../actions";
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

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Catalogue</p>
      <h1 className="font-display text-2xl font-semibold mb-5">
        {(products?.length ?? 0)} produits · {(services?.length ?? 0)} services
      </h1>

      {showProducts && (
        <>
          <Card className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Suivi du stock</p>
                <p className="text-xs text-muted mt-0.5">
                  {business.track_stock
                    ? "Chaque vente diminue le stock du produit."
                    : "Désactivé — utile pour un restaurant où les plats ne sont pas comptés en stock."}
                </p>
              </div>
              <form action={setTrackStock.bind(null, !business.track_stock)}>
                <button
                  type="submit"
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${
                    business.track_stock ? "bg-green-soft text-green" : "bg-line text-muted"
                  }`}
                >
                  {business.track_stock ? "Activé" : "Désactivé"}
                </button>
              </form>
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-widest text-muted mb-3">Nouveau produit</p>
            <form action={addProduct} className="space-y-3">
              <input name="name" placeholder="Nom" required className="w-full border border-line rounded-lg px-3 py-2 bg-cream" />
              <input name="category" placeholder="Catégorie (ex. Plats)" className="w-full border border-line rounded-lg px-3 py-2 bg-cream" />
              <div className="flex gap-3">
                <input
                  name="price"
                  type="number"
                  placeholder={`Prix (${business.currency})`}
                  required
                  className={business.track_stock ? "w-1/2 border border-line rounded-lg px-3 py-2 bg-cream" : "w-full border border-line rounded-lg px-3 py-2 bg-cream"}
                />
                {business.track_stock && (
                  <input name="stock" type="number" placeholder="Stock initial" className="w-1/2 border border-line rounded-lg px-3 py-2 bg-cream" />
                )}
              </div>
              <button type="submit" className="w-full bg-ochre text-white rounded-lg py-2.5 font-medium">
                Ajouter au catalogue
              </button>
            </form>
          </Card>

          {groupByCat(products || []).map((g) => (
            <div key={g.category}>
              <EyebrowLabel>{g.category}</EyebrowLabel>
              <div className="space-y-2">
                {g.items.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-card border border-line rounded-xl px-3.5 py-2.5">
                    <div>
                      <p className="text-sm">{p.name}</p>
                      <p className="text-xs text-muted">{p.category} · {fmt(p.price, business.currency)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {business.track_stock && (
                        <span className={`text-xs px-2 py-1 rounded-full ${p.stock < 5 ? "bg-red-soft text-red" : "bg-green-soft text-green"}`}>
                          {p.stock <= 0 ? "Rupture" : `${p.stock} en stock`}
                        </span>
                      )}
                      <form action={deleteProduct.bind(null, p.id)}>
                        <button className="text-muted px-1">✕</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {showServices && (
        <>
          <div className="mt-8">
            <Card>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">Nouveau service</p>
              <form action={addService} className="space-y-3">
                <input name="name" placeholder="Nom" required className="w-full border border-line rounded-lg px-3 py-2 bg-cream" />
                <input name="category" placeholder="Catégorie (ex. Coiffure)" className="w-full border border-line rounded-lg px-3 py-2 bg-cream" />
                <div className="flex gap-3">
                  <input name="duration" placeholder="Durée (ex. 45 min)" className="w-1/2 border border-line rounded-lg px-3 py-2 bg-cream" />
                  <input name="price" type="number" placeholder={`Prix (${business.currency})`} required className="w-1/2 border border-line rounded-lg px-3 py-2 bg-cream" />
                </div>
                <button type="submit" className="w-full bg-ochre text-white rounded-lg py-2.5 font-medium">
                  Ajouter au catalogue
                </button>
              </form>
            </Card>
          </div>

          {groupByCat(services || []).map((g) => (
            <div key={g.category}>
              <EyebrowLabel>{g.category}</EyebrowLabel>
              <div className="space-y-2">
                {g.items.map((s) => (
                  <div key={s.id} className="flex justify-between items-center bg-card border border-line rounded-xl px-3.5 py-2.5">
                    <div>
                      <p className="text-sm">{s.name}</p>
                      <p className="text-xs text-muted">{fmt(s.price, business.currency)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-soft text-indigo">{s.duration}</span>
                      <form action={deleteService.bind(null, s.id)}>
                        <button className="text-muted px-1">✕</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
