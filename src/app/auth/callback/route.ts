import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google (and any future OAuth provider) redirects here with a one-time
// "code" after the person approves the consent screen. We exchange it for a
// real session, then hand off to "/" — which already knows whether to send
// a first-time signer to /onboarding or a returning one to /dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Missing/expired code, or the person cancelled on Google's side.
  return NextResponse.redirect(`${origin}/auth?error=oauth`);
}
