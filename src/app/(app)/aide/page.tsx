import { requireUserAndBusiness } from "@/lib/data";
import { hasServices } from "@/lib/niches";
import { Card, PageHeader, SectionHeader } from "@/components/ui";
import { NAV_ICONS } from "@/lib/nav-icons";

export const dynamic = "force-dynamic";

export default async function AidePage() {
  const { business } = await requireUserAndBusiness();
  const showsServices = hasServices(business.type);

  const sections = [
    {
      title: "Tableau de bord",
      icon: "/dashboard",
      body: "Votre écran d'accueil. Il affiche le chiffre d'affaires et les dépenses du jour, ainsi qu'un aperçu rapide de la santé de votre commerce.",
    },
    {
      title: showsServices ? "Vente & rendez-vous" : "Vente",
      icon: "/vente",
      body: showsServices
        ? "Choisissez un produit et la quantité vendue, ou prenez un rendez-vous pour un service. Vous pouvez aussi enregistrer une vente passée que vous auriez oubliée, avec sa date."
        : "Choisissez un produit et la quantité vendue — c'est enregistré immédiatement, même hors connexion. Vous pouvez aussi enregistrer une vente passée que vous auriez oubliée, avec sa date.",
    },
    {
      title: "Catalogue",
      icon: "/catalogue",
      body: "Ajoutez vos produits ou services, avec leur prix et leur catégorie. Le suivi de stock est optionnel et se change à tout moment ici : utile pour une boutique, pas nécessaire pour les plats d'un restaurant par exemple. Quand il est activé, le stock diminue automatiquement à chaque vente.",
    },
    {
      title: "Dépenses",
      icon: "/depenses",
      body: "Notez vos dépenses au fil de l'eau — loyer, ingrédients, transport. Vous pouvez choisir une date passée pour rattraper un jour où vous n'aviez pas encore l'application.",
    },
    {
      title: "Statistiques",
      icon: "/stats",
      body: "Suivez votre chiffre d'affaires dans le temps, comparez les jours, et voyez quels produits ou services se vendent le mieux.",
    },
    {
      title: "Paramètres",
      icon: "gear",
      body: "Vos informations, le nom et les réglages de votre commerce, l'apparence de l'application, et ce guide — tout est accessible depuis l'icône en haut de l'écran, sur n'importe quelle page.",
    },
  ];

  const GEAR = (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Aide"
        title="Comment utiliser Business Board"
        subtitle="Un rappel rapide de ce que chaque onglet permet de faire. Pour une visite guidée directement sur chaque écran, allez dans Paramètres → Visite guidée."
      />

      <div className="grid md:grid-cols-2 gap-3">
        {sections.map((s) => (
          <Card key={s.title} className="flex gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-ochre-soft text-ochre flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {s.icon === "gear" ? GEAR : NAV_ICONS[s.icon]}
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold mb-1">{s.title}</p>
              <p className="text-[13px] text-muted leading-relaxed [text-wrap:pretty]">{s.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <SectionHeader title="Bon à savoir" />
      <Card>
        <p className="text-[13px] text-muted leading-relaxed [text-wrap:pretty]">
          Les pages déjà consultées restent visibles même sans connexion, pratique pour revoir vos derniers chiffres.
          Enregistrer une nouvelle vente ou dépense demande en revanche une connexion internet au moment de
          l&apos;enregistrement. Vous pouvez aussi installer l&apos;application sur l&apos;écran d&apos;accueil de votre
          téléphone pour y accéder comme une vraie application.
        </p>
      </Card>
    </div>
  );
}
