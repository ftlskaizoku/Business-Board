"use client";

import { useState, useTransition } from "react";
import { setTrackStock } from "@/app/(app)/actions";

export default function TrackStockToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await setTrackStock(next);
    });
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">Suivi de stock</p>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">
          {on
            ? "Chaque vente diminue le stock du produit, et le tableau de bord vous signale les ruptures."
            : "Désactivé : aucun stock n'est compté ni affiché — idéal si votre commerce n'en a pas besoin (un restaurant, par exemple). Vos chiffres actuels sont conservés si vous le réactivez."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Suivi de stock"
        onClick={toggle}
        disabled={pending}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${
          on ? "bg-ochre" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
