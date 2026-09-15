import { createClient } from "@supabase/supabase-js";

// Service-role client for privileged admin-only operations — currently just
// deleting an auth user, which needs auth.admin.* and bypasses RLS entirely.
// Only ever call this from code already gated by requireAdmin(). Needs
// SUPABASE_SERVICE_ROLE_KEY set (Supabase dashboard → Settings → API →
// service_role secret) — NOT the anon key, and NEVER prefixed with
// NEXT_PUBLIC_, or it would ship to the browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in your environment variables (Supabase dashboard → Settings → API → service_role) to enable deleting users from the admin page."
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
