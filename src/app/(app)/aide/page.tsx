import { requireUserAndBusiness } from "@/lib/data";
import { hasServices } from "@/lib/niches";
import { Card, EyebrowLabel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AidePage() {
  const { business } = await requireUserAndBusiness();
  const showsServices = hasServices(business.type);

  const sections = [
    {
      title: "Tableau de bord",
      icon: "◆",
      body: "Votre écran d'accueil. Il affiche le chiffre d'affaires et les dépenses du jour, ainsi qu'un aperçu rapide de la santé de votre commerce.",
    },
    {
      title: showsServices ? "Vente & rendez-vous" : "Vente",
      icon: "＋",
      body: showsServices
        ? "Choisissez un produit et la quantité vendue, ou prenez un rendez-vous pour un service. Vous pouvez aussi enregistrer une vente passée que vous auriez oubliée, avec sa date."
        : "Choisissez un produit et la quantité vendue — c'est enregistré immédiatement, même hors connexion. Vous pouvez aussi enregistrer une vente passée que vous auriez oubliée, avec sa date.",
    },
    {
      title: "Catalogue",
      icon: "▤",
      body: "Ajoutez vos produits ou services, avec leur prix et leur catégorie. Le suivi de stock est optionnel et se change à tout moment ici : utile pour une boutique, pas nécessaire pour les plats d'un restaurant par exemple. Quand il est activé, le stock diminue automatiquement à chaque vente.",
    },
    {
      title: "Dépenses",
      icon: "▼",
      body: "Notez vos dépenses au fil de l'eau — loyer, ingrédients, transport. Vous pouvez choisir une date passée pour rattraper un jour où vous n'aviez pas encore l'application.",
    },
    {
      title: "Statistiques",
      icon: "▲",
      body: "Suivez votre chiffre d'affaires dans le temps, comparez les jours, et voyez quels produits ou services se vendent le mieux.",
    },
    {
      title: "Paramètres",
      icon: "⚙",
      body: "Vos informations, le nom et les réglages de votre commerce, l'apparence de l'application, et ce guide — tout est accessible depuis l'icône en haut de l'écran, sur n'importe quelle page.",
    },
  ];

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Aide</p>
      <h1 className="font-display text-2xl font-semibold mb-2">Comment utiliser Business Board</h1>
      <p className="text-sm text-muted mb-6">
        Un rappel rapide de ce que chaque onglet permet de faire.
      </p>

      {sections.map((s) => (
        <Card key={s.title} className="mb-3 flex gap-3.5">
          <span className="w-9 h-9 rounded-full bg-ochre-soft flex items-center justify-center text-base shrink-0">
            {s.icon}
          </span>
          <div>
            <p className="text-sm font-medium mb-1">{s.title}</p>
            <p className="text-xs text-muted leading-relaxed">{s.body}</p>
          </div>
        </Card>
      ))}

      <EyebrowLabel>Bon à savoir</EyebrowLabel>
      <Card>
        <p className="text-xs text-muted leading-relaxed">
          Les pages déjà consultées restent visibles même sans connexion, pratique pour revoir
          vos derniers chiffres. Enregistrer une nouvelle vente ou dépense demande en revanche une
          connexion internet au moment de l&apos;enregistrement. Vous pouvez aussi installer
          l&apos;application sur l&apos;écran d&apos;accueil de votre téléphone pour y accéder comme une
          vraie application.
        </p>
      </Card>
    </div>
  );
}
