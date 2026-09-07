import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";

// Single hard-coded admin account. Matched against the signed-in user's email.
export const ADMIN_EMAIL = "khalifadylla@gmail.com";

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/dashboard");
  }
  return { supabase, user };
}
