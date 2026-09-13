"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NICHES, NICHE_ORDER } from "@/lib/niches";
import type { Niche, BizType } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [niche, setNiche] = useState<Niche | null>(null);
  const [customNiche, setCustomNiche] = useState("");
  const [type, setType] = useState<BizType | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nicheConfig = niche ? NICHES[niche] : null;
  const needsTypeStep = nicheConfig ? nicheConfig.allowedTypes.length > 1 : false;

  function pickNiche(n: Niche) {
    setNiche(n);
    setType(NICHES[n].defaultType);
  }

  const step1Ready = niche === "autre" ? !!niche && customNiche.trim().length > 0 : !!niche;

  function next() {
    if (step === 1 && step1Ready) setStep(needsTypeStep ? 2 : 3);
    else if (step === 2 && type) setStep(3);
  }
  function back() {
    if (step === 3) setStep(needsTypeStep ? 2 : 1);
    else if (step === 2) setStep(1);
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
      // Restaurants typically don't track ingredient-level stock day to day;
      // every other niche starts with stock tracking on. Editable later
      // from the Catalogue tab either way.
      track_stock: niche !== "restaurant",
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto w-full">
      <div className="flex gap-1.5 mb-8 mt-2">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full ${
              (s === 1 && step >= 1) ||
              (s === 2 && step >= (needsTypeStep ? 2 : 3)) ||
              (s === 3 && step >= 3)
                ? "bg-ochre"
                : "bg-line"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Étape 1</p>
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

      {step === 2 && nicheConfig && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Étape 2</p>
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

      {step === 3 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Étape 3</p>
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
