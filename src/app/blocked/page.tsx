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
    <main className="min-h-[100dvh] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-card border border-line rounded-[28px] card-surface p-7 sm:p-9 text-center">
        <span className="mx-auto w-14 h-14 rounded-2xl bg-red-soft text-red flex items-center justify-center mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2.5" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </svg>
        </span>
        <h1 className="font-display text-2xl font-semibold mb-2">Accès suspendu</h1>
        <p className="text-sm text-muted leading-relaxed mb-6 [text-wrap:pretty]">
          Votre accès à Business Board a été désactivé par l&apos;administrateur. Contactez-le pour en savoir plus ou
          pour le réactiver.
        </p>
        <div className="rounded-2xl border border-line divide-y divide-line text-sm mb-6 text-left overflow-hidden">
          <a href="mailto:khalifadylla@gmail.com" className="flex items-center justify-between gap-3 px-4 h-12">
            <span className="text-muted">E-mail</span>
            <span className="text-ochre font-medium truncate">khalifadylla@gmail.com</span>
          </a>
          <a href="tel:+221771432688" className="flex items-center justify-between gap-3 px-4 h-12">
            <span className="text-muted">Téléphone</span>
            <span className="text-ochre font-medium font-mono">+221 77 143 26 88</span>
          </a>
        </div>
        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
