"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setUserAllowed(userId: string, allowed: boolean) {
  const { supabase, user } = await requireAdmin();

  // Never let the admin lock themself out by mistake.
  if (userId === user.id) return;

  await supabase.from("profiles").update({ is_allowed: allowed }).eq("id", userId);
  revalidatePath("/admin");
}

// Permanently deletes the auth account. Cascades (defined in schema.sql) take
// the profile and every business they own — products, sales, expenses,
// everything — down with it. There's no undo.
export async function deleteUserAccount(userId: string) {
  const { user } = await requireAdmin();

  // Never let the admin delete themself.
  if (userId === user.id) return { error: "Vous ne pouvez pas supprimer votre propre compte." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}
