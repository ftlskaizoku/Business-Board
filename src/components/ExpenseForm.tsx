"use client";

import { useState, useTransition } from "react";
import { addExpense } from "@/app/(app)/actions";
import { todayKey } from "@/lib/format";
import { Field, primaryBtn } from "@/components/ui";

const VISIBLE_CHIPS = 10;

// The owner types what the expense is ("Gaz", "Réparation frigo"...). Names
// they've used before show up as tappable chips, so repeating an expense is
// one tap instead of retyping it.
export default function ExpenseForm({
  currency,
  history,
  defaults,
  onSaved,
}: {
  currency: string;
  history: string[];
  defaults: string[];
  onSaved?: () => void;
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
      setTimeout(() => {
        setSaved(false);
        onSaved?.();
      }, 900);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Quelle dépense ?">
        <input
          name="category"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          autoComplete="off"
          placeholder="ex. Gaz, Transport, Réparation…"
          className="field"
        />
      </Field>
      {all.length > 0 && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const selected = c.toLowerCase() === typed;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setName(c)}
                className={`text-xs rounded-full border px-3 h-8 transition-colors ${
                  selected ? "border-ochre bg-ochre-soft text-ochre font-medium" : "border-line text-muted bg-card"
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
              className="text-xs px-2 h-8 text-ochre font-medium"
            >
              {showAll ? "Réduire" : `+${all.length - VISIBLE_CHIPS} autres`}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 min-w-0">
          <Field label={`Montant (${currency})`}>
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              required
              min={1}
              placeholder="5000"
              className="field font-mono"
            />
          </Field>
        </div>
        <div className="col-span-2 min-w-0">
          <Field label="Date">
            <input name="date" type="date" defaultValue={todayKey()} max={todayKey()} required className="field px-2" />
          </Field>
        </div>
      </div>

      <Field label="Note (optionnel)">
        <input name="note" placeholder="Fournisseur, détail…" className="field" />
      </Field>

      <button type="submit" disabled={pending || !name.trim()} className={primaryBtn}>
        {pending ? "Enregistrement…" : saved ? "✓ Dépense enregistrée" : "Enregistrer la dépense"}
      </button>
    </form>
  );
}
