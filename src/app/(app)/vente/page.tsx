import { requireUserAndBusiness } from "@/lib/data";
import { hasProducts, hasServices } from "@/lib/niches";
import { todayKey, fmt, dayLabelFr, groupByDay } from "@/lib/format";
import VenteClient from "@/components/VenteClient";
import RdvClient from "@/components/RdvClient";
import ManualSaleForm from "@/components/ManualSaleForm";
import SaleRow from "@/components/SaleRow";
import { Card, EmptyState, Icon, PageHeader, SectionHeader } from "@/components/ui";
import type { Product, ServiceItem, AppointmentSlot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VentePage() {
  const { supabase, business } = await requireUserAndBusiness();
  const showProducts = hasProducts(business.type);
  const showServices = hasServices(business.type);

  // All four lookups are independent, so they run together.
  const [{ data: products }, { data: services }, { data: slots }, { data: recentSales }] = await Promise.all([
    showProducts
      ? supabase.from("products").select("*").eq("business_id", business.id).order("category").returns<Product[]>()
      : Promise.resolve({ data: [] as Product[] }),
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
      .limit(20),
  ]);

  const days = groupByDay(recentSales || [], (s) => s.sale_date);

  return (
    <div>
      <PageHeader
        eyebrow={showProducts ? "Nouvelle vente" : "Rendez-vous"}
        title={showProducts ? "Encaisser" : "Agenda du jour"}
        subtitle={business.name}
      />

      {showProducts && (products?.length ?? 0) > 0 && (
        <VenteClient products={products!} currency={business.currency} trackStock={business.track_stock} />
      )}
      {showProducts && (products?.length ?? 0) === 0 && (
        <Card className="mb-6">
          <EmptyState
            icon={<Icon name="box" size={20} />}
            title="Aucun produit au catalogue"
            hint="Ajoutez vos produits depuis l'onglet Catalogue pour commencer à vendre."
          />
        </Card>
      )}

      {showServices && <RdvClient services={services || []} takenSlots={slots || []} currency={business.currency} />}

      <ManualSaleForm currency={business.currency} />

      <SectionHeader title="Ventes récentes" aside={recentSales?.length ? `${recentSales.length} dernières` : undefined} />
      {days.length === 0 ? (
        <Card>
          <EmptyState icon={<Icon name="sales" size={20} />} title="Aucune vente enregistrée" />
        </Card>
      ) : (
        <div className="space-y-5">
          {days.map((d) => (
            <section key={d.date}>
              <div className="flex items-baseline justify-between px-1 mb-2 gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted capitalize">{dayLabelFr(d.date)}</p>
                <p className="font-mono text-xs text-muted shrink-0">
                  {fmt(d.rows.reduce((n, s) => n + s.total, 0), business.currency)}
                </p>
              </div>
              <div className="space-y-2">
                {d.rows.map((s) => (
                  <SaleRow key={s.id} sale={s} currency={business.currency} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
