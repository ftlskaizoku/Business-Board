import { requireAdmin } from "@/lib/admin";
import { setUserAllowed } from "./actions";
import { NICHES, nicheLabel } from "@/lib/niches";
import { fmt, daysAgoKey } from "@/lib/format";
import { Card } from "@/components/ui";
import Link from "next/link";
import type { Business, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();

  const [{ data: businesses }, { data: recentSales }, { data: profiles }] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Business[]>(),
    supabase
      .from("sales")
      .select("business_id, total, sale_date")
      .gte("sale_date", daysAgoKey(6)),
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Profile[]>(),
  ]);

  const list = businesses || [];
  const sales = recentSales || [];
  const users = profiles || [];
  const businessByOwner = list.reduce<Record<string, Business>>((acc, b) => {
    acc[b.owner_id] = b;
    return acc;
  }, {});

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
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-widest text-muted">Admin</p>
        <Link href="/dashboard" className="text-xs text-indigo">
          ← Retour à mon commerce
        </Link>
      </div>
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

      <p className="text-xs uppercase tracking-widest text-muted mb-2">Utilisateurs</p>
      <div className="space-y-2 mb-6">
        {users.length === 0 && <p className="text-sm text-muted">Aucun utilisateur pour le moment.</p>}
        {users.map((p) => {
          const biz = businessByOwner[p.id];
          const isSelf = p.id === user.id;
          return (
            <Card key={p.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.full_name || p.email || "Sans nom"}</p>
                <p className="text-xs text-muted truncate">
                  {p.email || "—"}
                  {biz ? ` · ${biz.name}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide px-2 py-1 rounded-full ${
                    p.is_allowed ? "bg-green-soft text-green" : "bg-red-soft text-red"
                  }`}
                >
                  {p.is_allowed ? "Autorisé" : "Bloqué"}
                </span>
                {isSelf ? (
                  <span className="text-[10px] text-muted px-1">Vous</span>
                ) : (
                  <form action={setUserAllowed.bind(null, p.id, !p.is_allowed)}>
                    <button
                      type="submit"
                      className={`text-xs font-medium underline underline-offset-2 ${
                        p.is_allowed ? "text-red" : "text-indigo"
                      }`}
                    >
                      {p.is_allowed ? "Bloquer" : "Autoriser"}
                    </button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>

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
