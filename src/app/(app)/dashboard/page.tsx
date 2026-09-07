import { requireUserAndBusiness } from "@/lib/data";
import { fmt, todayKey, daysAgoKey } from "@/lib/format";
import { hasProducts } from "@/lib/niches";
import { Metric, Card, EmptyNote, EyebrowLabel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const today = todayKey();
  const showStock = hasProducts(business.type);

  const [{ data: todaySales }, { data: todayExpenses }, { data: last7 }, { data: prev7 }, { data: stockRows }] =
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
      showStock
        ? supabase.from("products").select("name, price, stock").eq("business_id", business.id)
        : Promise.resolve({ data: [] as { name: string; price: number; stock: number }[] }),
    ]);

  const sumTotal = (rows: { total: number }[] | null) => (rows || []).reduce((s, r) => s + r.total, 0);
  const sumAmount = (rows: { amount: number }[] | null) => (rows || []).reduce((s, r) => s + r.amount, 0);

  const salesToday = sumTotal(todaySales);
  const expensesToday = sumAmount(todayExpenses);
  const profit = salesToday - expensesToday;
  const last7Sum = sumTotal(last7);
  const prev7Sum = sumTotal(prev7);
  const weekDelta = prev7Sum ? Math.round(((last7Sum - prev7Sum) / prev7Sum) * 100) : 0;

  const stock = stockRows || [];
  const totalUnits = stock.reduce((s, p) => s + p.stock, 0);
  const stockValue = stock.reduce((s, p) => s + p.stock * p.price, 0);
  const outOfStockCount = stock.filter((p) => p.stock <= 0).length;
  const lowStockItems = stock
    .filter((p) => p.stock > 0 && p.stock < 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

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

      {showStock && (
        <>
          <EyebrowLabel>Suivi de stock</EyebrowLabel>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Unités en stock" value={String(totalUnits)} />
            <Metric label="Valeur du stock" value={fmt(stockValue, business.currency)} />
          </div>

          {outOfStockCount > 0 && (
            <Card className="mt-3 border-red bg-red-soft">
              <p className="text-sm">
                <b>Rupture de stock ·</b> {outOfStockCount} produit{outOfStockCount > 1 ? "s" : ""} à 0 unité
              </p>
            </Card>
          )}

          {lowStockItems.length > 0 && (
            <Card className="mt-3 border-red bg-red-soft">
              <p className="text-sm font-medium mb-2">Stock faible</p>
              <div className="space-y-1">
                {lowStockItems.map((p) => (
                  <div key={p.name} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-red font-mono">{p.stock} restant{p.stock > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <EmptyNote>Consultez l&apos;onglet Stats pour le calendrier et les tendances.</EmptyNote>
    </div>
  );
}
