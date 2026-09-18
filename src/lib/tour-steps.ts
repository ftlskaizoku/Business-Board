export interface TourStep {
  id: string;
  page: string;
  // data-tour value of the element to spotlight. Omitted = a centered card
  // with no page element highlighted (used for the intro and closing steps,
  // and as the automatic fallback when a target never appears — e.g. the
  // Stats calendar before a business has any sales yet).
  target?: string;
  title: string;
  body: string;
}

export function buildTourSteps(opts: {
  businessName: string;
  showsServices: boolean;
  showsProducts: boolean;
}): TourStep[] {
  const { businessName, showsServices, showsProducts } = opts;
  const servicesOnly = showsServices && !showsProducts;

  return [
    {
      id: "welcome",
      page: "/dashboard",
      title: `Bienvenue, ${businessName} 👋`,
      body: "Ce guide rapide vous montre l'essentiel, écran par écran — Suivant pour commencer. Vous pourrez le revoir à tout moment depuis Paramètres.",
    },
    {
      id: "dashboard",
      page: "/dashboard",
      target: "dashboard-metrics",
      title: "Le Tableau de bord",
      body: "Votre écran d'accueil : le chiffre d'affaires et les dépenses du jour, en un coup d'œil.",
    },
    {
      id: "vente",
      page: "/vente",
      target: servicesOnly ? "vente-rdv" : "vente-grid",
      title: servicesOnly ? "Rendez-vous" : "Enregistrer une vente",
      body: servicesOnly
        ? "Choisissez un créneau pour prendre un rendez-vous — c'est enregistré immédiatement."
        : "Choisissez un produit, puis la quantité vendue. Plus bas sur cette page, vous pouvez aussi rattraper une vente d'un jour passé.",
    },
    {
      id: "catalogue",
      page: "/catalogue",
      target: "catalogue-form",
      title: "Le Catalogue",
      body: "Ajoutez vos produits ou services ici. Le suivi de stock est optionnel et se change à tout moment — utile pour une boutique, pas nécessaire pour les plats d'un restaurant par exemple.",
    },
    {
      id: "depenses",
      page: "/depenses",
      target: "depenses-form",
      title: "Les Dépenses",
      body: "Notez vos dépenses au fil de l'eau — loyer, ingrédients, transport. Vous pouvez choisir une date passée pour rattraper un jour non enregistré.",
    },
    {
      id: "stats",
      page: "/stats",
      target: "stats-calendar",
      title: "Les Statistiques",
      body: "Votre chiffre d'affaires dans le temps, et vos meilleures ventes — ça se remplit dès vos premières ventes et dépenses.",
    },
    {
      id: "parametres",
      page: "/parametres",
      target: "parametres-theme",
      title: "Paramètres",
      body: "Vos informations, l'apparence de l'application, et ce guide — tout est accessible depuis l'icône ⚙ en haut de l'écran, sur n'importe quelle page.",
    },
    {
      id: "done",
      page: "/parametres",
      title: "C'est parti ! 🎉",
      body: `${businessName} est prêt à démarrer. Revenez sur ce guide à tout moment depuis Paramètres → Aide.`,
    },
  ];
}
