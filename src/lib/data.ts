import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Business, Profile } from "@/lib/types";

// Wrapped in React's cache() so that no matter how many Server Components in
// the same request tree call these (layout + page commonly both need the
// user/profile/business), the underlying Supabase queries run once instead
// of once per component. Before this, a single page like Paramètres could
// trigger auth.getUser() + 3 separate "profiles" queries + a "businesses"
// query, all sequential network round trips — this is what made it feel slow.

export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return { supabase, user };
});

// Same as requireUser(), but also blocks accounts the admin has disallowed.
// requireUser() itself stays "auth only" so /blocked can use it without looping.
// Fetches the full profile row (not just is_allowed) so downstream callers
// (layout's tutorial banner, Paramètres) can reuse it instead of re-querying.
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
  const { supabase, user, profile } = await requireAllowedUser();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .returns<Business[]>();

  if (!businesses || businesses.length === 0) redirect("/onboarding");

  return { supabase, user, profile, business: businesses[0], businesses };
});
