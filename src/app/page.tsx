import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: "＋",
    title: "Ventes en un tap",
    text: "Choisissez un produit ou un service, la quantité, et c'est enregistré. Ça marche aussi hors connexion.",
  },
  {
    icon: "▤",
    title: "Catalogue & stock",
    text: "Ajoutez vos produits ou services. Le suivi de stock est optionnel — utile pour une boutique, pas obligatoire pour un restaurant.",
  },
  {
    icon: "▼",
    title: "Dépenses",
    text: "Notez vos dépenses au jour le jour, même en retard, pour garder une vue juste de ce que vous gagnez vraiment.",
  },
  {
    icon: "▲",
    title: "Statistiques claires",
    text: "Chiffre d'affaires, produits qui se vendent le mieux, tendance sur la semaine — sans tableur.",
  },
];

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    if (!businesses || businesses.length === 0) redirect("/onboarding");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <span className="font-display font-semibold">Business Board</span>
        <Link href="/auth?mode=signin" className="text-sm font-medium text-muted">
          Se connecter
        </Link>
      </header>

      <main className="flex-1 px-5 max-w-3xl mx-auto w-full">
        <section className="py-10 text-center">
          <p className="text-xs uppercase tracking-widest text-muted mb-3">Fait pour les commerces d&apos;Afrique de l&apos;Ouest</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight mb-4">
            Le tableau de bord de votre commerce, dans votre poche
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-md mx-auto mb-8">
            Restaurant, boutique, salon, prestataire ou e-commerce — enregistrez vos ventes et
            dépenses, suivez votre stock si besoin, et voyez où en est votre commerce en un
            coup d&apos;œil. En FCFA, en français, et consultable même sans connexion.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth"
              className="bg-ochre text-white rounded-lg py-3 px-6 font-medium"
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              href="/auth?mode=signin"
              className="border border-line rounded-lg py-3 px-6 font-medium"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-3 pb-10">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-line rounded-xl p-4">
              <span className="w-9 h-9 rounded-full bg-ochre-soft flex items-center justify-center text-base mb-3">
                {f.icon}
              </span>
              <p className="font-medium text-sm mb-1">{f.title}</p>
              <p className="text-xs text-muted leading-relaxed">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="pb-16 text-center">
          <p className="text-xs text-muted mb-2">Installable sur votre téléphone, comme une vraie application.</p>
          <Link href="/auth" className="text-ochre text-sm font-medium">
            Commencer maintenant →
          </Link>
        </section>
      </main>

      <footer className="px-5 py-6 text-center text-xs text-muted">
        Business Board
      </footer>
    </div>
  );
}
