"use client";

import { useState, useTransition } from "react";
import { addExpense } from "@/app/(app)/actions";
import { todayKey } from "@/lib/format";

const VISIBLE_CHIPS = 10;

// The owner types what the expense is ("Gaz", "Réparation frigo"...). Names
// they've used before show up as tappable chips, so repeating an expense is
// one tap instead of retyping it.
export default function ExpenseForm({
  currency,
  history,
  defaults,
}: {
  currency: string;
  history: string[];
  defaults: string[];
}) {
  const [name, setName] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Previously used names first, then the starter names not yet used.
  const seen = new Set(history.map((h) => h.toLowerCase()));
  const all = [...history, ...defaults.filter((d) => !seen.has(d.toLowerCase()))];
  const chips = showAll ? all : all.slice(0, VISIBLE_CHIPS);
  const typed = name.trim().toLowerCase();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    // Typing "gaz" when "Gaz" already exists reuses the existing spelling,
    // so the same expense never ends up split across two names.
    const match = all.find((n) => n.toLowerCase() === name.trim().toLowerCase());
    fd.set("category", match ?? name);
    startTransition(async () => {
      await addExpense(fd);
      form.reset();
      setName("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-muted mb-1">Date</label>
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
        <label className="block text-xs text-muted mb-1">Quelle dépense ?</label>
        <input
          name="category"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          autoComplete="off"
          placeholder="ex. Gaz, Transport, Réparation…"
          className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
        />
        {all.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map((c) => {
              const selected = c.toLowerCase() === typed;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setName(c)}
                  className={`text-xs rounded-full border px-2.5 py-1 ${
                    selected ? "border-ochre bg-ochre-soft text-ochre font-medium" : "border-line text-muted"
                  }`}
                >
                  {c}
                </button>
              );
            })}
            {all.length > VISIBLE_CHIPS && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-xs px-2 py-1 text-ochre font-medium"
              >
                {showAll ? "Réduire" : `+${all.length - VISIBLE_CHIPS} autres`}
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Montant ({currency})</label>
        <input
          name="amount"
          type="number"
          required
          placeholder="5000"
          className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Note (optionnel)</label>
        <input
          name="note"
          placeholder="Fournisseur, détail…"
          className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="w-full bg-ochre text-white rounded-lg py-2.5 font-medium disabled:opacity-60"
      >
        {pending ? "…" : saved ? "✓ Dépense enregistrée" : "Enregistrer la dépense"}
      </button>
    </form>
  );
}
