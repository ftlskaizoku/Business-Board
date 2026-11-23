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

/** "Aujourd'hui", "Hier", otherwise "jeu. 12 nov." for a YYYY-MM-DD key. */
export function dayLabelFr(key: string, today: string = todayKey()) {
  if (key === today) return "Aujourd'hui";
  const d = new Date(key + "T00:00:00Z");
  const y = new Date(today + "T00:00:00Z");
  y.setUTCDate(y.getUTCDate() - 1);
  if (d.getTime() === y.getTime()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** "novembre 2026" for a YYYY-MM key. */
export function monthLabelFr(month: string, style: "long" | "short" = "long") {
  const d = new Date(month + "-01T00:00:00Z");
  return d.toLocaleDateString("fr-FR", {
    month: style,
    year: style === "long" ? "numeric" : "2-digit",
    timeZone: "UTC",
  });
}

/** Groups rows (already sorted newest first) by a YYYY-MM-DD field. */
export function groupByDay<T>(rows: T[], dateOf: (r: T) => string) {
  const out: { date: string; rows: T[] }[] = [];
  for (const r of rows) {
    const k = dateOf(r);
    const last = out[out.length - 1];
    if (last && last.date === k) last.rows.push(r);
    else out.push({ date: k, rows: [r] });
  }
  return out;
}
