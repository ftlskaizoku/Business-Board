import { requireUserAndBusiness } from "@/lib/data";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/types";
import ExpensesBrowser from "@/components/ExpensesBrowser";

export const dynamic = "force-dynamic";

export default async function DepensesPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("business_id", business.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000)
    .returns<Expense[]>();
  const expenses = data || [];

  // Every expense name this business has used, most used first — becomes the
  // tap-to-reuse list in the form. Names are compared ignoring case.
  const stats = new Map<string, { name: string; count: number; order: number }>();
  expenses.slice(0, 300).forEach((e, i) => {
    const name = String(e.category || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    const cur = stats.get(key);
    if (cur) cur.count += 1;
    else stats.set(key, { name, count: 1, order: i });
  });
  const history = [...stats.values()].sort((a, b) => b.count - a.count || a.order - b.order).map((s) => s.name);

  return (
    <ExpensesBrowser
      expenses={expenses}
      currency={business.currency}
      history={history}
      defaults={EXPENSE_CATEGORIES}
      businessName={business.name}
    />
  );
}
