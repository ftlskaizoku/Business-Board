import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function BlockedPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_allowed")
    .eq("id", user.id)
    .single();

  // Access was restored since this page loaded — send them back in.
  if (!profile || profile.is_allowed !== false) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <span className="text-3xl mb-4">🔒</span>
      <h1 className="font-display text-xl font-semibold mb-2">Accès suspendu</h1>
      <p className="text-sm text-muted max-w-xs mb-6">
        Votre accès à Business Board a été désactivé par l&apos;administrateur. Contactez-le
        pour en savoir plus ou pour le réactiver.
      </p>
      <SignOutButton />
    </div>
  );
}
