import { requireUserAndBusiness } from "@/lib/data";
import { hasProducts, hasServices } from "@/lib/niches";
import { todayKey, fmt, daysAgoKey } from "@/lib/format";
import VenteClient from "@/components/VenteClient";
import RdvClient from "@/components/RdvClient";
import SalesHistory from "@/components/SalesHistory";
import VenteTabs, { type VenteTab } from "@/components/VenteTabs";
import { Card, EmptyState, Icon, PageHeader } from "@/components/ui";
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
      .gte("sale_date", daysAgoKey(89))
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(400),
  ]);

  const today = todayKey();
  const todaySales = (recentSales || []).filter((s) => s.sale_date === today);
  const todayTotal = todaySales.reduce((n, s) => n + s.total, 0);

  const caisse = (
    <>
      {(products?.length ?? 0) > 0 ? (
        <VenteClient products={products!} currency={business.currency} trackStock={business.track_stock} />
      ) : (
        <Card>
          <EmptyState
            icon={<Icon name="box" size={20} />}
            title="Aucun produit au catalogue"
            hint="Ajoutez vos produits depuis l'onglet Catalogue pour commencer à vendre."
          />
        </Card>
      )}
    </>
  );

  const agenda = (
    <div className="lg:max-w-3xl">
      <RdvClient services={services || []} takenSlots={slots || []} currency={business.currency} />
    </div>
  );

  const historique = (
    <div className="lg:max-w-3xl">
      <SalesHistory sales={recentSales || []} currency={business.currency} />
    </div>
  );

  const tabs: VenteTab[] = [];
  if (showProducts) tabs.push({ id: "caisse", label: "Encaisser", panel: caisse });
  if (showServices) tabs.push({ id: "agenda", label: "Rendez-vous", panel: agenda });
  tabs.push({ id: "historique", label: "Historique", panel: historique });

  return (
    <div>
      <PageHeader
        eyebrow={showProducts ? "Vente" : "Rendez-vous"}
        title={showProducts ? "Caisse" : "Agenda du jour"}
        subtitle={
          todaySales.length > 0 ? (
            <>
              Aujourd&apos;hui : <span className="font-mono text-ink">{fmt(todayTotal, business.currency)}</span> ·{" "}
              {todaySales.length} vente{todaySales.length > 1 ? "s" : ""}
            </>
          ) : (
            business.name
          )
        }
      />
      <VenteTabs tabs={tabs} />
    </div>
  );
}
