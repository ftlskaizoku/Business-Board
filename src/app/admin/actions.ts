"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function setUserAllowed(userId: string, allowed: boolean) {
  const { supabase, user } = await requireAdmin();

  // Never let the admin lock themself out by mistake.
  if (userId === user.id) return;

  await supabase.from("profiles").update({ is_allowed: allowed }).eq("id", userId);
  revalidatePath("/admin");
}
