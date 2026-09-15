"use client";

import { useState, useTransition } from "react";
import { updateExpense, deleteExpense } from "@/app/(app)/actions";
import { fmt, todayKey } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { Expense } from "@/lib/types";

export default function ExpenseRow({ expense, currency }: { expense: Expense; currency: string }) {
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
      <div className="bg-card border border-line rounded-xl px-3.5 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={date}
            max={todayKey()}
            onChange={(e) => setDate(e.target.value)}
            className="border border-line rounded-lg px-2.5 py-1.5 bg-cream text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-line rounded-lg px-2.5 py-1.5 bg-cream text-sm"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Montant (${currency})`}
          className="w-full border border-line rounded-lg px-2.5 py-1.5 bg-cream text-sm"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optionnel)"
          className="w-full border border-line rounded-lg px-2.5 py-1.5 bg-cream text-sm"
        />
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 border border-line rounded-lg py-2 text-sm font-medium"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={pending || !amount}
            className="flex-1 bg-ochre text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center gap-2 bg-card border border-line rounded-xl px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-sm">{expense.category}</p>
        <p className="text-xs text-muted truncate">
          {expense.expense_date}
          {expense.note ? ` · ${expense.note}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-mono text-sm text-red">-{fmt(expense.amount, currency)}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-muted underline underline-offset-2">
          Modifier
        </button>
        <button onClick={remove} className="text-xs text-red underline underline-offset-2">
          Supprimer
        </button>
      </div>
    </div>
  );
}
