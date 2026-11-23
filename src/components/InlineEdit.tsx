"use client";

import { useState, useTransition } from "react";

/** A settings row that shows a value and turns into a small form on "Modifier". */
export default function InlineEdit({
  label,
  name,
  value,
  action,
}: {
  label: string;
  name: string;
  value: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    startTransition(async () => {
      await action(fd);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <form action={submit} className="row-in px-4 py-3.5 space-y-2.5">
        <label className="block text-xs font-medium text-muted" htmlFor={`edit-${name}`}>
          {label}
        </label>
        <input id={`edit-${name}`} name={name} defaultValue={value} required autoFocus maxLength={80} className="field" />
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(false)} className="flex-1 h-10 rounded-xl border border-line text-sm font-medium">
            Annuler
          </button>
          <button type="submit" disabled={pending} className="flex-1 h-10 rounded-xl bg-ochre text-sm font-medium disabled:opacity-50">
            {pending ? "…" : "Enregistrer"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 min-w-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium truncate mt-0.5">{value || "—"}</p>
      </div>
      <button onClick={() => setEditing(true)} className="text-xs font-medium text-ochre shrink-0 h-9 px-2 -mr-2">
        Modifier
      </button>
    </div>
  );
}
