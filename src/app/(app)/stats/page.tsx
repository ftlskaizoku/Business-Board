import Link from "next/link";
import { requireUserAndBusiness } from "@/lib/data";
import { hasServices } from "@/lib/niches";
import { fmt, fmtK, dayLabelFr } from "@/lib/format";
import {
  VIEWS,
  PREV_WORD,
  cleanView,
  eachDay,
  isKeyOf,
  periodKeyOf,
  periodLabel,
  periodRange,
  prevPeriodKey,
} from "@/lib/periods";
import { Card, DeltaPill, EmptyState, PageHeader, SectionHeader, Icon } from "@/components/ui";
import { TrendChart, type TrendPoint } from "@/components/charts";
import Donut, { sliceColor } from "@/components/Donut";
import PeriodStrip from "@/components/PeriodStrip";

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
  searchParams: Promise<{ view?: string; p?: string; month?: string; day?: string }>;
}) {
  const { view: viewParam, p: pParam, month: monthParam, day: dayParam } = await searchParams;
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

  const allDates = Object.keys(byDate).sort();

  if (allDates.length === 0) {
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

  // Which period are we looking at? Old links (?month=2026-11) still work.
  const view = cleanView(viewParam ?? (monthParam ? "month" : undefined));
  const wanted = pParam ?? (viewParam ? undefined : monthParam);
  const lastDate = allDates[allDates.length - 1];
  const periods = [...new Set(allDates.map((d) => periodKeyOf(view, d)))].sort();
  const key = isKeyOf(view, wanted)
    ? (periods.filter((k) => k <= wanted).pop() ?? periods[0])
    : periods[periods.length - 1];
  const range = periodRange(view, key);
  const inRange = (d: string) => d >= range.start && d <= range.end;
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const label = view === "month" ? cap(periodLabel(view, key)) : periodLabel(view, key);

  const totalsFor = (r: { start: string; end: string }) => {
    let sales = 0;
    let expenses = 0;
    for (const [d, v] of Object.entries(byDate)) {
      if (d >= r.start && d <= r.end) {
        sales += v.sales;
        expenses += v.expenses;
      }
    }
    return { sales, expenses };
  };
  const totals = totalsFor(range);
  const prevTotals = totalsFor(periodRange(view, prevPeriodKey(view, key)));
  const salesPct = pctChange(totals.sales, prevTotals.sales);
  const expensesPct = pctChange(totals.expenses, prevTotals.expenses);

  const rangeDays = allDates.filter(inRange).map((date) => ({ date, ...byDate[date] }));
  const daysInPeriod = eachDay(range.start, range.end).length;
  const activeDays = rangeDays.filter((d) => d.sales > 0).length;
  const saleCount = sales.filter((s) => inRange(s.sale_date)).length;
  const avgBasket = saleCount ? totals.sales / saleCount : 0;
  const net = totals.sales - totals.expenses;
  const netPositive = net >= 0;
  const margin = totals.sales ? Math.round((net / totals.sales) * 100) : 0;
  const cur = business.currency;

  const best = (() => {
    if (view === "year") {
      const byMonth: Record<string, number> = {};
      rangeDays.forEach((d) => (byMonth[d.date.slice(0, 7)] = (byMonth[d.date.slice(0, 7)] || 0) + d.sales - d.expenses));
      const top = Object.entries(byMonth).sort((x, y) => y[1] - x[1])[0];
      return top ? { sub: cap(periodLabel("month", top[0])), profit: top[1] } : null;
    }
    const top = rangeDays.reduce<(typeof rangeDays)[number] | null>(
      (b, d) => (!b || d.sales - d.expenses > b.sales - b.expenses ? d : b),
      null
    );
    return top ? { sub: dayLabelFr(top.date), profit: top.sales - top.expenses } : null;
  })();

  const fourthMetric = hasServices(business.type)
    ? { label: "Rendez-vous pris", value: String((slots || []).filter((s) => s.status === "taken").length) }
    : { label: "Moyenne par jour actif", value: fmt(activeDays ? totals.sales / activeDays : 0, cur) };

  // Day grid: Monday-start calendar for a month, a single row for a week.
  const cells: ({ day: number; key: string; data?: DayAgg } | null)[] = [];
  if (view === "month") {
    const startOffset = (new Date(range.start + "T00:00:00Z").getUTCDay() + 6) % 7;
    for (let i = 0; i < startOffset; i++) cells.push(null);
  }
  if (view !== "year") {
    eachDay(range.start, range.end).forEach((k) => cells.push({ day: Number(k.slice(8)), key: k, data: byDate[k] }));
  }

  const dayRows = rangeDays;
  const activeKey = dayParam && byDate[dayParam] && inRange(dayParam) ? dayParam : dayRows.length ? dayRows[dayRows.length - 1].date : null;
  const active = activeKey ? { date: activeKey, ...byDate[activeKey] } : null;
  const activeDaySales = activeKey ? sales.filter((s) => s.sale_date === activeKey) : [];
  const topItemToday = (() => {
    const counts: Record<string, number> = {};
    activeDaySales.forEach((s) => s.sale_items.forEach((it) => (counts[it.name] = (counts[it.name] || 0) + it.qty)));
    const top = Object.entries(counts).sort((x, y) => y[1] - x[1])[0];
    return top ? top[0] : "—";
  })();

  // Chart: one point per day (week, month) or per month (year).
  const trendPoints: TrendPoint[] =
    view === "year"
      ? Array.from({ length: 12 }, (_, i) => {
          const mk = `${key}-${String(i + 1).padStart(2, "0")}`;
          const t = totalsFor(periodRange("month", mk));
          const d = new Date(mk + "-01T00:00:00Z");
          return {
            label: d.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }),
            title: cap(d.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })),
            a: t.sales,
            b: t.expenses,
          };
        })
      : eachDay(range.start, range.end).map((k) => ({
          label:
            view === "week"
              ? new Date(k + "T00:00:00Z").toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" })
              : String(Number(k.slice(8))),
          title: new Date(k + "T00:00:00Z").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
          a: byDate[k]?.sales || 0,
          b: byDate[k]?.expenses || 0,
        }));

  // Best sellers in the period.
  const itemCounts: Record<string, { qty: number; revenue: number }> = {};
  sales
    .filter((s) => inRange(s.sale_date))
    .forEach((s) =>
      s.sale_items.forEach((it) => {
        itemCounts[it.name] = itemCounts[it.name] || { qty: 0, revenue: 0 };
        itemCounts[it.name].qty += it.qty;
        itemCounts[it.name].revenue += it.qty * it.price;
      })
    );
  const topItems = Object.entries(itemCounts)
    .map(([name, v]) => ({ name, ...v }))
    .sort((x, y) => y.revenue - x.revenue)
    .slice(0, 5);
  const maxItemRev = topItems[0]?.revenue || 1;

  // Expenses by name in the period.
  const expByCat: Record<string, number> = {};
  expenses.filter((e) => inRange(e.expense_date)).forEach((e) => (expByCat[e.category] = (expByCat[e.category] || 0) + e.amount));
  const expenseBreakdown = Object.entries(expByCat)
    .map(([category, amount]) => ({ category, amount }))
    .sort((x, y) => y.amount - x.amount);
  // Top 4 names get their own slice; everything else is grouped as "Autres".
  const expenseSlices = (() => {
    const top = expenseBreakdown.slice(0, 4).map((e) => ({ name: e.category, value: e.amount }));
    const rest = expenseBreakdown.slice(4).reduce((n, e) => n + e.amount, 0);
    return rest > 0 ? [...top, { name: "Autres", value: rest }] : top;
  })();

  const anchorDate = range.end < lastDate ? range.end : lastDate;
  const stripItems = periods.map((k) => {
    const l = periodLabel(view, k, "short");
    return { key: k, label: view === "month" ? cap(l) : l, href: `/stats?view=${view}&p=${k}` };
  });

  const dayTile = (c: { day: number; key: string; data?: DayAgg }, i: number) => {
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
      <Link key={i} href={`/stats?view=${view}&p=${key}&day=${c.key}`} scroll={false} aria-label={`Voir le ${c.key}`}>
        {cell}
      </Link>
    ) : (
      <div key={i}>{cell}</div>
    );
  };

  return (
    <div>
      <PageHeader eyebrow="Statistiques" title="Vos chiffres" subtitle={business.name} />

      {/* 1. Week / month / year */}
      <div role="tablist" aria-label="Période" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-card border border-line lg:max-w-md">
        {VIEWS.map((v) => {
          const on = v.id === view;
          return (
            <Link
              key={v.id}
              href={`/stats?view=${v.id}&p=${periodKeyOf(v.id, anchorDate)}`}
              scroll={false}
              role="tab"
              aria-selected={on}
              className={`h-9 rounded-xl flex items-center justify-center text-[13px] font-medium transition-colors ${
                on ? "bg-ochre" : "text-muted"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>

      {/* 2. Which week / month / year */}
      <div className="mt-3">
        <PeriodStrip items={stripItems} current={key} ariaLabel="Choisir la période" />
      </div>

      <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:items-start">
      <div className="lg:col-span-7 min-w-0">
      {/* Hero: revenue first, then what it is made of. */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Chiffre d&apos;affaires · {label}</p>
            {salesPct !== null && (
              <DeltaPill value={`${salesPct >= 0 ? "+" : ""}${salesPct}%`} tone={salesPct >= 0 ? "good" : "bad"} />
            )}
          </div>
          <p className="font-mono text-[32px] leading-tight font-medium mt-2 break-words">{fmt(totals.sales, cur)}</p>
          {salesPct !== null && <p className="text-[11px] text-muted mt-1">vs {PREV_WORD[view]}</p>}
        </div>
        <div className="grid grid-cols-3 border-t border-line divide-x divide-line">
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted flex items-center gap-1"><Icon name="expense" size={12} />Dépenses</p>
            <p className="font-mono text-[13px] font-medium mt-1 break-words">{fmt(totals.expenses, cur)}</p>
            {expensesPct !== null && (
              <p className={`text-[10px] mt-0.5 font-mono ${expensesPct <= 0 ? "text-green" : "text-red"}`}>
                {expensesPct >= 0 ? "+" : ""}{expensesPct}%
              </p>
            )}
          </div>
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted">Bénéfice net</p>
            <p className={`font-mono text-[13px] font-medium mt-1 break-words ${netPositive ? "text-green" : "text-red"}`}>{fmt(net, cur)}</p>
          </div>
          <div className="p-3.5 min-w-0">
            <p className="text-[11px] text-muted">Marge</p>
            <p className={`font-mono text-[13px] font-medium mt-1 ${margin >= 0 ? "text-green" : "text-red"}`}>{margin}%</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        {[
          { label: "Panier moyen", value: fmt(avgBasket, cur), sub: `${saleCount} vente${saleCount > 1 ? "s" : ""}` },
          {
            label: view === "year" ? "Meilleur mois" : "Meilleur jour",
            value: best ? fmt(best.profit, cur) : "—",
            sub: best ? best.sub : "",
          },
          { label: fourthMetric.label, value: fourthMetric.value, sub: "" },
          { label: "Jours actifs", value: String(activeDays), sub: `sur ${daysInPeriod}` },
        ].map((k) => (
          <Card key={k.label} className="!p-3.5">
            <p className="text-[11px] text-muted truncate">{k.label}</p>
            <p className="font-mono text-[15px] font-medium mt-1 break-words">{k.value}</p>
            {k.sub && <p className="text-[11px] text-muted mt-0.5 truncate">{k.sub}</p>}
          </Card>
        ))}
      </div>

      <SectionHeader title="Tendance" aside={view === "year" ? "12 mois" : `${daysInPeriod} jours`} />
      <Card>
        <TrendChart points={trendPoints} currency={cur} aLabel="Ventes" bLabel="Dépenses" />
        <div className="flex gap-4 mt-2 pt-3 border-t border-line text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green inline-block" />Ventes</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red inline-block" />Dépenses</span>
          <span className="ml-auto">Touchez la courbe</span>
        </div>
      </Card>

      </div>

      <div className="lg:col-span-5 min-w-0">
      <SectionHeader
        className="lg:mt-0!"
        title={view === "year" ? "Mois par mois" : view === "week" ? "Jour par jour" : "Calendrier"}
        aside={view === "year" ? "bénéfice / mois" : "bénéfice / jour"}
      />
      <Card className="!p-3" data-tour="stats-calendar">
        {view === "year" ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const mk = `${key}-${String(i + 1).padStart(2, "0")}`;
              const t = totalsFor(periodRange("month", mk));
              const hasData = t.sales > 0 || t.expenses > 0;
              const profit = t.sales - t.expenses;
              const tone = !hasData ? "bg-cream text-muted" : profit >= 0 ? "bg-green-soft text-green" : "bg-red-soft text-red";
              const name = cap(new Date(mk + "-01T00:00:00Z").toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }));
              const tile = (
                <div className={`h-[58px] rounded-xl flex flex-col justify-between p-2 ${tone}`}>
                  <span className="text-[11px] opacity-75">{name}</span>
                  {hasData && <span className="text-xs font-mono font-medium truncate">{fmtK(profit)}</span>}
                </div>
              );
              return hasData ? (
                <Link key={mk} href={`/stats?view=month&p=${mk}`} scroll={false} aria-label={`Voir ${name}`}>
                  {tile}
                </Link>
              ) : (
                <div key={mk}>{tile}</div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span key={i} className="text-center text-[11px] text-muted">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => (c ? dayTile(c, i) : <div key={i} />))}
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
          </>
        )}
      </Card>

      <SectionHeader title="Meilleures ventes" aside={periodLabel(view, key, "short")} />
      <Card>
        {topItems.length === 0 ? (
          <EmptyState icon={<Icon name="box" size={20} />} title="Aucune vente sur cette période" />
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

      <SectionHeader title="Dépenses par catégorie" aside={fmt(totals.expenses, cur)} />
      <Card>
        {expenseBreakdown.length === 0 ? (
          <EmptyState icon={<Icon name="expense" size={20} />} title="Aucune dépense sur cette période" />
        ) : (
          <div className="flex items-center gap-4 min-w-0">
            <Donut slices={expenseSlices} centerLabel="Total" centerValue={fmt(totals.expenses, cur)} />
            <ul className="flex-1 min-w-0 space-y-2.5">
              {expenseSlices.map((e, i) => (
                <li key={e.name} className="flex items-center gap-2 text-sm min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sliceColor(i) }} />
                  <span className="truncate flex-1">{e.name}</span>
                  <span className="font-mono text-xs shrink-0 text-muted">
                    {Math.round((e.value / (totals.expenses || 1)) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      </div>
      </div>
    </div>
  );
}
