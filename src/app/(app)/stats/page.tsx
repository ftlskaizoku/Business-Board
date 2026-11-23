import Link from "next/link";
import { requireUserAndBusiness } from "@/lib/data";
import { hasServices } from "@/lib/niches";
import { fmt, fmtK, daysAgoKey, dayLabelFr, monthLabelFr } from "@/lib/format";
import { Card, DeltaPill, EmptyState, PageHeader, SectionHeader, Icon } from "@/components/ui";
import { TrendChart, type TrendPoint } from "@/components/charts";
import Donut, { sliceColor } from "@/components/Donut";
import MonthSelect from "@/components/MonthSelect";

export const dynamic = "force-dynamic";

interface SaleRow {
  id: string;
  sale_date: string;
  total: number;
  sale_items: { name: string; qty: number; price: number }[];
}
interface ExpenseRow {
  expense_date: string;
  category: string;
  amount: number;
}
interface DayAgg {
  sales: number;
  expenses: number;
  items: number;
}

function pctChange(curr: number, prev: number) {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { month: monthParam, day: dayParam } = await searchParams;
  const { supabase, business } = await requireUserAndBusiness();

  const [{ data: salesRows }, { data: expenseRows }, { data: slots }] = await Promise.all([
    supabase
      .from("sales")
      .select("id, sale_date, total, sale_items(name, qty, price)")
      .eq("business_id", business.id)
      .returns<SaleRow[]>(),
    supabase.from("expenses").select("expense_date, category, amount").eq("business_id", business.id).returns<ExpenseRow[]>(),
    hasServices(business.type)
      ? supabase.from("appointment_slots").select("id, status").eq("business_id", business.id)
      : Promise.resolve({ data: [] as { id: string; status: string }[] }),
  ]);

  const sales = salesRows || [];
  const expenses = expenseRows || [];

  const byDate: Record<string, DayAgg> = {};
  sales.forEach((s) => {
    byDate[s.sale_date] = byDate[s.sale_date] || { sales: 0, expenses: 0, items: 0 };
    byDate[s.sale_date].sales += s.total;
    byDate[s.sale_date].items += s.sale_items.reduce((n, it) => n + it.qty, 0);
  });
  expenses.forEach((e) => {
    byDate[e.expense_date] = byDate[e.expense_date] || { sales: 0, expenses: 0, items: 0 };
    byDate[e.expense_date].expenses += e.amount;
  });

  const months = [...new Set(Object.keys(byDate).map((k) => k.slice(0, 7)))].sort();

  if (months.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Statistiques" title="Vos chiffres" subtitle={business.name} />
        <Card>
          <EmptyState
            icon={<Icon name="sales" size={20} />}
            title="Pas encore d'historique"
            hint="Les statistiques apparaîtront dès vos premières ventes et dépenses."
          />
        </Card>
      </div>
    );
  }

  const month = monthParam && months.includes(monthParam) ? monthParam : months[months.length - 1];
  const monthDays = Object.keys(byDate)
    .filter((k) => k.startsWith(month))
    .sort()
    .map((date) => ({ date, ...byDate[date] }));
  const monthTotals = monthDays.reduce(
    (acc, d) => ({ sales: acc.sales + d.sales, expenses: acc.expenses + d.expenses }),
    { sales: 0, expenses: 0 }
  );

  const [y, m] = month.split("-").map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthTotals = Object.keys(byDate)
    .filter((k) => k.startsWith(prevMonthKey))
    .reduce(
      (acc, k) => ({ sales: acc.sales + byDate[k].sales, expenses: acc.expenses + byDate[k].expenses }),
      { sales: 0, expenses: 0 }
    );
  const salesPct = pctChange(monthTotals.sales, prevMonthTotals.sales);
  const expensesPct = pctChange(monthTotals.expenses, prevMonthTotals.expenses);

  const monthSaleCount = sales.filter((s) => s.sale_date.startsWith(month)).length;
  const avgBasket = monthSaleCount ? monthTotals.sales / monthSaleCount : 0;
  const margin = monthTotals.sales ? Math.round(((monthTotals.sales - monthTotals.expenses) / monthTotals.sales) * 100) : 0;
  const bestDay = monthDays.length
    ? monthDays.reduce((best, d) => ((!best || d.sales - d.expenses > best.sales - best.expenses) ? d : best), null as (DayAgg & { date: string }) | null)
    : null;

  const fourthMetric = hasServices(business.type)
    ? { label: "Rendez-vous pris", value: String((slots || []).filter((s) => s.status === "taken").length) }
    : { label: "Bénéfice net", value: fmt(monthTotals.sales - monthTotals.expenses, business.currency) };

  // calendar, Monday-start
  const startOffset = (new Date(month + "-01T00:00:00Z").getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: ({ day: number; key: string; data?: DayAgg } | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${month}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, key, data: byDate[key] });
  }

  const activeKey = dayParam && byDate[dayParam] ? dayParam : monthDays.length ? monthDays[monthDays.length - 1].date : null;
  const active = activeKey ? { date: activeKey, ...byDate[activeKey] } : null;
  const activeDaySales = activeKey ? sales.filter((s) => s.sale_date === activeKey) : [];
  const topItemToday = (() => {
    const counts: Record<string, number> = {};
    activeDaySales.forEach((s) => s.sale_items.forEach((it) => (counts[it.name] = (counts[it.name] || 0) + it.qty)));
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : "—";
  })();

  // last 14 days
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const key = daysAgoKey(i);
    last14.push({ date: key, ...(byDate[key] || { sales: 0, expenses: 0, items: 0 }) });
  }
  const trendPoints: TrendPoint[] = last14.map((d) => ({
    label: String(Number(d.date.slice(8, 10))),
    title: new Date(d.date + "T00:00:00Z").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    a: d.sales,
    b: d.expenses,
  }));

  // top items this month
  const itemCounts: Record<string, { qty: number; revenue: number }> = {};
  sales
    .filter((s) => s.sale_date.startsWith(month))
    .forEach((s) =>
      s.sale_items.forEach((it) => {
        itemCounts[it.name] = itemCounts[it.name] || { qty: 0, revenue: 0 };
        itemCounts[it.name].qty += it.qty;
        itemCounts[it.name].revenue += it.qty * it.price;
      })
    );
  const topItems = Object.entries(itemCounts)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxItemRev = topItems[0]?.revenue || 1;

  // expense breakdown this month
  const expByCat: Record<string, number> = {};
  expenses
    .filter((e) => e.expense_date.startsWith(month))
    .forEach((e) => (expByCat[e.category] = (expByCat[e.category] || 0) + e.amount));
  const expenseBreakdown = Object.entries(expByCat)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  // Top 4 names get their own slice; everything else is grouped as "Autres".
  const expenseSlices = (() => {
    const top = expenseBreakdown.slice(0, 4).map((e) => ({ name: e.category, value: e.amount }));
    const rest = expenseBreakdown.slice(4).reduce((n, e) => n + e.amount, 0);
    return rest > 0 ? [...top, { name: "Autres", value: rest }] : top;
  })();

  const net = monthTotals.sales - monthTotals.expenses;
  const netPositive = net >= 0;
  const cur = business.currency;

  return (
    <div>
      <PageHeader eyebrow="Statistiques" title="Vos chiffres" subtitle={business.name} />

      <MonthSelect months={months} current={month} />

      {/* Hero: the one number that matters, then what it is made of. */}
      <Card className="mt-4 !p-0 overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted capitalize">Bénéfice net · {monthLabelFr(month)}</p>
            {salesPct !== null && (
              <DeltaPill value={`${salesPct >= 0 ? "+" : ""}${salesPct}% ventes`} tone={salesPct >= 0 ? "good" : "bad"} />
            )}
          </div>
          <p className={`font-mono text-[32px] leading-tight font-medium mt-2 break-words ${netPositive ? "text-green" : "text-red"}`}>
            {fmt(net, cur)}
          </p>
        </div>
        <div className="grid grid-cols-3 border-t border-line divide-x divide-line">
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted flex items-center gap-1"><Icon name="sales" size={12} />Ventes</p>
            <p className="font-mono text-[13px] font-medium mt-1 break-words">{fmt(monthTotals.sales, cur)}</p>
          </div>
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted flex items-center gap-1"><Icon name="expense" size={12} />Dépenses</p>
            <p className="font-mono text-[13px] font-medium mt-1 break-words">{fmt(monthTotals.expenses, cur)}</p>
            {expensesPct !== null && (
              <p className={`text-[10px] mt-0.5 font-mono ${expensesPct <= 0 ? "text-green" : "text-red"}`}>
                {expensesPct >= 0 ? "+" : ""}{expensesPct}%
              </p>
            )}
          </div>
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted">Marge</p>
            <p className={`font-mono text-[13px] font-medium mt-1 ${margin >= 0 ? "text-green" : "text-red"}`}>{margin}%</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {[
          { label: "Panier moyen", value: fmt(avgBasket, cur), sub: `${monthSaleCount} vente${monthSaleCount > 1 ? "s" : ""}` },
          {
            label: "Meilleur jour",
            value: bestDay ? fmt(bestDay.sales - bestDay.expenses, cur) : "—",
            sub: bestDay ? dayLabelFr(bestDay.date) : "",
          },
          { label: fourthMetric.label, value: fourthMetric.value, sub: "" },
          {
            label: "Jours actifs",
            value: String(monthDays.filter((d) => d.sales > 0).length),
            sub: `sur ${daysInMonth}`,
          },
        ].map((k) => (
          <Card key={k.label} className="!p-3.5">
            <p className="text-[11px] text-muted truncate">{k.label}</p>
            <p className="font-mono text-[15px] font-medium mt-1 break-words">{k.value}</p>
            {k.sub && <p className="text-[11px] text-muted mt-0.5 truncate">{k.sub}</p>}
          </Card>
        ))}
      </div>

      <SectionHeader title="Tendance" aside="14 jours" />
      <Card>
        <TrendChart points={trendPoints} currency={cur} aLabel="Ventes" bLabel="Dépenses" />
        <div className="flex gap-4 mt-2 pt-3 border-t border-line text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green inline-block" />Ventes</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red inline-block" />Dépenses</span>
          <span className="ml-auto">Touchez la courbe</span>
        </div>
      </Card>

      <SectionHeader title="Calendrier" aside="bénéfice / jour" />
      <Card className="!p-3" data-tour="stats-calendar">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <span key={i} className="text-center text-[11px] text-muted">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const hasData = !!c.data;
            const profit = hasData ? c.data!.sales - c.data!.expenses : 0;
            const tone = !hasData ? "bg-cream text-muted" : profit >= 0 ? "bg-green-soft text-green" : "bg-red-soft text-red";
            const ring = c.key === activeKey ? "ring-2 ring-ink ring-offset-1 ring-offset-card" : "";
            const cell = (
              <div className={`h-[46px] min-w-0 rounded-xl flex flex-col justify-between items-start p-1 overflow-hidden ${tone} ${ring}`}>
                <span className="text-[10px] opacity-75">{c.day}</span>
                {hasData && <span className="text-[10px] font-mono font-medium max-w-full truncate">{fmtK(profit)}</span>}
              </div>
            );
            return hasData ? (
              <Link key={i} href={`/stats?month=${month}&day=${c.key}`} scroll={false} aria-label={`Voir le ${c.key}`}>
                {cell}
              </Link>
            ) : (
              <div key={i}>{cell}</div>
            );
          })}
        </div>

        {active && (
          <div key={active.date} className="row-in mt-3 pt-3 border-t border-line">
            <div className="flex justify-between items-baseline gap-3 mb-3">
              <span className="font-display font-semibold text-sm capitalize">{dayLabelFr(active.date)}</span>
              <span className={`font-mono text-base font-medium ${active.sales - active.expenses >= 0 ? "text-green" : "text-red"}`}>
                {fmt(active.sales - active.expenses, cur)}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              <div className="min-w-0"><dt className="text-[11px] text-muted">Ventes</dt><dd className="font-medium break-words">{fmt(active.sales, cur)}</dd></div>
              <div className="min-w-0"><dt className="text-[11px] text-muted">Dépenses</dt><dd className="font-medium break-words">{fmt(active.expenses, cur)}</dd></div>
              <div className="min-w-0"><dt className="text-[11px] text-muted">Produits vendus</dt><dd className="font-medium">{active.items}</dd></div>
              <div className="min-w-0"><dt className="text-[11px] text-muted">Meilleure vente</dt><dd className="font-medium truncate">{topItemToday}</dd></div>
            </dl>
          </div>
        )}
      </Card>

      <SectionHeader title="Meilleures ventes" aside={monthLabelFr(month, "short")} />
      <Card>
        {topItems.length === 0 ? (
          <EmptyState icon={<Icon name="box" size={20} />} title="Aucune vente ce mois-ci" />
        ) : (
          <ol className="space-y-3.5">
            {topItems.map((t, i) => (
              <li key={t.name}>
                <div className="flex items-baseline gap-2 text-sm mb-1.5 min-w-0">
                  <span className="w-4 shrink-0 font-mono text-[11px] text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <span className="text-[11px] text-muted shrink-0">×{t.qty}</span>
                  <span className="font-mono text-[13px] shrink-0">{fmt(t.revenue, cur)}</span>
                </div>
                <div className="ml-6 h-1.5 rounded-full bg-ochre-soft overflow-hidden">
                  <div className="h-full rounded-full bg-ochre bar-grow" style={{ width: `${Math.round((t.revenue / maxItemRev) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <SectionHeader title="Dépenses par catégorie" aside={fmt(monthTotals.expenses, cur)} />
      <Card>
        {expenseBreakdown.length === 0 ? (
          <EmptyState icon={<Icon name="expense" size={20} />} title="Aucune dépense ce mois-ci" />
        ) : (
          <div className="flex items-center gap-4 min-w-0">
            <Donut slices={expenseSlices} centerLabel="Total" centerValue={fmt(monthTotals.expenses, cur)} />
            <ul className="flex-1 min-w-0 space-y-2.5">
              {expenseSlices.map((e, i) => (
                <li key={e.name} className="flex items-center gap-2 text-sm min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sliceColor(i) }} />
                  <span className="truncate flex-1">{e.name}</span>
                  <span className="font-mono text-xs shrink-0 text-muted">
                    {Math.round((e.value / (monthTotals.expenses || 1)) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
