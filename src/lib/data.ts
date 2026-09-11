import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Business } from "@/lib/types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return { supabase, user };
}

// Same as requireUser(), but also blocks accounts the admin has disallowed.
// requireUser() itself stays "auth only" so /blocked can use it without looping.
export async function requireAllowedUser() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_allowed")
    .eq("id", user.id)
    .single();

  if (profile && profile.is_allowed === false) {
    redirect("/blocked");
  }

  return { supabase, user };
}

export async function requireUserAndBusiness() {
  const { supabase, user } = await requireAllowedUser();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .returns<Business[]>();

  if (!businesses || businesses.length === 0) redirect("/onboarding");

  return { supabase, user, business: businesses[0], businesses };
}
