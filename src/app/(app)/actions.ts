"use server";

import { revalidatePath } from "next/cache";
import { requireUserAndBusiness, requireAllowedUser } from "@/lib/data";
import { todayKey } from "@/lib/format";

// Accepts a yyyy-mm-dd string from a <input type="date">. Falls back to
// today if missing/malformed, and never lets a date land in the future.
function clampToPastOrToday(raw: string) {
  const today = todayKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return today;
  return raw > today ? today : raw;
}

// Expense names are free text the owner types (and later re-picks from their
// own history), so tidy spacing and cap the length; blank falls back to "Autre".
function cleanExpenseName(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, 60) || "Autre";
}

// ── Input hygiene ────────────────────────────────────────────────────────
// Server actions are public HTTP endpoints: anyone signed in can call them
// with any payload, whatever the form allows. Every number and string is
// re-checked here before it reaches the database.
const MAX_MONEY = 1_000_000_000_000; // 1e12
const MAX_QTY = 100_000;

/** A finite positive amount within sane bounds, or null. */
function cleanAmount(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_MONEY) return null;
  return Math.round(n * 100) / 100;
}
function cleanQty(raw: unknown): number | null {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 1 || n > MAX_QTY) return null;
  return n;
}
function cleanText(raw: unknown, max: number) {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

export async function markTutorialSeen() {
  const { supabase, user } = await requireAllowedUser();
  await supabase.from("profiles").update({ tutorial_seen: true }).eq("id", user.id);
  revalidatePath("/", "layout");
}

export async function updateFullName(formData: FormData) {
  const { supabase, user } = await requireAllowedUser();
  const fullName = cleanText(formData.get("full_name"), 80);
  if (!fullName) return;
  await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  revalidatePath("/parametres");
}

export async function updateBusinessName(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const name = cleanText(formData.get("name"), 80);
  if (!name) return;
  await supabase.from("businesses").update({ name }).eq("id", business.id);
  revalidatePath("/parametres");
  revalidatePath("/dashboard");
}

export async function addExpense(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const category = cleanExpenseName(String(formData.get("category") || ""));
  const amount = cleanAmount(formData.get("amount"));
  const note = cleanText(formData.get("note"), 300);
  const expenseDate = clampToPastOrToday(String(formData.get("date") || ""));
  if (amount === null) return;

  await supabase.from("expenses").insert({
    business_id: business.id,
    expense_date: expenseDate,
    category,
    amount,
    note,
  });
  revalidatePath("/depenses");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function updateExpense(input: {
  expenseId: string;
  date: string;
  category: string;
  amount: number;
  note: string;
}) {
  const { supabase, business } = await requireUserAndBusiness();
  const amount = cleanAmount(input.amount);
  if (!isId(input.expenseId) || amount === null) return;

  await supabase
    .from("expenses")
    .update({
      expense_date: clampToPastOrToday(input.date),
      category: cleanExpenseName(input.category || ""),
      amount,
      note: cleanText(input.note, 300),
    })
    .eq("id", input.expenseId)
    .eq("business_id", business.id);
  revalidatePath("/depenses");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function deleteExpense(expenseId: string) {
  const { supabase, business } = await requireUserAndBusiness();
  if (!isId(expenseId)) return;
  await supabase.from("expenses").delete().eq("id", expenseId).eq("business_id", business.id);
  revalidatePath("/depenses");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function addProduct(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const name = cleanText(formData.get("name"), 120);
  const category = cleanText(formData.get("category"), 60) || "Autre";
  const price = cleanAmount(formData.get("price"));
  // Stock only matters for businesses that track it (e.g. boutiques,
  // e-commerce). A restaurant's dish isn't backed by a countable stock, so
  // it's simply ignored (stored as 0) when tracking is off.
  const stockRaw = Math.round(Number(formData.get("stock") || 0));
  const stock = business.track_stock && Number.isFinite(stockRaw) ? Math.min(MAX_QTY, Math.max(0, stockRaw)) : 0;
  if (!name || price === null) return;

  await supabase.from("products").insert({ business_id: business.id, name, category, price, stock });
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function setTrackStock(trackStock: boolean) {
  const { supabase, business } = await requireUserAndBusiness();
  await supabase.from("businesses").update({ track_stock: trackStock }).eq("id", business.id);
  revalidatePath("/catalogue");
  revalidatePath("/vente");
  revalidatePath("/dashboard");
  revalidatePath("/parametres");
}

// Adds units received to a product's current stock (e.g. +24 after a
// delivery) — the owner enters how many came in, not the new total.
export async function restockProduct(productId: string, quantity: number) {
  const { supabase, business } = await requireUserAndBusiness();
  const add = Math.round(quantity);
  if (!isId(productId) || !Number.isFinite(add) || add <= 0 || add > 1_000_000) return;

  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .eq("business_id", business.id)
    .single();
  if (!product) return;

  await supabase
    .from("products")
    .update({ stock: product.stock + add })
    .eq("id", productId)
    .eq("business_id", business.id);
  revalidatePath("/catalogue");
  revalidatePath("/dashboard");
  revalidatePath("/vente");
}

export async function deleteProduct(productId: string) {
  const { supabase, business } = await requireUserAndBusiness();
  if (!isId(productId)) return;
  await supabase.from("products").delete().eq("id", productId).eq("business_id", business.id);
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function addService(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const name = cleanText(formData.get("name"), 120);
  const category = cleanText(formData.get("category"), 60) || "Autre";
  const duration = cleanText(formData.get("duration"), 30) || "—";
  const price = cleanAmount(formData.get("price"));
  if (!name || price === null) return;

  await supabase.from("services").insert({ business_id: business.id, name, category, duration, price });
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function deleteService(serviceId: string) {
  const { supabase, business } = await requireUserAndBusiness();
  if (!isId(serviceId)) return;
  await supabase.from("services").delete().eq("id", serviceId).eq("business_id", business.id);
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function checkout(cart: { productId: string; qty: number }[]) {
  const { supabase, business } = await requireUserAndBusiness();
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > 200) return;

  // Never trust the browser's cart: keep only well-formed lines, merge
  // duplicates, and force a whole quantity between 1 and MAX_QTY (a negative
  // quantity would otherwise create a negative sale and add stock).
  const wanted = new Map<string, number>();
  for (const c of cart) {
    const qty = cleanQty(c?.qty);
    if (!isId(c?.productId) || qty === null) return;
    wanted.set(c.productId, Math.min(MAX_QTY, (wanted.get(c.productId) ?? 0) + qty));
  }

  // Prices come from the database, never from the client.
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .eq("business_id", business.id)
    .in("id", [...wanted.keys()]);
  if (!products) return;

  const lines = [...wanted.entries()]
    .map(([productId, qty]) => {
      const p = products.find((x) => x.id === productId);
      if (!p) return null;
      return { productId: p.id, name: p.name, price: p.price, qty, newStock: Math.max(0, p.stock - qty) };
    })
    .filter((l): l is NonNullable<typeof l> => !!l);
  if (lines.length === 0) return;

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const { data: sale } = await supabase
    .from("sales")
    .insert({ business_id: business.id, sale_date: todayKey(), total })
    .select("id")
    .single();
  if (!sale) return;

  await supabase.from("sale_items").insert(
    lines.map((l) => ({ sale_id: sale.id, name: l.name, qty: l.qty, price: l.price }))
  );

  // Only spend time updating stock for businesses that actually track it —
  // e.g. a restaurant's dishes aren't backed by a countable stock.
  if (business.track_stock) {
    await Promise.all(
      lines.map((l) =>
        supabase.from("products").update({ stock: l.newStock }).eq("id", l.productId).eq("business_id", business.id)
      )
    );
  }

  revalidatePath("/vente");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/catalogue");
}

// Catch-up entry for a sale that happened on a past day the owner didn't (or
// couldn't) record in the app at the time — no product/stock involved, just
// a lump total against a chosen date.
export async function addManualSale(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const amount = cleanAmount(formData.get("amount"));
  const note = cleanText(formData.get("note"), 120);
  const saleDate = clampToPastOrToday(String(formData.get("date") || ""));
  if (amount === null) return;

  const { data: sale } = await supabase
    .from("sales")
    .insert({ business_id: business.id, sale_date: saleDate, total: amount })
    .select("id")
    .single();
  if (!sale) return;

  await supabase.from("sale_items").insert({
    sale_id: sale.id,
    name: note || "Vente manuelle",
    qty: 1,
    price: amount,
  });

  revalidatePath("/vente");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

// Replaces the sale's date and line items wholesale — simpler and less
// error-prone than diffing against the previous items, since a correction
// might add, remove, or reword a line just as often as it changes a number.
// Note: this doesn't touch product stock counts either way. Stock is already
// treated as an informational running total elsewhere in the app (see
// checkout()), and sale_items doesn't keep a product_id to reliably match
// back to — so a stock count may drift slightly after an edit and can be
// corrected manually from Catalogue if that matters for this business.
export async function updateSale(input: {
  saleId: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
}) {
  const { supabase, business } = await requireUserAndBusiness();
  if (!isId(input.saleId) || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > 100) return;
  const items = input.items.map((it) => ({
    name: cleanText(it?.name, 120) || "Article",
    qty: cleanQty(it?.qty) ?? 1,
    price: Number.isFinite(Number(it?.price)) ? Math.min(MAX_MONEY, Math.max(0, Number(it.price))) : 0,
  }));

  const { data: sale } = await supabase
    .from("sales")
    .select("id")
    .eq("id", input.saleId)
    .eq("business_id", business.id)
    .single();
  if (!sale) return;

  const saleDate = clampToPastOrToday(input.date);
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);

  // Insert the new lines first and delete the old ones only once that worked,
  // so a failed write can never leave a sale with no items.
  const { data: oldItems } = await supabase.from("sale_items").select("id").eq("sale_id", sale.id);
  const { error: insertError } = await supabase.from("sale_items").insert(items.map((it) => ({ sale_id: sale.id, ...it })));
  if (insertError) return;
  const oldIds = (oldItems ?? []).map((o) => o.id);
  if (oldIds.length) await supabase.from("sale_items").delete().in("id", oldIds);
  await supabase.from("sales").update({ sale_date: saleDate, total }).eq("id", sale.id).eq("business_id", business.id);

  revalidatePath("/vente");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function deleteSale(saleId: string) {
  const { supabase, business } = await requireUserAndBusiness();
  if (!isId(saleId)) return;
  await supabase.from("sales").delete().eq("id", saleId).eq("business_id", business.id);
  revalidatePath("/vente");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function bookSlot(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const slotTime = String(formData.get("slotTime") || "");
  const serviceId = String(formData.get("serviceId") || "");
  const clientName = cleanText(formData.get("clientName"), 80) || "Nouveau client";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slotTime)) return;

  const { data: service } = isId(serviceId)
    ? await supabase.from("services").select("name, price").eq("id", serviceId).eq("business_id", business.id).single()
    : { data: null };

  await supabase.from("appointment_slots").insert({
    business_id: business.id,
    slot_date: todayKey(),
    slot_time: slotTime,
    status: "taken",
    client: clientName,
    service_name: service?.name || null,
  });

  if (service) {
    const { data: sale } = await supabase
      .from("sales")
      .insert({ business_id: business.id, sale_date: todayKey(), total: service.price })
      .select("id")
      .single();
    if (sale) {
      await supabase
        .from("sale_items")
        .insert({ sale_id: sale.id, name: service.name, qty: 1, price: service.price });
    }
  }

  revalidatePath("/vente");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function addCustomer(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const name = cleanText(formData.get("name"), 80);
  const phone = cleanText(formData.get("phone"), 30);
  if (!name) return;
  await supabase.from("customers").insert({ business_id: business.id, name, phone: phone || null });
  revalidatePath("/clients");
}
