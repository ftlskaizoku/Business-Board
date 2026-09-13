import { requireUserAndBusiness } from "@/lib/data";
import { hasProducts, hasServices } from "@/lib/niches";
import { todayKey } from "@/lib/format";
import VenteClient from "@/components/VenteClient";
import RdvClient from "@/components/RdvClient";
import ManualSaleForm from "@/components/ManualSaleForm";
import type { Product, ServiceItem, AppointmentSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VentePage() {
  const { supabase, business } = await requireUserAndBusiness();
  const showProducts = hasProducts(business.type);
  const showServices = hasServices(business.type);

  let productsQuery = supabase.from("products").select("*").eq("business_id", business.id).order("category");
  // Only businesses that track stock need to hide sold-out products —
  // e.g. a restaurant's dishes aren't backed by a countable stock.
  if (business.track_stock) productsQuery = productsQuery.gt("stock", 0);

  const [{ data: products }, { data: services }, { data: slots }] = await Promise.all([
    showProducts ? productsQuery.returns<Product[]>() : Promise.resolve({ data: [] as Product[] }),
    showServices
      ? supabase.from("services").select("*").eq("business_id", business.id).returns<ServiceItem[]>()
      : Promise.resolve({ data: [] as ServiceItem[] }),
    showServices
      ? supabase
          .from("appointment_slots")
          .select("*")
          .eq("business_id", business.id)
          .eq("slot_date", todayKey())
          .eq("status", "taken")
          .returns<AppointmentSlot[]>()
      : Promise.resolve({ data: [] as AppointmentSlot[] }),
  ]);

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">
        {showProducts ? "Nouvelle vente" : "Rendez-vous"}
      </p>
      <h1 className="font-display text-2xl font-semibold mb-5">{business.name}</h1>

      {showProducts && (products?.length ?? 0) > 0 && (
        <VenteClient products={products!} currency={business.currency} trackStock={business.track_stock} />
      )}
      {showProducts && (products?.length ?? 0) === 0 && (
        <p className="text-sm text-muted mb-6">
          Aucun produit au catalogue. Ajoutez-en depuis l&apos;onglet Catalogue.
        </p>
      )}

      {showServices && <RdvClient services={services || []} takenSlots={slots || []} currency={business.currency} />}

      <ManualSaleForm currency={business.currency} />
    </div>
  );
}
