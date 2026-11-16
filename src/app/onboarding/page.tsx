"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NICHES, NICHE_ORDER, hasProducts } from "@/lib/niches";
import type { Niche, BizType } from "@/lib/types";

type Step = "niche" | "type" | "stock" | "name";

function CheckBadge() {
  return (
    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-ochre text-white flex items-center justify-center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function ChoiceCard({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative w-full text-left rounded-[20px] border-2 p-4 pr-10 transition-colors ${
        selected ? "border-ochre bg-ochre-soft" : "border-line bg-card"
      }`}
    >
      <span className="block font-medium">{title}</span>
      <span className="block text-xs text-muted mt-0.5">{subtitle}</span>
      {selected && <CheckBadge />}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [niche, setNiche] = useState<Niche | null>(null);
  const [customNiche, setCustomNiche] = useState("");
  const [type, setType] = useState<BizType | null>(null);
  const [trackStock, setTrackStock] = useState(true);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const nicheConfig = niche ? NICHES[niche] : null;
  const needsTypeStep = nicheConfig ? nicheConfig.allowedTypes.length > 1 : false;
  const needsStockStep = !!type && hasProducts(type);

  const steps: Step[] = [
    "niche",
    ...(needsTypeStep ? (["type"] as const) : []),
    ...(needsStockStep ? (["stock"] as const) : []),
    "name",
  ];
  const currentStep = steps[stepIndex] ?? "niche";
  const isLast = currentStep === "name";

  function pickNiche(n: Niche) {
    setNiche(n);
    setType(NICHES[n].defaultType);
    // Restaurants typically don't track their menu items as stock — dishes
    // aren't backed by a countable number, unlike a boutique's items. The
    // stock step lets them flip this either way before continuing.
    setTrackStock(n !== "restaurant");
  }

  const step1Ready = niche === "autre" ? !!niche && customNiche.trim().length > 0 : !!niche;
  const canContinue =
    currentStep === "niche" ? step1Ready : currentStep === "type" ? !!type : currentStep === "stock" ? true : !!name.trim() && !loading;

  function next() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function createBusiness() {
    if (!niche || !type || !name.trim()) return;
    if (niche === "autre" && !customNiche.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.push("/auth");
      return;
    }
    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name: name.trim(),
      niche,
      custom_niche: niche === "autre" ? customNiche.trim() : null,
      type,
      currency: "FCFA",
      track_stock: needsStockStep ? trackStock : true,
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  function onPrimary() {
    if (isLast) createBusiness();
    else next();
  }

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto w-full">
      {/* Top: back + progress. Sticks to the top so you always know where you are. */}
      <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur-md px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            aria-label="Retour"
            className={`w-9 h-9 shrink-0 rounded-full border border-line bg-card flex items-center justify-center ${
              stepIndex === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="flex gap-1.5 flex-1">
            {steps.map((s, i) => (
              <span key={s} className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
                <span
                  className="block h-full rounded-full bg-ochre transition-all duration-300"
                  style={{ width: i <= stepIndex ? "100%" : "0%" }}
                />
              </span>
            ))}
          </div>
          <span className="text-xs text-muted font-mono shrink-0">
            {stepIndex + 1}/{steps.length}
          </span>
        </div>
      </header>

      {/* Middle: the only part that grows. Bottom padding keeps content clear of the action bar. */}
      <main key={currentStep} className="page-enter flex-1 px-6 pt-4 pb-6">
        {currentStep === "niche" && (
          <>
            {stepIndex === 0 && (
              <p className="inline-block text-xs font-medium text-ochre bg-ochre-soft rounded-full px-3 py-1 mb-3">
                Bienvenue sur Business Board
              </p>
            )}
            <h1 className="font-display text-[26px] leading-tight font-semibold mb-1">Quel type de commerce ?</h1>
            <p className="text-muted text-sm mb-5">Cela détermine les outils que nous vous montrons.</p>

            <div className="grid grid-cols-2 gap-3">
              {NICHE_ORDER.map((key) => {
                const n = NICHES[key];
                const selected = niche === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pickNiche(key)}
                    aria-pressed={selected}
                    className={`relative text-left rounded-[20px] border-2 p-3.5 transition-colors ${
                      selected ? "border-ochre bg-ochre-soft" : "border-line bg-card"
                    }`}
                  >
                    <span className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center text-xl mb-2.5">
                      {n.icon}
                    </span>
                    <span className="block font-medium text-sm leading-snug">{n.label}</span>
                    <span className="block text-[11px] text-muted leading-snug mt-0.5">{n.blurb}</span>
                    {selected && <CheckBadge />}
                  </button>
                );
              })}
            </div>

            {niche === "autre" && (
              <div className="mt-5">
                <label className="block text-xs uppercase tracking-widest text-muted mb-2 font-medium">
                  Précisez votre activité
                </label>
                <input
                  autoFocus
                  className="w-full border border-line rounded-2xl px-4 py-3.5 bg-card outline-none focus:border-ochre"
                  placeholder="Ex. Location de voitures, cordonnerie…"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {currentStep === "type" && nicheConfig && (
          <>
            <h1 className="font-display text-[26px] leading-tight font-semibold mb-1">Produits, services, ou les deux ?</h1>
            <p className="text-muted text-sm mb-5">{nicheConfig.label} peut fonctionner des deux façons.</p>

            <div className="space-y-3">
              {nicheConfig.allowedTypes.map((t) => (
                <ChoiceCard
                  key={t}
                  selected={type === t}
                  onClick={() => setType(t)}
                  title={t === "products" ? "Produits" : t === "services" ? "Services" : "Les deux"}
                  subtitle={
                    t === "products"
                      ? "J'ai un stock à vendre."
                      : t === "services"
                      ? "Je prends des rendez-vous."
                      : "Produits et rendez-vous."
                  }
                />
              ))}
            </div>
          </>
        )}

        {currentStep === "stock" && (
          <>
            <h1 className="font-display text-[26px] leading-tight font-semibold mb-1">Suivre le stock de vos produits ?</h1>
            <p className="text-muted text-sm mb-5">
              {niche === "restaurant"
                ? "Utile si vous voulez suivre les ingrédients ou produits que vous achetez pour préparer vos plats. Ce n'est pas obligatoire : les plats de votre menu n'ont pas besoin d'un stock de départ — au moment d'une vente, vous choisissez simplement le plat et la quantité vendue."
                : "Si activé, chaque vente diminue automatiquement le stock du produit. Vous pourrez changer ce choix à tout moment dans les Paramètres."}
            </p>

            <div className="space-y-3">
              <ChoiceCard
                selected={trackStock}
                onClick={() => setTrackStock(true)}
                title="Oui, suivre le stock"
                subtitle="Le stock diminue à chaque vente enregistrée."
              />
              <ChoiceCard
                selected={!trackStock}
                onClick={() => setTrackStock(false)}
                title="Non, pas pour l'instant"
                subtitle="Vous enregistrez juste le produit et la quantité vendue à chaque vente."
              />
            </div>
          </>
        )}

        {currentStep === "name" && (
          <>
            <h1 className="font-display text-[26px] leading-tight font-semibold mb-1">Le nom de votre commerce</h1>
            <p className="text-muted text-sm mb-5">Il apparaîtra en haut de votre tableau de bord.</p>

            <input
              autoFocus
              className="w-full border border-line rounded-2xl px-4 py-3.5 bg-card outline-none focus:border-ochre"
              placeholder="Ex. Les Mets de Fatima"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinue) createBusiness();
              }}
            />

            {error && <p className="text-red text-sm mt-4">{error}</p>}
          </>
        )}
      </main>

      {/* Bottom: the action is always on screen, whatever the list length. */}
      <footer className="sticky bottom-0 z-10 bg-cream/90 backdrop-blur-md border-t border-line px-6 pt-3 pb-5">
        <button
          type="button"
          onClick={onPrimary}
          disabled={!canContinue}
          className="w-full bg-ochre text-white rounded-2xl py-3.5 font-medium disabled:opacity-40"
        >
          {isLast ? (loading ? "Création…" : "Créer mon commerce") : "Continuer"}
        </button>
      </footer>
    </div>
  );
}
