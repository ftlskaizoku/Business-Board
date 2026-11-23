import { requireUserAndBusiness } from "@/lib/data";
import { fmt } from "@/lib/format";
import { Card, Field, PageHeader, SectionHeader, primaryBtn } from "@/components/ui";
import ClientsList, { type ClientItem } from "@/components/ClientsList";
import { addCustomer } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, visits, total_spend")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .returns<ClientItem[]>();

  const clients = data || [];
  const totalSpend = clients.reduce((n, c) => n + c.total_spend, 0);
  const visits = clients.reduce((n, c) => n + c.visits, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Clients"
        title="Votre clientèle"
        subtitle={`${clients.length} client${clients.length > 1 ? "s" : ""} enregistré${clients.length > 1 ? "s" : ""}`}
      />

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:items-start">
      {clients.length > 0 && (
        <Card className="!p-0 overflow-hidden mb-3 lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="p-3.5 min-w-0">
              <p className="text-[11px] text-muted">Total dépensé</p>
              <p className="font-mono text-[15px] font-medium mt-1 break-words">{fmt(totalSpend, business.currency)}</p>
            </div>
            <div className="p-3.5 min-w-0">
              <p className="text-[11px] text-muted">Visites</p>
              <p className="font-mono text-[15px] font-medium mt-1">{visits}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-8">
        <p className="font-display font-semibold mb-4">Nouveau client</p>
        <form action={addCustomer} className="space-y-4">
          <Field label="Nom">
            <input name="name" placeholder="ex. Awa Diop" required autoComplete="off" className="field" />
          </Field>
          <Field label="Téléphone (optionnel)">
            <input name="phone" type="tel" inputMode="tel" placeholder="77 000 00 00" autoComplete="off" className="field font-mono" />
          </Field>
          <button type="submit" className={primaryBtn}>
            Ajouter le client
          </button>
        </form>
      </Card>

      <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2 min-w-0">
        <SectionHeader title="Liste" aside={clients.length || undefined} />
        <ClientsList clients={clients} currency={business.currency} />
      </div>
      </div>
    </div>
  );
}
