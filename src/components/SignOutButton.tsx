"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="text-xs text-muted"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        // Drop cached page HTML so the next person on this device doesn't
        // see this account's data while offline.
        navigator.serviceWorker?.controller?.postMessage("CLEAR_PAGES_CACHE");
        router.push("/auth");
        router.refresh();
      }}
    >
      Déconnexion
    </button>
  );
}
