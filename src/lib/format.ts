export function fmt(amount: number, currency: string = "FCFA") {
  return Math.round(amount).toLocaleString("fr-FR") + " " + currency;
}

export function fmtK(amount: number) {
  const sign = amount >= 0 ? "+" : "-";
  const abs = Math.abs(Math.round(amount));
  return sign + (abs >= 1000 ? Math.round(abs / 1000) + "k" : String(abs));
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoKey(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** "il y a 3 j", "il y a 2 h"… for a past ISO timestamp. */
export function timeAgoFr(iso: string, now: number = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.floor(d / 365);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

/** "12 nov. 2026". Pinned to UTC so server and browser always agree. */
export function dateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
