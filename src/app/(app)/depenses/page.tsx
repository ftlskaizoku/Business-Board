import { requireUserAndBusiness } from "@/lib/data";
import { todayKey } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { Card, EyebrowLabel, EmptyNote } from "@/components/ui";
import ExpenseRow from "@/components/ExpenseRow";
import { addExpense } from "../actions";

export const dynamic = "force-dynamic";

export default async function DepensesPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("business_id", business.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Dépenses</p>
      <h1 className="font-display text-2xl font-semibold mb-5">{business.name}</h1>

      <Card>
        <p className="text-xs uppercase tracking-widest text-muted mb-3">Nouvelle dépense</p>
        <form action={addExpense} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">Date</label>
            <input
              name="date"
              type="date"
              defaultValue={todayKey()}
              max={todayKey()}
              required
              className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Catégorie</label>
            <select name="category" className="w-full border border-line rounded-lg px-3 py-2 bg-cream">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Montant ({business.currency})</label>
            <input
              name="amount"
              type="number"
              required
              placeholder="5000"
              className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Note (optionnel)</label>
            <input
              name="note"
              placeholder="Fournisseur, détail…"
              className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
            />
          </div>
          <button type="submit" className="w-full bg-ochre text-white rounded-lg py-2.5 font-medium">
            Enregistrer la dépense
          </button>
        </form>
      </Card>

      <EyebrowLabel>Récentes</EyebrowLabel>
      {!expenses || expenses.length === 0 ? (
        <EmptyNote>Aucune dépense enregistrée.</EmptyNote>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} currency={business.currency} />
          ))}
        </div>
      )}
    </div>
  );
}
