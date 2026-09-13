"use client";

import { useState, useTransition } from "react";
import { addManualSale } from "@/app/(app)/actions";
import { todayKey } from "@/lib/format";
import { Card } from "@/components/ui";

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
      setMessage("Vente enregistrée");
      setTimeout(() => setMessage(null), 2000);
    });
  }

  if (!open) {
    return (
      <div className="mt-6 mb-2 text-center">
        <button onClick={() => setOpen(true)} className="text-sm text-muted underline underline-offset-2">
          Enregistrer une vente passée (jour précédent)
        </button>
        {message && <p className="text-xs text-green mt-2">{message}</p>}
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-muted">Vente passée</p>
        <button onClick={() => setOpen(false)} className="text-muted text-xs">
          Annuler
        </button>
      </div>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-muted mb-1">Date de la vente</label>
          <input
            name="date"
            type="date"
            defaultValue={todayKey()}
            max={todayKey()}
            required
            className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Montant total ({currency})</label>
          <input
            name="amount"
            type="number"
            required
            placeholder="15000"
            className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Note (optionnel)</label>
          <input
            name="note"
            placeholder="ex. Ventes du samedi non enregistrées"
            className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ink text-white rounded-lg py-2.5 font-medium disabled:opacity-60"
        >
          {pending ? "…" : "Enregistrer"}
        </button>
      </form>
    </Card>
  );
}
