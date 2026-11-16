import { requireUserAndBusiness } from "@/lib/data";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { Card, EyebrowLabel, EmptyNote } from "@/components/ui";
import ExpenseRow from "@/components/ExpenseRow";
import ExpenseForm from "@/components/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function DepensesPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const [{ data: expenses }, { data: nameRows }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("business_id", business.id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    // Every expense name this business has used, newest first — becomes the
    // tap-to-reuse list in the form. Names are compared ignoring case.
    supabase
      .from("expenses")
      .select("category")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const stats = new Map<string, { name: string; count: number; order: number }>();
  (nameRows || []).forEach((r, i) => {
    const name = String(r.category || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    const cur = stats.get(key);
    if (cur) cur.count += 1;
    else stats.set(key, { name, count: 1, order: i });
  });
  const history = [...stats.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .map((s) => s.name);

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Dépenses</p>
      <h1 className="font-display text-[26px] leading-tight font-semibold mb-5">{business.name}</h1>

      <Card data-tour="depenses-form">
        <p className="text-xs uppercase tracking-widest text-muted mb-3">Nouvelle dépense</p>
        <ExpenseForm currency={business.currency} history={history} defaults={EXPENSE_CATEGORIES} />
      </Card>

      <EyebrowLabel>Récentes</EyebrowLabel>
      {!expenses || expenses.length === 0 ? (
        <EmptyNote>Aucune dépense enregistrée.</EmptyNote>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} currency={business.currency} suggestions={history} />
          ))}
        </div>
      )}
    </div>
  );
}
