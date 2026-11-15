import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Business, Profile } from "@/lib/types";

// Wrapped in React's cache() so that no matter how many Server Components in
// the same request tree call these (layout + page commonly both need the
// user/profile/business), the underlying Supabase queries run once instead
// of once per component.
//
// Speed notes (this runs on every page navigation):
// - Identity comes from auth.getClaims(), which verifies the session JWT
//   locally when the project uses asymmetric signing keys (and falls back to
//   a server check like getUser() when it doesn't) — instead of always
//   making a network round trip to Supabase Auth.
// - The profile and business lookups don't depend on each other, so they
//   run in parallel rather than one after the other.

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
}

export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/auth");
  const user: AppUser = {
    id: claims.sub,
    email: claims.email ?? null,
    phone: claims.phone ?? null,
  };
  return { supabase, user };
});

// Same as requireUser(), but also blocks accounts the admin has disallowed.
// requireUser() itself stays "auth only" so /blocked can use it without looping.
export const requireAllowedUser = cache(async () => {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profile && profile.is_allowed === false) {
    redirect("/blocked");
  }

  return { supabase, user, profile: profile ?? null };
});

export const requireUserAndBusiness = cache(async () => {
  const { supabase, user } = await requireUser();

  const [{ data: profileRow }, { data: businesses }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .returns<Business[]>(),
  ]);
  const profile = profileRow ?? null;

  // Blocked check first, so a blocked account never lands on onboarding.
  if (profile && profile.is_allowed === false) redirect("/blocked");
  if (!businesses || businesses.length === 0) redirect("/onboarding");

  return { supabase, user, profile, business: businesses[0], businesses };
});
