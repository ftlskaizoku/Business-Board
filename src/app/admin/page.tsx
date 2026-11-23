import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fmt, daysAgoKey, todayKey } from "@/lib/format";
import { buildAdminOverview } from "@/lib/admin-stats";
import { Card, DeltaPill, EyebrowLabel, EmptyNote, Icon } from "@/components/ui";
import { TrendChart } from "@/components/charts";
import Donut, { sliceColor } from "@/components/Donut";
import AdminUsers from "@/components/AdminUsers";
import AdminAutoRefresh from "@/components/AdminAutoRefresh";
import NicheIcon from "@/components/NicheIcon";
import type { Business, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: "default" | "bad";
}) {
  return (
    <Card>
      <p className="text-xs text-muted truncate">{label}</p>
      <p className={`font-display text-[28px] leading-none font-semibold mt-2 ${tone === "bad" ? "text-red" : "text-ink"}`}>
        {value}
      </p>
      {sub && <div className="mt-2 text-[11px] text-muted truncate">{sub}</div>}
    </Card>
  );
}

export default async function AdminPage() {
  // Layer 1 of 2: server-side gate. Anyone but the admin is redirected.
  const { supabase, user } = await requireAdmin();

  const [{ data: businesses }, { data: sales }, { data: profiles }] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at", { ascending: false }).returns<Business[]>(),
    supabase.from("sales").select("business_id, total, sale_date").gte("sale_date", daysAgoKey(13)),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).returns<Profile[]>(),
  ]);

  const d = buildAdminOverview({
    businesses: businesses ?? [],
    sales: sales ?? [],
    profiles: profiles ?? [],
    selfId: user.id,
    today: todayKey(),
  });

  const deltaTone = d.salesDelta === null ? "default" : d.salesDelta >= 0 ? "good" : "bad";
  const nicheTotal = d.niches.reduce((s, n) => s + n.value, 0);

  return (
    <main className="page-enter min-h-screen p-5 max-w-2xl mx-auto w-full pb-12">
      <header className="flex items-center justify-between gap-3 mb-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full bg-indigo-soft text-indigo px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo" /> Admin
        </span>
        <AdminAutoRefresh />
      </header>

      <h1 className="font-display text-[26px] leading-tight font-semibold">Vue d&apos;ensemble</h1>
      <p className="text-sm text-muted mt-1">Toute la plateforme Business Board en un coup d&apos;œil.</p>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Kpi
          label="Utilisateurs"
          value={String(d.usersCount)}
          sub={d.newUsers7 > 0 ? `+${d.newUsers7} cette semaine` : "Aucun nouveau cette semaine"}
        />
        <Kpi
          label="Commerces"
          value={String(d.businessesCount)}
          sub={`${d.activeBusinesses} actif${d.activeBusinesses > 1 ? "s" : ""} · 7 j`}
        />
        <Kpi
          label="Comptes bloqués"
          value={String(d.blockedCount)}
          tone={d.blockedCount > 0 ? "bad" : "default"}
          sub={d.blockedCount > 0 ? "À vérifier ci-dessous" : "Tout est en ordre"}
        />
        <Kpi label="Nouveaux commerces" value={String(d.newBusinesses7)} sub="7 derniers jours" />
      </div>

      {/* Sales */}
      <Card className="mt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted flex items-center gap-1.5">
              <Icon name="sales" size={14} /> Ventes · 7 derniers jours
            </p>
            <p className="font-mono text-xl font-medium mt-1.5 break-words">{fmt(d.sales7)}</p>
          </div>
          {d.salesDelta !== null && (
            <DeltaPill value={`${d.salesDelta > 0 ? "+" : ""}${d.salesDelta}%`} tone={deltaTone} />
          )}
        </div>
        <p className="text-[11px] text-muted mt-1 mb-3">
          {d.salesDelta !== null ? "Comparé aux 7 jours précédents · " : ""}14 derniers jours
        </p>
        <TrendChart points={d.trend} currency="FCFA" aLabel="Ventes" />
      </Card>

      {/* Niches */}
      <EyebrowLabel>Répartition par secteur</EyebrowLabel>
      <Card>
        {nicheTotal === 0 ? (
          <EmptyNote>Aucun commerce pour l&apos;instant.</EmptyNote>
        ) : (
          <div className="flex items-center gap-4 min-w-0">
            <Donut slices={d.niches} centerLabel="Commerces" centerValue={String(nicheTotal)} />
            <ul className="flex-1 min-w-0 space-y-2">
              {d.niches.map((n, i) => (
                <li key={n.name} className="flex items-center gap-2 text-sm min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sliceColor(i) }} />
                  <span className="truncate flex-1">{n.name}</span>
                  <span className="font-mono text-xs text-muted shrink-0">
                    {n.value} · {Math.round((n.value / nicheTotal) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Top businesses */}
      <EyebrowLabel>Classement des commerces · 7 j</EyebrowLabel>
      <div className="space-y-2.5">
        {d.top.length === 0 && <EmptyNote>Aucun commerce inscrit.</EmptyNote>}
        {d.top.slice(0, 8).map((b, i) => (
          <Card key={b.id} className="!p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-6 shrink-0 text-center font-mono text-xs text-muted">{i + 1}</span>
              <span className="w-10 h-10 shrink-0 rounded-xl bg-ochre-soft text-ochre flex items-center justify-center">
                <NicheIcon niche={b.nicheKey} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{b.name}</p>
                <p className="text-xs text-muted truncate">
                  {b.niche} · {b.owner}
                </p>
              </div>
              <p className="font-mono text-xs font-medium shrink-0">{fmt(b.sales7)}</p>
            </div>
            <div className="mt-2.5 ml-9 h-1.5 rounded-full bg-cream overflow-hidden">
              <div className="h-full rounded-full bg-ochre bar-grow" style={{ width: `${Math.max(b.sales7 > 0 ? 3 : 0, b.share)}%` }} />
            </div>
          </Card>
        ))}
      </div>
      {d.top.length > 8 && (
        <p className="text-center text-xs text-muted mt-3">+ {d.top.length - 8} autres commerces</p>
      )}

      {/* Users */}
      <EyebrowLabel>Utilisateurs</EyebrowLabel>
      <AdminUsers users={d.users} />

      <div className="text-center mt-8">
        <Link href="/dashboard" className="text-sm text-indigo underline underline-offset-2">
          ← Retour à mon commerce
        </Link>
      </div>
    </main>
  );
}
