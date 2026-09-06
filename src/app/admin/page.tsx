import { requireUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser(); // any signed-in user for now — real role check comes later

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted mb-2">Admin</p>
        <h1 className="font-display text-2xl font-semibold mb-2">Bientôt disponible</h1>
        <p className="text-muted text-sm max-w-sm">
          Cette page sera l&apos;espace d&apos;administration (utilisateurs, commerces, support).
          On la construit dans une prochaine étape.
        </p>
      </div>
    </div>
  );
}
