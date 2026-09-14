"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NICHES, NICHE_ORDER, hasProducts } from "@/lib/niches";
import type { Niche, BizType } from "@/lib/types";

type Step = "niche" | "type" | "stock" | "name";

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

  function pickNiche(n: Niche) {
    setNiche(n);
    setType(NICHES[n].defaultType);
    // Restaurants typically don't track their menu items as stock — dishes
    // aren't backed by a countable number, unlike a boutique's items. The
    // stock step lets them flip this either way before continuing.
    setTrackStock(n !== "restaurant");
  }

  const step1Ready = niche === "autre" ? !!niche && customNiche.trim().length > 0 : !!niche;

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

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto w-full">
      <div className="flex gap-1.5 mb-8 mt-2">
        {steps.map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-ochre" : "bg-line"}`} />
        ))}
      </div>

      {currentStep === "niche" && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Étape {stepIndex + 1}</p>
          <h1 className="font-display text-2xl font-semibold mb-1">Quel type de commerce ?</h1>
          <p className="text-muted text-sm mb-6">Cela détermine les outils que nous vous montrons.</p>

          <div className="space-y-2 mb-8">
            {NICHE_ORDER.map((key) => {
              const n = NICHES[key];
              return (
                <button
                  key={key}
                  onClick={() => pickNiche(key)}
                  className={`w-full text-left border rounded-xl p-4 flex items-center gap-3 transition ${
                    niche === key ? "border-ochre bg-ochre-soft" : "border-line bg-card"
                  }`}
                >
                  <span className="text-2xl">{n.icon}</span>
                  <span>
                    <span className="block font-medium">{n.label}</span>
                    <span className="block text-xs text-muted">{n.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {niche === "autre" && (
            <div className="mb-8 -mt-4">
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">
                Précisez votre activité
              </label>
              <input
                autoFocus
                className="w-full border border-line rounded-lg px-3 py-3 bg-card outline-none focus:border-ochre"
                placeholder="Ex. Location de voitures, cordonnerie…"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={next}
            disabled={!step1Ready}
            className="w-full bg-ochre text-white rounded-lg py-3 font-medium disabled:opacity-40"
          >
            Continuer →
          </button>
        </div>
      )}

      {currentStep === "type" && nicheConfig && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Étape {stepIndex + 1}</p>
          <h1 className="font-display text-2xl font-semibold mb-1">Produits, services, ou les deux ?</h1>
          <p className="text-muted text-sm mb-6">{nicheConfig.label} peut fonctionner des deux façons.</p>

          <div className="space-y-2 mb-8">
            {nicheConfig.allowedTypes.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`w-full text-left border rounded-xl p-4 ${
                  type === t ? "border-ochre bg-ochre-soft" : "border-line bg-card"
                }`}
              >
                {t === "products" && "Produits — j'ai un stock à vendre"}
                {t === "services" && "Services — je prends des rendez-vous"}
                {t === "both" && "Les deux — produits et rendez-vous"}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={back} className="flex-1 border border-line rounded-lg py-3 font-medium">
              ← Retour
            </button>
            <button
              onClick={next}
              disabled={!type}
              className="flex-1 bg-ochre text-white rounded-lg py-3 font-medium disabled:opacity-40"
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {currentStep === "stock" && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Étape {stepIndex + 1}</p>
          <h1 className="font-display text-2xl font-semibold mb-1">Suivre le stock de vos produits ?</h1>
          <p className="text-muted text-sm mb-6">
            {niche === "restaurant"
              ? "Utile si vous voulez suivre les ingrédients ou produits que vous achetez pour préparer vos plats. Ce n'est pas obligatoire : les plats de votre menu n'ont pas besoin d'un stock de départ — au moment d'une vente, vous choisissez simplement le plat et la quantité vendue."
              : "Si activé, chaque vente diminue automatiquement le stock du produit. Vous pourrez changer ce choix à tout moment depuis l'onglet Catalogue."}
          </p>

          <div className="space-y-2 mb-8">
            <button
              onClick={() => setTrackStock(true)}
              className={`w-full text-left border rounded-xl p-4 ${
                trackStock ? "border-ochre bg-ochre-soft" : "border-line bg-card"
              }`}
            >
              <span className="block font-medium">Oui, suivre le stock</span>
              <span className="block text-xs text-muted">Le stock diminue à chaque vente enregistrée.</span>
            </button>
            <button
              onClick={() => setTrackStock(false)}
              className={`w-full text-left border rounded-xl p-4 ${
                !trackStock ? "border-ochre bg-ochre-soft" : "border-line bg-card"
              }`}
            >
              <span className="block font-medium">Non, pas pour l&apos;instant</span>
              <span className="block text-xs text-muted">
                Vous enregistrez juste le produit et la quantité vendue à chaque vente.
              </span>
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={back} className="flex-1 border border-line rounded-lg py-3 font-medium">
              ← Retour
            </button>
            <button onClick={next} className="flex-1 bg-ochre text-white rounded-lg py-3 font-medium">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {currentStep === "name" && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Étape {stepIndex + 1}</p>
          <h1 className="font-display text-2xl font-semibold mb-1">Le nom de votre commerce</h1>
          <p className="text-muted text-sm mb-6">Il apparaîtra en haut de votre tableau de bord.</p>

          <input
            autoFocus
            className="w-full border border-line rounded-lg px-3 py-3 bg-card outline-none focus:border-ochre mb-8"
            placeholder="Ex. Les Mets de Fatima"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {error && <p className="text-red text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button onClick={back} className="flex-1 border border-line rounded-lg py-3 font-medium">
              ← Retour
            </button>
            <button
              onClick={createBusiness}
              disabled={!name.trim() || loading}
              className="flex-1 bg-ochre text-white rounded-lg py-3 font-medium disabled:opacity-40"
            >
              {loading ? "…" : "Créer mon commerce"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
