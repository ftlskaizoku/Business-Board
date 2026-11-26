"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setUserAllowed(userId: string, allowed: boolean) {
  const { user } = await requireAdmin();

  // Never let the admin lock themself out by mistake.
  if (!UUID_RE.test(userId) || userId === user.id) return;

  // is_allowed can no longer be written with a normal user session (see
  // security-hardening.sql), so the admin gate above + the service role do it.
  const admin = createAdminClient();
  await admin.from("profiles").update({ is_allowed: allowed === true }).eq("id", userId);
  revalidatePath("/admin");
}

// Permanently deletes the auth account. Cascades (defined in schema.sql) take
// the profile and every business they own — products, sales, expenses,
// everything — down with it. There's no undo.
export async function deleteUserAccount(userId: string) {
  const { user } = await requireAdmin();

  if (!UUID_RE.test(userId)) return { error: "Identifiant invalide." };
  // Never let the admin delete themself.
  if (userId === user.id) return { error: "Vous ne pouvez pas supprimer votre propre compte." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { error: null };
}
