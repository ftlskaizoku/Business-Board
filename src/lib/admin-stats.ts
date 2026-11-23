import { nicheLabel } from "@/lib/niches";
import { dateFr, timeAgoFr } from "@/lib/format";
import type { Business, Niche, Profile } from "@/lib/types";

export interface SaleRow {
  business_id: string;
  total: number;
  sale_date: string; // YYYY-MM-DD
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  business: string | null;
  niche: string | null;
  allowed: boolean;
  isSelf: boolean;
  joined: string;
  ago: string;
}

export interface TopBusiness {
  id: string;
  name: string;
  nicheKey: Niche;
  niche: string;
  owner: string;
  sales7: number;
  /** 0–100, relative to the best business of the week. */
  share: number;
}

export interface AdminOverviewData {
  usersCount: number;
  blockedCount: number;
  newUsers7: number;
  businessesCount: number;
  newBusinesses7: number;
  activeBusinesses: number;
  sales7: number;
  /** % vs the previous 7 days, or null when there is nothing to compare to. */
  salesDelta: number | null;
  trend: { label: string; title: string; a: number }[];
  niches: { name: string; value: number }[];
  users: AdminUser[];
  top: TopBusiness[];
}

function addDays(key: string, n: number) {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Turns the three raw tables into everything the admin screen shows.
 * Pure (no I/O, `today` is passed in) so the numbers can be tested.
 * `sales` is expected to cover the last 14 days (today and the 13 before).
 */
export function buildAdminOverview(opts: {
  businesses: Business[];
  sales: SaleRow[];
  profiles: Profile[];
  selfId: string;
  today: string; // YYYY-MM-DD
  now?: number;
}): AdminOverviewData {
  const { businesses, sales, profiles, selfId, today } = opts;
  const now = opts.now ?? Date.now();
  const weekStart = addDays(today, -6);

  const byDay: Record<string, number> = {};
  const byBusiness7: Record<string, number> = {};
  let sales7 = 0;
  let prev7 = 0;
  for (const s of sales) {
    byDay[s.sale_date] = (byDay[s.sale_date] || 0) + s.total;
    if (s.sale_date >= weekStart) {
      sales7 += s.total;
      byBusiness7[s.business_id] = (byBusiness7[s.business_id] || 0) + s.total;
    } else {
      prev7 += s.total;
    }
  }

  const trend = Array.from({ length: 14 }, (_, i) => {
    const key = addDays(today, i - 13);
    return {
      label: key.slice(8),
      title: new Date(key + "T00:00:00Z").toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }),
      a: byDay[key] || 0,
    };
  });

  // Niche split: top 4 + everything else grouped, so the donut stays readable.
  const counts: Record<string, number> = {};
  for (const b of businesses) {
    const k = nicheLabel(b.niche, b.custom_niche);
    counts[k] = (counts[k] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const niches = sorted.slice(0, 4).map(([name, value]) => ({ name, value }));
  const rest = sorted.slice(4).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) niches.push({ name: "Autres", value: rest });

  const businessByOwner: Record<string, Business> = {};
  const ownerName: Record<string, string> = {};
  for (const b of businesses) businessByOwner[b.owner_id] = b;
  for (const p of profiles) ownerName[p.id] = p.full_name || p.email || p.phone || "Sans nom";

  const users: AdminUser[] = profiles.map((p) => {
    const biz = businessByOwner[p.id];
    return {
      id: p.id,
      name: p.full_name || p.email || p.phone || "Sans nom",
      email: p.email,
      phone: p.phone,
      business: biz ? biz.name : null,
      niche: biz ? nicheLabel(biz.niche, biz.custom_niche) : null,
      allowed: p.is_allowed,
      isSelf: p.id === selfId,
      joined: dateFr(p.created_at),
      ago: timeAgoFr(p.created_at, now),
    };
  });

  const best = Math.max(1, ...businesses.map((b) => byBusiness7[b.id] || 0));
  const top: TopBusiness[] = businesses
    .map((b) => ({
      id: b.id,
      name: b.name,
      nicheKey: b.niche,
      niche: nicheLabel(b.niche, b.custom_niche),
      owner: ownerName[b.owner_id] || "—",
      sales7: byBusiness7[b.id] || 0,
      share: ((byBusiness7[b.id] || 0) / best) * 100,
    }))
    .sort((a, b) => b.sales7 - a.sales7);

  return {
    usersCount: profiles.length,
    blockedCount: profiles.filter((p) => !p.is_allowed).length,
    newUsers7: profiles.filter((p) => p.created_at.slice(0, 10) >= weekStart).length,
    businessesCount: businesses.length,
    newBusinesses7: businesses.filter((b) => b.created_at.slice(0, 10) >= weekStart).length,
    activeBusinesses: businesses.filter((b) => (byBusiness7[b.id] || 0) > 0).length,
    sales7,
    salesDelta: prev7 > 0 ? Math.round(((sales7 - prev7) / prev7) * 100) : null,
    trend,
    niches,
    users,
    top,
  };
}
