import { requireUserAndBusiness } from "@/lib/data";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { fmt, dayLabelFr, groupByDay } from "@/lib/format";
import { Card, EmptyState, Icon, PageHeader, SectionHeader } from "@/components/ui";
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
      .limit(30),
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

  const days = groupByDay(expenses || [], (e) => e.expense_date);

  return (
    <div>
      <PageHeader eyebrow="Dépenses" title="Où part l'argent" subtitle={business.name} />

      <Card data-tour="depenses-form">
        <p className="font-display font-semibold mb-4">Nouvelle dépense</p>
        <ExpenseForm currency={business.currency} history={history} defaults={EXPENSE_CATEGORIES} />
      </Card>

      <SectionHeader title="Récentes" aside={expenses?.length ? `${expenses.length} dernières` : undefined} />
      {days.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon name="expense" size={20} />}
            title="Aucune dépense enregistrée"
            hint="Notez vos achats et charges pour connaître votre vrai bénéfice."
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {days.map((d) => (
            <section key={d.date}>
              <div className="flex items-baseline justify-between px-1 mb-2 gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted capitalize">{dayLabelFr(d.date)}</p>
                <p className="font-mono text-xs text-muted shrink-0">
                  −{fmt(d.rows.reduce((n, e) => n + e.amount, 0), business.currency)}
                </p>
              </div>
              <div className="space-y-2">
                {d.rows.map((e) => (
                  <ExpenseRow key={e.id} expense={e} currency={business.currency} suggestions={history} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
