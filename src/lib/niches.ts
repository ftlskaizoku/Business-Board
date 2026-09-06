import type { Niche, BizType } from "./types";

export interface NicheConfig {
  key: Niche;
  label: string;
  icon: string;
  blurb: string;
  defaultType: BizType;
  allowedTypes: BizType[];
}

export const NICHES: Record<Niche, NicheConfig> = {
  restaurant: {
    key: "restaurant",
    label: "Restaurant",
    icon: "🍽",
    blurb: "Plats, boissons, service en salle",
    defaultType: "products",
    allowedTypes: ["products"],
  },
  boutique: {
    key: "boutique",
    label: "Boutique",
    icon: "🛍",
    blurb: "Vente de produits, stock",
    defaultType: "products",
    allowedTypes: ["products"],
  },
  salon: {
    key: "salon",
    label: "Salon",
    icon: "💇",
    blurb: "Coiffure, beauté, rendez-vous",
    defaultType: "services",
    allowedTypes: ["services", "both"],
  },
  prestataire: {
    key: "prestataire",
    label: "Prestataire",
    icon: "🧰",
    blurb: "Services à la demande ou sur rendez-vous",
    defaultType: "services",
    allowedTypes: ["services"],
  },
  ecommerce: {
    key: "ecommerce",
    label: "E-commerce",
    icon: "📦",
    blurb: "Vente en ligne, commandes",
    defaultType: "products",
    allowedTypes: ["products"],
  },
};

export const NICHE_ORDER: Niche[] = ["restaurant", "boutique", "salon", "prestataire", "ecommerce"];

export function hasProducts(type: BizType) {
  return type === "products" || type === "both";
}
export function hasServices(type: BizType) {
  return type === "services" || type === "both";
}
