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
