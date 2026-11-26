import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";

// Single hard-coded admin account. Keep in sync with is_admin() in
// supabase/security-hardening.sql.
export const ADMIN_EMAIL = "khalifadylla@gmail.com";

// Admin = the account owning ADMIN_EMAIL *and* having confirmed it.
// getClaims() alone reads the email from the token; here we additionally ask
// Supabase Auth (getUser) so that an unconfirmed sign-up using the admin's
// address can never pass, even if "Confirm email" is switched off.
export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  const ok =
    !!u &&
    u.id === user.id &&
    (u.email || "").trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    !!u.email_confirmed_at;
  if (!ok) redirect("/dashboard");
  return { supabase, user };
}
