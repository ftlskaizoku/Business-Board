import { requireUserAndBusiness } from "@/lib/data";
import { hasProducts, hasServices } from "@/lib/niches";
import { todayKey } from "@/lib/format";
import VenteClient from "@/components/VenteClient";
import RdvClient from "@/components/RdvClient";
import ManualSaleForm from "@/components/ManualSaleForm";
import SaleRow from "@/components/SaleRow";
import { EyebrowLabel, EmptyNote } from "@/components/ui";
import type { Product, ServiceItem, AppointmentSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VentePage() {
  const { supabase, business } = await requireUserAndBusiness();
  const showProducts = hasProducts(business.type);
  const showServices = hasServices(business.type);

  const products = showProducts
    ? (
        await supabase
          .from("products")
          .select("*")
          .eq("business_id", business.id)
          .order("category")
          .returns<Product[]>()
      ).data
    : [];

  const [{ data: services }, { data: slots }, { data: recentSales }] = await Promise.all([
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
    supabase
      .from("sales")
      .select("id, sale_date, total, sale_items(id, name, qty, price)")
      .eq("business_id", business.id)
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15),
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

      <EyebrowLabel>Ventes récentes</EyebrowLabel>
      {!recentSales || recentSales.length === 0 ? (
        <EmptyNote>Aucune vente enregistrée.</EmptyNote>
      ) : (
        <div className="space-y-2">
          {recentSales.map((s) => (
            <SaleRow key={s.id} sale={s} currency={business.currency} />
          ))}
        </div>
      )}
    </div>
  );
}
