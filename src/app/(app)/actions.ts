"use server";

import { revalidatePath } from "next/cache";
import { requireUserAndBusiness } from "@/lib/data";
import { todayKey } from "@/lib/format";

export async function addExpense(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const category = String(formData.get("category") || "Autre");
  const amount = Number(formData.get("amount") || 0);
  const note = String(formData.get("note") || "");
  if (!amount) return;

  await supabase.from("expenses").insert({
    business_id: business.id,
    expense_date: todayKey(),
    category,
    amount,
    note,
  });
  revalidatePath("/depenses");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function addProduct(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "Autre").trim() || "Autre";
  const price = Number(formData.get("price") || 0);
  const stock = Number(formData.get("stock") || 0);
  if (!name || !price) return;

  await supabase.from("products").insert({ business_id: business.id, name, category, price, stock });
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function deleteProduct(productId: string) {
  const { supabase, business } = await requireUserAndBusiness();
  await supabase.from("products").delete().eq("id", productId).eq("business_id", business.id);
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function addService(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "Autre").trim() || "Autre";
  const duration = String(formData.get("duration") || "").trim() || "—";
  const price = Number(formData.get("price") || 0);
  if (!name || !price) return;

  await supabase.from("services").insert({ business_id: business.id, name, category, duration, price });
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function deleteService(serviceId: string) {
  const { supabase, business } = await requireUserAndBusiness();
  await supabase.from("services").delete().eq("id", serviceId).eq("business_id", business.id);
  revalidatePath("/catalogue");
  revalidatePath("/vente");
}

export async function checkout(cart: { productId: string; qty: number }[]) {
  const { supabase, business } = await requireUserAndBusiness();
  if (!cart.length) return;

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .eq("business_id", business.id)
    .in(
      "id",
      cart.map((c) => c.productId)
    );
  if (!products) return;

  const lines = cart
    .map((c) => {
      const p = products.find((x) => x.id === c.productId);
      if (!p) return null;
      return { productId: p.id, name: p.name, price: p.price, qty: c.qty, newStock: p.stock - c.qty };
    })
    .filter((l): l is NonNullable<typeof l> => !!l);

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

  await Promise.all(
    lines.map((l) => supabase.from("products").update({ stock: l.newStock }).eq("id", l.productId))
  );

  revalidatePath("/vente");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/catalogue");
}

export async function bookSlot(formData: FormData) {
  const { supabase, business } = await requireUserAndBusiness();
  const slotTime = String(formData.get("slotTime") || "");
  const serviceId = String(formData.get("serviceId") || "");
  const clientName = String(formData.get("clientName") || "Nouveau client");
  if (!slotTime) return;

  const { data: service } = serviceId
    ? await supabase.from("services").select("name, price").eq("id", serviceId).single()
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
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!name) return;
  await supabase.from("customers").insert({ business_id: business.id, name, phone: phone || null });
  revalidatePath("/clients");
}
