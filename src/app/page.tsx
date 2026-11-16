import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { THEMES } from "@/lib/themes";
import { Sparkline } from "@/components/charts";
import Donut, { sliceColor } from "@/components/Donut";

const FEATURES = [
  {
    title: "Ventes en un tap",
    text: "Choisissez un produit ou un service, la quantité, et c'est enregistré. Vous pouvez aussi saisir une vente d'un jour passé.",
    path: "M12 5v14M5 12h14",
  },
  {
    title: "Catalogue & stock",
    text: "Ajoutez vos produits ou services. Le suivi de stock est optionnel : utile pour une boutique, pas obligatoire pour un restaurant.",
    path: "M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4",
  },
  {
    title: "Dépenses",
    text: "Notez vos dépenses au jour le jour, avec vos propres noms que l'application retient pour la prochaine fois.",
    path: "M3 8l9 5 9-5M5 8v9a2 2 0 002 2h10a2 2 0 002-2V8M9 4h6",
  },
  {
    title: "Statistiques claires",
    text: "Chiffre d'affaires, meilleures ventes, répartition des dépenses, tendance de la semaine : sans tableur.",
    path: "M4 20V10m6 10V4m6 16v-7m4 7H3",
  },
];

const STEPS = [
  { title: "Créez votre commerce", text: "Choisissez votre activité et donnez un nom à votre commerce. Cela prend une minute." },
  { title: "Enregistrez au quotidien", text: "Ajoutez vos ventes et vos dépenses en quelques taps, depuis votre téléphone." },
  { title: "Suivez vos résultats", text: "Votre profit, vos tendances et votre stock sont calculés pour vous." },
];

const SAMPLE_TREND = [12, 18, 14, 24, 21, 30, 38];
const SAMPLE_EXPENSES = [
  { name: "Achats", value: 45 },
  { name: "Transport", value: 25 },
  { name: "Loyer", value: 20 },
  { name: "Autres", value: 10 },
];

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default async function RootPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (userId) {
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .limit(1);

    if (!businesses || businesses.length === 0) redirect("/onboarding");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-cream/85 backdrop-blur-md border-b border-line">
        <div className="px-5 py-3.5 flex items-center justify-between max-w-5xl mx-auto w-full gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-ochre flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20V10m6 10V4m6 16v-7" />
              </svg>
            </span>
            <span className="font-display font-semibold text-lg">Business Board</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
            <a href="#fonctionnalites" className="hover:text-ink transition-colors">Fonctionnalités</a>
            <a href="#comment" className="hover:text-ink transition-colors">Comment ça marche</a>
            <a href="#themes" className="hover:text-ink transition-colors">Thèmes</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth?mode=signin" className="text-sm font-medium px-3 py-2">
              Se connecter
            </Link>
            <Link href="/auth" className="hidden sm:inline-block bg-ochre rounded-full px-4 py-2 text-sm font-medium">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-5 pt-12 pb-10 max-w-5xl mx-auto w-full text-center">
          <p className="inline-block text-xs font-medium text-ochre bg-ochre-soft rounded-full px-3.5 py-1.5 mb-5">
            Fait pour les commerces d&apos;Afrique de l&apos;Ouest
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.1] mb-5 max-w-2xl mx-auto">
            Le tableau de bord de votre commerce, <span className="text-ochre">dans votre poche</span>
          </h1>
          <p className="text-muted text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Restaurant, boutique, salon, prestataire ou e-commerce : enregistrez vos ventes et dépenses, suivez votre
            stock si besoin, et voyez où en est votre commerce en un coup d&apos;œil. En FCFA, en français.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link href="/auth" className="bg-ochre rounded-full py-3.5 px-7 font-medium card-surface active:scale-[0.98] transition-transform">
              Créer mon compte gratuitement
            </Link>
            <Link href="/auth?mode=signin" className="bg-card border border-line rounded-full py-3.5 px-7 font-medium active:scale-[0.98] transition-transform">
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p className="text-xs text-muted flex flex-wrap justify-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><span className="text-green"><Check /></span>Gratuit</span>
            <span className="inline-flex items-center gap-1.5"><span className="text-green"><Check /></span>Installable sur téléphone</span>
            <span className="inline-flex items-center gap-1.5"><span className="text-green"><Check /></span>Écrans consultables hors connexion</span>
          </p>
        </section>

        {/* Product preview built from the app's own widgets, with example numbers */}
        <section className="px-5 pb-14 max-w-4xl mx-auto w-full">
          <div className="rounded-[28px] border border-line bg-card p-3 sm:p-5" style={{ boxShadow: "var(--shadow-lift)" }}>
            <div className="flex items-center gap-1.5 px-1 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-soft" />
              <span className="w-2.5 h-2.5 rounded-full bg-ochre-soft" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-soft" />
              <span className="ml-auto text-[11px] text-muted">Aperçu avec des données d&apos;exemple</span>
            </div>
            <div className="rounded-2xl bg-cream p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="col-span-2 sm:col-span-3 rounded-2xl bg-green-soft p-4">
                <p className="text-sm text-green mb-1">Profit net</p>
                <p className="font-mono text-2xl sm:text-3xl font-medium text-green">+ 84 500 FCFA</p>
                <p className="text-xs text-muted mt-1">Ventes moins dépenses d&apos;aujourd&apos;hui</p>
              </div>
              <div className="sm:col-span-3 rounded-2xl bg-card border border-line p-4 col-span-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted">Ventes sur la semaine</p>
                    <p className="font-mono text-lg font-medium">412 000 FCFA</p>
                  </div>
                  <span className="rounded-full bg-green-soft text-green text-[11px] font-mono font-medium px-2 py-0.5">▲ +18%</span>
                </div>
                <div className="text-green mt-2">
                  <Sparkline values={SAMPLE_TREND} />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-4 rounded-2xl bg-card border border-line p-4">
                <p className="text-xs text-muted mb-3">Dernières ventes</p>
                {[
                  ["Poulet braisé ×3", "+ 12 000 FCFA"],
                  ["Jus de bissap ×5", "+ 5 000 FCFA"],
                  ["Thiéboudienne ×2", "+ 8 000 FCFA"],
                ].map(([n, v]) => (
                  <div key={n} className="flex justify-between gap-2 text-sm py-1.5 border-t border-line first:border-t-0">
                    <span className="truncate">{n}</span>
                    <span className="font-mono text-xs text-green shrink-0 self-center">{v}</span>
                  </div>
                ))}
              </div>
              <div className="col-span-2 rounded-2xl bg-card border border-line p-4 flex flex-col items-center justify-center">
                <p className="text-xs text-muted mb-2 self-start">Dépenses</p>
                <Donut slices={SAMPLE_EXPENSES} centerLabel="Total" centerValue="100%" />
                <div className="flex gap-1.5 mt-3">
                  {SAMPLE_EXPENSES.map((e, i) => (
                    <span key={e.name} className="w-2 h-2 rounded-full" style={{ background: sliceColor(i) }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="fonctionnalites" className="px-5 pb-14 max-w-5xl mx-auto w-full scroll-mt-20">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-muted font-medium mb-2">Fonctionnalités</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Tout ce qu&apos;il faut, rien de compliqué</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-line rounded-[20px] card-surface p-5">
                <span className="w-11 h-11 rounded-2xl bg-ochre-soft text-ochre flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={f.path} />
                  </svg>
                </span>
                <p className="font-medium mb-1.5">{f.title}</p>
                <p className="text-sm text-muted leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="comment" className="px-5 pb-14 max-w-5xl mx-auto w-full scroll-mt-20">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-muted font-medium mb-2">Comment ça marche</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Prêt en trois étapes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {STEPS.map((st, i) => (
              <div key={st.title} className="bg-card border border-line rounded-[20px] card-surface p-5">
                <span className="w-9 h-9 rounded-full bg-ochre flex items-center justify-center font-mono text-sm font-medium mb-4">
                  {i + 1}
                </span>
                <p className="font-medium mb-1.5">{st.title}</p>
                <p className="text-sm text-muted leading-relaxed">{st.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Themes */}
        <section id="themes" className="px-5 pb-14 max-w-5xl mx-auto w-full scroll-mt-20">
          <div className="bg-card border border-line rounded-[28px] card-surface p-6 sm:p-8 text-center">
            <p className="text-xs uppercase tracking-widest text-muted font-medium mb-2">Personnalisation</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">
              {THEMES.length} thèmes, clairs et sombres
            </h2>
            <p className="text-sm text-muted mb-6 max-w-md mx-auto">
              Choisissez les couleurs qui vous plaisent. Votre choix est retenu à chaque ouverture de l&apos;application.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {THEMES.map((t) => (
                <span
                  key={t.id}
                  title={t.label}
                  className="w-12 h-12 rounded-2xl border border-line flex items-center justify-center"
                  style={{ background: t.bg }}
                >
                  <span className="w-5 h-5 rounded-full" style={{ background: t.swatch }} />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-5 pb-16 max-w-5xl mx-auto w-full">
          <div className="bg-ochre rounded-[28px] p-8 sm:p-12 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3">Prenez le contrôle de votre commerce</h2>
            <p className="text-sm opacity-90 max-w-md mx-auto mb-6">
              Installable sur votre téléphone comme une vraie application. Créez votre compte en une minute.
            </p>
            <Link href="/auth" className="inline-block bg-card text-ink rounded-full py-3.5 px-7 font-medium active:scale-[0.98] transition-transform">
              Commencer maintenant →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-6 text-center text-xs text-muted">Business Board</footer>
    </div>
  );
}
