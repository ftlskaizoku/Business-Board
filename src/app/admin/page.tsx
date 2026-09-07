import { requireAdmin } from "@/lib/admin";
import { NICHES, nicheLabel } from "@/lib/niches";
import { fmt, daysAgoKey } from "@/lib/format";
import { Card } from "@/components/ui";
import type { Business } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const [{ data: businesses }, { data: recentSales }] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Business[]>(),
    supabase
      .from("sales")
      .select("business_id, total, sale_date")
      .gte("sale_date", daysAgoKey(6)),
  ]);

  const list = businesses || [];
  const sales = recentSales || [];

  const salesByBusiness = sales.reduce<Record<string, number>>((acc, s) => {
    acc[s.business_id] = (acc[s.business_id] || 0) + s.total;
    return acc;
  }, {});

  const totalSales7d = sales.reduce((s, r) => s + r.total, 0);

  const nicheCounts = list.reduce<Record<string, number>>((acc, b) => {
    const key = nicheLabel(b.niche, b.custom_niche);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-5 max-w-2xl mx-auto w-full">
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Admin</p>
      <h1 className="font-display text-2xl font-semibold mb-5">Vue d&apos;ensemble</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <p className="text-xs text-muted mb-1">Commerces inscrits</p>
          <p className="font-mono text-xl font-medium">{list.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted mb-1">Ventes · 7 derniers jours</p>
          <p className="font-mono text-xl font-medium">{fmt(totalSales7d, "FCFA")}</p>
        </Card>
      </div>

      <p className="text-xs uppercase tracking-widest text-muted mb-2">Répartition par secteur</p>
      <Card className="mb-6">
        {Object.keys(nicheCounts).length === 0 && (
          <p className="text-sm text-muted">Aucun commerce pour le moment.</p>
        )}
        {Object.entries(nicheCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([label, count]) => (
            <div key={label} className="flex items-center justify-between py-1.5 text-sm">
              <span>{label}</span>
              <span className="font-mono text-muted">{count}</span>
            </div>
          ))}
      </Card>

      <p className="text-xs uppercase tracking-widest text-muted mb-2">Tous les commerces</p>
      <div className="space-y-2">
        {list.length === 0 && (
          <p className="text-sm text-muted">Aucun commerce pour le moment.</p>
        )}
        {list.map((b) => {
          const n = NICHES[b.niche];
          return (
            <Card key={b.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 shrink-0 rounded-full bg-ochre-soft flex items-center justify-center text-base">
                  {n.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted truncate">
                    {nicheLabel(b.niche, b.custom_niche)} · {b.type}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm">{fmt(salesByBusiness[b.id] || 0, b.currency)}</p>
                <p className="text-[10px] text-muted">7 jours</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
