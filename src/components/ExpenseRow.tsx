"use client";

import { useId, useState, useTransition } from "react";
import { updateExpense, deleteExpense } from "@/app/(app)/actions";
import { fmt, todayKey } from "@/lib/format";
import { Field, ghostBtn } from "@/components/ui";
import type { Expense } from "@/lib/types";

export default function ExpenseRow({
  expense,
  currency,
  suggestions,
}: {
  expense: Expense;
  currency: string;
  suggestions: string[];
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(expense.expense_date);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(String(expense.amount));
  const [note, setNote] = useState(expense.note || "");

  function save() {
    startTransition(async () => {
      await updateExpense({ expenseId: expense.id, date, category, amount: Number(amount) || 0, note });
      setEditing(false);
      setOpen(false);
    });
  }

  function remove() {
    if (!window.confirm("Supprimer définitivement cette dépense ?")) return;
    startTransition(async () => {
      await deleteExpense(expense.id);
    });
  }

  if (editing) {
    return (
      <div className="bg-card border border-line rounded-2xl card-surface p-3.5 space-y-3 row-in">
        <Field label="Quelle dépense ?">
          <input
            list={listId}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={60}
            className="field"
          />
        </Field>
        <datalist id={listId}>
          {suggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 min-w-0">
            <Field label={`Montant (${currency})`}>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="field font-mono"
              />
            </Field>
          </div>
          <div className="col-span-2 min-w-0">
            <Field label="Date">
              <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} className="field px-2" />
            </Field>
          </div>
        </div>
        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel" className="field" />
        </Field>
        <div className="flex gap-2 pt-1">
          <button onClick={() => setEditing(false)} className={`${ghostBtn} flex-1`}>
            Annuler
          </button>
          <button
            onClick={save}
            disabled={pending || !amount || !category.trim()}
            className="flex-1 h-10 rounded-xl bg-ochre text-sm font-medium disabled:opacity-50"
          >
            {pending ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-2xl card-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left min-w-0"
      >
        <span
          className="w-9 h-9 shrink-0 rounded-full bg-red-soft text-red flex items-center justify-center font-display font-semibold text-sm"
          aria-hidden
        >
          {expense.category.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium truncate">{expense.category}</span>
          {expense.note && <span className="block text-xs text-muted truncate">{expense.note}</span>}
        </span>
        <span className="font-mono text-sm text-red shrink-0">−{fmt(expense.amount, currency)}</span>
      </button>
      {open && (
        <div className="row-in flex border-t border-line text-sm">
          <button onClick={() => setEditing(true)} className="flex-1 py-2.5 font-medium text-ink">
            Modifier
          </button>
          <span className="w-px bg-line" />
          <button onClick={remove} disabled={pending} className="flex-1 py-2.5 font-medium text-red disabled:opacity-50">
            {pending ? "…" : "Supprimer"}
          </button>
        </div>
      )}
    </div>
  );
}
