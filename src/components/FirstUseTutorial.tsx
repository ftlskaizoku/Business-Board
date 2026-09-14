"use client";

import { useState } from "react";

interface Props {
  businessName: string;
  showsServices: boolean;
  onFinish: () => Promise<void>;
}

export default function FirstUseTutorial({ businessName, showsServices, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const steps = [
    {
      title: `Bienvenue, ${businessName} 👋`,
      body: "Business Board vous aide à suivre vos ventes, vos dépenses et votre stock, au quotidien. Ce guide rapide vous montre l'essentiel en quelques étapes — vous pourrez le revoir à tout moment depuis Paramètres.",
    },
    {
      title: "Le Tableau de bord",
      body: "C'est votre écran d'accueil : le chiffre d'affaires du jour, vos dépenses, et un aperçu rapide de la santé de votre commerce.",
    },
    showsServices
      ? {
          title: "Vente & rendez-vous",
          body: "Dans l'onglet Vente, choisissez un produit et la quantité vendue, ou prenez un rendez-vous pour un service — en quelques taps. Il faut une connexion internet au moment d'enregistrer.",
        }
      : {
          title: "Enregistrer une vente",
          body: "Dans l'onglet Vente, choisissez un produit et la quantité vendue — il faut une connexion internet au moment d'enregistrer. Vous pouvez aussi ajouter une vente passée que vous auriez oublié de noter.",
        },
    {
      title: "Le Catalogue",
      body: "Ajoutez vos produits ou services ici. Le suivi de stock est optionnel : utile pour une boutique, pas nécessaire pour les plats d'un restaurant par exemple — vous choisissez, et ça se change à tout moment.",
    },
    {
      title: "Les Dépenses",
      body: "Notez vos dépenses au fil de l'eau — loyer, ingrédients, transport. Vous pouvez aussi rattraper un jour passé où vous n'aviez pas encore l'application.",
    },
    {
      title: "Les Statistiques",
      body: "Suivez votre chiffre d'affaires dans le temps et voyez quels produits se vendent le mieux, sans tableur.",
    },
    {
      title: "Paramètres",
      body: "Retrouvez vos informations, changez l'apparence de l'application, et revenez sur ce guide quand vous voulez — tout est dans l'icône ⚙ en haut de l'écran.",
    },
  ];

  async function finish() {
    setClosing(true);
    await onFinish();
  }

  if (closing) return null;

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-5 max-w-sm w-full">
        <div className="flex gap-1.5 mb-5">
          {steps.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ochre" : "bg-line"}`} />
          ))}
        </div>

        <h2 className="font-display text-lg font-semibold mb-2">{current.title}</h2>
        <p className="text-sm text-muted leading-relaxed mb-6">{current.body}</p>

        <div className="flex items-center justify-between">
          <button onClick={finish} className="text-xs text-muted">
            Passer
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-sm font-medium px-3 py-2 text-muted"
              >
                ← Précédent
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="bg-ochre text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              {isLast ? "Terminer" : "Suivant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
