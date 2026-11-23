// Week / month / year helpers for the Stats page. Everything is a plain
// YYYY-MM-DD string pinned to UTC (like the rest of the app), so the server
// and the browser always agree on which day a sale belongs to.

export type View = "week" | "month" | "year";

export const VIEWS: { id: View; label: string }[] = [
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
];

const parse = (key: string) => new Date(key + "T00:00:00Z");
const toKey = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(key: string, n: number) {
  const d = parse(key);
  d.setUTCDate(d.getUTCDate() + n);
  return toKey(d);
}

export function weekStart(key: string) {
  return addDays(key, -((parse(key).getUTCDay() + 6) % 7));
}

export function cleanView(v: string | undefined): View {
  return v === "week" || v === "year" ? v : "month";
}

export function isKeyOf(view: View, key: string | undefined): key is string {
  if (!key) return false;
  const re = view === "week" ? /^\d{4}-\d{2}-\d{2}$/ : view === "month" ? /^\d{4}-\d{2}$/ : /^\d{4}$/;
  return re.test(key) && !Number.isNaN(parse(view === "year" ? key + "-01-01" : view === "month" ? key + "-01" : key).getTime());
}

/** The period of the given view that contains this day. */
export function periodKeyOf(view: View, dateKey: string) {
  return view === "week" ? weekStart(dateKey) : view === "month" ? dateKey.slice(0, 7) : dateKey.slice(0, 4);
}

/** First and last day (inclusive) of a period. */
export function periodRange(view: View, key: string) {
  if (view === "week") return { start: key, end: addDays(key, 6) };
  if (view === "month") {
    const [y, m] = key.split("-").map(Number);
    return { start: `${key}-01`, end: toKey(new Date(Date.UTC(y, m, 0))) };
  }
  return { start: `${key}-01-01`, end: `${key}-12-31` };
}

export function prevPeriodKey(view: View, key: string) {
  if (view === "week") return addDays(key, -7);
  if (view === "month") {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 2, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return String(Number(key) - 1);
}

export function eachDay(start: string, end: string) {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

const fr = (key: string, opts: Intl.DateTimeFormatOptions) =>
  parse(key).toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });

/** "16 – 22 nov. 2026", "novembre 2026", "2026" (long) or compact for the strip. */
export function periodLabel(view: View, key: string, style: "long" | "short" = "long") {
  if (view === "year") return key;
  if (view === "month") {
    return fr(key + "-01", style === "long" ? { month: "long", year: "numeric" } : { month: "short", year: "2-digit" });
  }
  const { start, end } = periodRange("week", key);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const a = sameMonth ? String(Number(start.slice(8))) : fr(start, { day: "numeric", month: "short" });
  const b = fr(end, { day: "numeric", month: "short" });
  return style === "long" ? `${a} – ${b} ${end.slice(0, 4)}` : `${a}–${b}`;
}

export const PREV_WORD: Record<View, string> = {
  week: "sem. précédente",
  month: "mois précédent",
  year: "année précédente",
};
