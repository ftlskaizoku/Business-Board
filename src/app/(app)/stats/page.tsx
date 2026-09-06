import Link from "next/link";
import { requireUserAndBusiness } from "@/lib/data";
import { hasServices } from "@/lib/niches";
import { fmt, fmtK, daysAgoKey } from "@/lib/format";
import { Metric, Card, EyebrowLabel, EmptyNote } from "@/components/ui";
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
        <p className="text-xs uppercase tracking-widest text-muted mb-1">Statistiques</p>
        <h1 className="font-display text-2xl font-semibold mb-5">{business.name}</h1>
        <EmptyNote>
          Pas encore d&apos;historique. Les statistiques apparaîtront dès vos premières ventes et dépenses.
        </EmptyNote>
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
  const firstOfMonth = new Date(month + "-01");
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
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
  const maxDayVal = Math.max(1, ...last14.map((d) => Math.max(d.sales, d.expenses)));

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
  const maxExpCat = expenseBreakdown[0]?.amount || 1;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Statistiques</p>
      <h1 className="font-display text-2xl font-semibold mb-5">{business.name}</h1>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Ventes du mois"
          value={fmt(monthTotals.sales, business.currency)}
          delta={salesPct !== null ? `${salesPct >= 0 ? "+" : ""}${salesPct}%` : undefined}
          tone={salesPct !== null ? (salesPct >= 0 ? "good" : "bad") : "default"}
        />
        <Metric
          label="Dépenses du mois"
          value={fmt(monthTotals.expenses, business.currency)}
          delta={expensesPct !== null ? `${expensesPct >= 0 ? "+" : ""}${expensesPct}%` : undefined}
          tone={expensesPct !== null ? (expensesPct <= 0 ? "good" : "bad") : "default"}
        />
        <Metric label="Panier moyen" value={fmt(avgBasket, business.currency)} />
        <Metric label="Marge estimée" value={`${margin}%`} tone={margin >= 0 ? "good" : "bad"} />
        <Metric label="Meilleur jour" value={bestDay ? fmt(bestDay.sales - bestDay.expenses, business.currency) : "—"} />
        <Metric label={fourthMetric.label} value={fourthMetric.value} />
      </div>

      <Card className={`mt-4 ${monthTotals.sales - monthTotals.expenses >= 0 ? "bg-green-soft" : "bg-red-soft"}`}>
        <p className={`text-sm mb-1 ${monthTotals.sales - monthTotals.expenses >= 0 ? "text-green" : "text-red"}`}>
          Bénéfice net du mois
        </p>
        <p className={`font-mono text-2xl font-medium ${monthTotals.sales - monthTotals.expenses >= 0 ? "text-green" : "text-red"}`}>
          {fmt(monthTotals.sales - monthTotals.expenses, business.currency)}
        </p>
      </Card>

      <div className="flex items-center justify-between mt-6 mb-2">
        <p className="text-xs uppercase tracking-widest text-muted">Calendrier</p>
        <MonthSelect months={months} current={month} />
      </div>

      <div className="border border-line rounded-xl bg-card p-2.5">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <span key={i} className="text-center text-[11px] text-muted">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const hasData = !!c.data;
            const profit = hasData ? c.data!.sales - c.data!.expenses : 0;
            const cls = !hasData
              ? "bg-cream text-muted"
              : profit >= 0
              ? "bg-green-soft text-green"
              : "bg-red-soft text-red";
            const isActive = c.key === activeKey ? "ring-2 ring-current" : "";
            const content = (
              <div className={`h-[46px] rounded-lg flex flex-col justify-between items-start p-1 ${cls} ${isActive}`}>
                <span className="text-[10px] opacity-75">{c.day}</span>
                {hasData && <span className="text-[11px] font-mono font-medium">{fmtK(profit)}</span>}
              </div>
            );
            return hasData ? (
              <Link key={i} href={`/stats?month=${month}&day=${c.key}`}>
                {content}
              </Link>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
        </div>
      </div>

      {active && (
        <Card className="mt-4">
          <div className="flex justify-between items-baseline mb-3">
            <span className="font-medium text-sm">{active.date}</span>
            <span className={`font-mono text-lg font-medium ${active.sales - active.expenses >= 0 ? "text-green" : "text-red"}`}>
              {fmt(active.sales - active.expenses, business.currency)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Ventes</p>
              <p className="font-medium mt-0.5">{fmt(active.sales, business.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Dépenses</p>
              <p className="font-medium mt-0.5">{fmt(active.expenses, business.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Produits vendus</p>
              <p className="font-medium mt-0.5">{active.items}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Meilleure vente</p>
              <p className="font-medium mt-0.5">{topItemToday}</p>
            </div>
          </div>
        </Card>
      )}

      <EyebrowLabel>Ventes et dépenses, 14 derniers jours</EyebrowLabel>
      <Card>
        <div className="flex items-end gap-1.5 h-[100px]">
          {last14.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5 h-[80px]">
                <div className="w-1.5 rounded-t-sm bg-green" style={{ height: `${Math.round((d.sales / maxDayVal) * 80)}px` }} />
                <div className="w-1.5 rounded-t-sm bg-red" style={{ height: `${Math.round((d.expenses / maxDayVal) * 80)}px` }} />
              </div>
              <span className="text-[9px] text-muted">{Number(d.date.slice(8, 10))}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 pt-2 border-t border-line text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green inline-block" />Ventes</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red inline-block" />Dépenses</span>
        </div>
      </Card>

      <EyebrowLabel>Meilleures ventes du mois</EyebrowLabel>
      <Card>
        {topItems.length === 0 ? (
          <EmptyNote>Aucune vente ce mois-ci.</EmptyNote>
        ) : (
          topItems.map((t, i) => (
            <div key={t.name} className={i < topItems.length - 1 ? "mb-3" : ""}>
              <div className="flex justify-between text-sm mb-1">
                <span>{t.name} <span className="text-muted">· {t.qty}x</span></span>
                <span className="font-mono">{fmt(t.revenue, business.currency)}</span>
              </div>
              <div className="h-[5px] rounded-full bg-ochre-soft">
                <div className="h-full rounded-full bg-ochre" style={{ width: `${Math.round((t.revenue / maxItemRev) * 100)}%` }} />
              </div>
            </div>
          ))
        )}
      </Card>

      <EyebrowLabel>Dépenses par catégorie</EyebrowLabel>
      <Card>
        {expenseBreakdown.length === 0 ? (
          <EmptyNote>Aucune dépense ce mois-ci.</EmptyNote>
        ) : (
          expenseBreakdown.map((e, i) => (
            <div key={e.category} className={i < expenseBreakdown.length - 1 ? "mb-3" : ""}>
              <div className="flex justify-between text-sm mb-1">
                <span>{e.category}</span>
                <span className="font-mono">{fmt(e.amount, business.currency)}</span>
              </div>
              <div className="h-[5px] rounded-full bg-indigo-soft">
                <div className="h-full rounded-full bg-indigo" style={{ width: `${Math.round((e.amount / maxExpCat) * 100)}%` }} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
