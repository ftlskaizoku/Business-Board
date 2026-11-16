import { requireUserAndBusiness } from "@/lib/data";
import { fmt, todayKey, daysAgoKey } from "@/lib/format";
import { hasProducts } from "@/lib/niches";
import Link from "next/link";
import { Metric, Card, EmptyNote, EyebrowLabel, PageHeading, DeltaPill, Icon } from "@/components/ui";
import { TrendChart, type TrendPoint } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, business } = await requireUserAndBusiness();
  const today = todayKey();
  const showStock = hasProducts(business.type) && business.track_stock;

  const [{ data: todaySales }, { data: todayExpenses }, { data: last7 }, { data: prev7 }, { data: stockRows }] =
    await Promise.all([
      supabase.from("sales").select("total").eq("business_id", business.id).eq("sale_date", today),
      supabase.from("expenses").select("amount").eq("business_id", business.id).eq("expense_date", today),
      supabase.from("sales").select("sale_date, total").eq("business_id", business.id).gte("sale_date", daysAgoKey(6)),
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

  // Per-day sales for the last 7 days (oldest → today) for the trend chart.
  const dayTotals: Record<string, number> = {};
  (last7 || []).forEach((r: { sale_date: string; total: number }) => {
    dayTotals[r.sale_date] = (dayTotals[r.sale_date] || 0) + r.total;
  });
  const trendPoints: TrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = daysAgoKey(i);
    const dt = new Date(key + "T00:00:00");
    trendPoints.push({
      label: String(dt.getDate()),
      title: dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }),
      a: dayTotals[key] || 0,
    });
  }

  const stock = stockRows || [];
  const totalUnits = stock.reduce((s, p) => s + p.stock, 0);
  const stockValue = stock.reduce((s, p) => s + p.stock * p.price, 0);
  const outOfStock = stock.filter((p) => p.stock <= 0);
  const outOfStockCount = outOfStock.length;
  const lowStockItems = stock
    .filter((p) => p.stock > 0 && p.stock < 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div>
      <PageHeading eyebrow="Aujourd'hui" title="Bonjour" />

      <div className="grid grid-cols-2 gap-3" data-tour="dashboard-metrics">
        <Card className={`col-span-2 ${profit >= 0 ? "bg-green-soft" : "bg-red-soft"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-7 h-7 rounded-full bg-card flex items-center justify-center ${profit >= 0 ? "text-green" : "text-red"}`}
            >
              <Icon name="profit" />
            </span>
            <p className={`text-sm ${profit >= 0 ? "text-green" : "text-red"}`}>Profit net</p>
          </div>
          <p className={`font-mono text-3xl font-medium break-words ${profit >= 0 ? "text-green" : "text-red"}`}>
            {fmt(profit, business.currency)}
          </p>
          <p className="text-xs text-muted mt-1">Ventes moins dépenses d&apos;aujourd&apos;hui</p>
        </Card>
        <Metric label="Ventes du jour" value={fmt(salesToday, business.currency)} icon={<Icon name="sales" />} />
        <Metric label="Dépenses du jour" value={fmt(expensesToday, business.currency)} icon={<Icon name="expense" />} />
      </div>

      <EyebrowLabel>Tendance 7 jours</EyebrowLabel>
      <Card>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="text-xs text-muted">Ventes sur la semaine</p>
            <p className="font-mono text-xl font-medium break-words">{fmt(last7Sum, business.currency)}</p>
          </div>
          <DeltaPill
            value={`${weekDelta >= 0 ? "+" : ""}${weekDelta}%`}
            tone={weekDelta >= 0 ? "good" : "bad"}
          />
        </div>
        <TrendChart points={trendPoints} currency={business.currency} aLabel="Ventes" />
        <p className="text-[11px] text-muted mt-1">Touchez la courbe pour voir le détail d&apos;un jour. Comparé à la semaine précédente.</p>
      </Card>

      {showStock && (
        <>
          <EyebrowLabel>Suivi de stock</EyebrowLabel>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Unités en stock" value={String(totalUnits)} icon={<Icon name="box" />} />
            <Metric label="Valeur du stock" value={fmt(stockValue, business.currency)} icon={<Icon name="stock" />} />
          </div>

          {outOfStockCount > 0 && (
            <Card className="mt-3 border-red bg-red-soft">
              <p className="text-sm">
                <b>Rupture de stock ·</b> {outOfStockCount} produit{outOfStockCount > 1 ? "s" : ""} à 0 unité
              </p>
              <p className="text-xs text-red mt-1 break-words">
                {outOfStock.slice(0, 4).map((p) => p.name).join(", ")}
                {outOfStockCount > 4 ? ` et ${outOfStockCount - 4} autre${outOfStockCount - 4 > 1 ? "s" : ""}` : ""}
              </p>
              <Link href="/catalogue" className="inline-block text-xs font-medium text-red underline underline-offset-2 mt-2">
                Réapprovisionner dans le Catalogue →
              </Link>
            </Card>
          )}

          {lowStockItems.length > 0 && (
            <Card className="mt-3 border-red bg-red-soft">
              <p className="text-sm font-medium mb-2">Stock faible</p>
              <div className="space-y-1">
                {lowStockItems.map((p) => (
                  <div key={p.name} className="flex justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="text-red font-mono shrink-0">{p.stock} restant{p.stock > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
              <Link href="/catalogue" className="inline-block text-xs font-medium text-red underline underline-offset-2 mt-2">
                Réapprovisionner dans le Catalogue →
              </Link>
            </Card>
          )}
        </>
      )}

      <EmptyNote>Consultez l&apos;onglet Stats pour le calendrier et les tendances.</EmptyNote>
    </div>
  );
}
