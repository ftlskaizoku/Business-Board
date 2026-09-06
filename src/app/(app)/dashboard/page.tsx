import { requireUserAndBusiness } from "@/lib/data";
import { fmt, todayKey, daysAgoKey } from "@/lib/format";
import { Metric, Card, EmptyNote } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const today = todayKey();

  const [{ data: todaySales }, { data: todayExpenses }, { data: last7 }, { data: prev7 }, { data: lowStock }] =
    await Promise.all([
      supabase.from("sales").select("total").eq("business_id", business.id).eq("sale_date", today),
      supabase.from("expenses").select("amount").eq("business_id", business.id).eq("expense_date", today),
      supabase.from("sales").select("total").eq("business_id", business.id).gte("sale_date", daysAgoKey(6)),
      supabase
        .from("sales")
        .select("total")
        .eq("business_id", business.id)
        .gte("sale_date", daysAgoKey(13))
        .lt("sale_date", daysAgoKey(7)),
      supabase
        .from("products")
        .select("name, stock")
        .eq("business_id", business.id)
        .lt("stock", 5)
        .order("stock", { ascending: true })
        .limit(1),
    ]);

  const sumTotal = (rows: { total: number }[] | null) => (rows || []).reduce((s, r) => s + r.total, 0);
  const sumAmount = (rows: { amount: number }[] | null) => (rows || []).reduce((s, r) => s + r.amount, 0);

  const salesToday = sumTotal(todaySales);
  const expensesToday = sumAmount(todayExpenses);
  const profit = salesToday - expensesToday;
  const last7Sum = sumTotal(last7);
  const prev7Sum = sumTotal(prev7);
  const weekDelta = prev7Sum ? Math.round(((last7Sum - prev7Sum) / prev7Sum) * 100) : 0;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Aujourd&apos;hui</p>
      <h1 className="font-display text-2xl font-semibold mb-5">Bonjour</h1>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Ventes du jour" value={fmt(salesToday, business.currency)} />
        <Metric label="Dépenses du jour" value={fmt(expensesToday, business.currency)} />
        <Metric
          label="Profit net"
          value={fmt(profit, business.currency)}
          tone={profit >= 0 ? "good" : "bad"}
        />
        <Metric
          label="Tendance 7 jours"
          value={fmt(last7Sum, business.currency)}
          delta={`${weekDelta >= 0 ? "+" : ""}${weekDelta}%`}
          tone={weekDelta >= 0 ? "good" : "bad"}
        />
      </div>

      {lowStock && lowStock.length > 0 && (
        <Card className="mt-4 border-red bg-red-soft">
          <p className="text-sm">
            <b>Stock faible ·</b> {lowStock[0].name} — il reste {lowStock[0].stock} unités
          </p>
        </Card>
      )}

      <EmptyNote>Consultez l&apos;onglet Stats pour le calendrier et les tendances.</EmptyNote>
    </div>
  );
}
