"use client";

import { useState, useTransition } from "react";
import { addManualSale } from "@/app/(app)/actions";
import { todayKey } from "@/lib/format";
import { Card, Field, primaryBtn } from "@/components/ui";

// Catch-up entry for a sale made before the shop used the app, or on a day
// it simply wasn't recorded — a total amount against a past date, no
// product selection or stock involved.
export default function ManualSaleForm({ currency }: { currency: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addManualSale(formData);
      setOpen(false);
      setMessage("✓ Vente enregistrée");
      setTimeout(() => setMessage(null), 2200);
    });
  }

  if (!open) {
    return (
      <div className="mt-2 mb-2">
        <button
          onClick={() => setOpen(true)}
          className="w-full h-12 rounded-2xl border border-dashed border-line text-sm text-muted flex items-center justify-center gap-2 bg-card/50"
        >
          <span className="text-base leading-none">＋</span> Ajouter une vente d&apos;un jour passé
        </button>
        {message && (
          <p role="status" className="text-xs text-green text-center mt-2">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="row-in mt-2">
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-semibold">Vente d&apos;un jour passé</p>
        <button onClick={() => setOpen(false)} className="text-muted text-sm h-8 px-1">
          Annuler
        </button>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 min-w-0">
            <Field label={`Montant total (${currency})`}>
              <input name="amount" type="number" inputMode="numeric" required min={1} placeholder="15000" className="field font-mono" />
            </Field>
          </div>
          <div className="col-span-2 min-w-0">
            <Field label="Date">
              <input name="date" type="date" defaultValue={todayKey()} max={todayKey()} required className="field px-2" />
            </Field>
          </div>
        </div>
        <Field label="Note (optionnel)">
          <input name="note" placeholder="ex. Ventes du samedi non enregistrées" className="field" />
        </Field>
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </Card>
  );
}
