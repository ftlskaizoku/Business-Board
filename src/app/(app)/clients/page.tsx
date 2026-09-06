import { requireUserAndBusiness } from "@/lib/data";
import { fmt } from "@/lib/format";
import { Card, EmptyNote, EyebrowLabel } from "@/components/ui";
import { addCustomer } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Clients</p>
      <h1 className="font-display text-2xl font-semibold mb-5">
        {customers?.length ?? 0} client{(customers?.length ?? 0) > 1 ? "s" : ""} enregistré
        {(customers?.length ?? 0) > 1 ? "s" : ""}
      </h1>

      <Card>
        <p className="text-xs uppercase tracking-widest text-muted mb-3">Nouveau client</p>
        <form action={addCustomer} className="flex gap-2">
          <input name="name" placeholder="Nom" required className="flex-1 border border-line rounded-lg px-3 py-2 bg-cream" />
          <input name="phone" placeholder="Téléphone" className="flex-1 border border-line rounded-lg px-3 py-2 bg-cream" />
          <button type="submit" className="bg-ochre text-white rounded-lg px-4 font-medium">
            +
          </button>
        </form>
      </Card>

      <EyebrowLabel>Liste</EyebrowLabel>
      {!customers || customers.length === 0 ? (
        <EmptyNote>Aucun client enregistré pour l&apos;instant.</EmptyNote>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="flex justify-between items-center bg-card border border-line rounded-xl px-3.5 py-2.5">
              <div>
                <p className="text-sm">{c.name}</p>
                <p className="text-xs text-muted">{c.phone || "—"} · {c.visits} visite{c.visits > 1 ? "s" : ""}</p>
              </div>
              <span className="font-mono text-sm">{fmt(c.total_spend, business.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
