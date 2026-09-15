"use client";

import { useState, useTransition } from "react";
import { deleteUserAccount } from "@/app/admin/actions";

export default function DeleteUserButton({ userId, label }: { userId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const ok = window.confirm(
      `Supprimer définitivement le compte de ${label} ? Son commerce et toutes ses données (ventes, dépenses, catalogue) seront perdus. Cette action est irréversible.`
    );
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteUserAccount(userId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs font-medium text-red underline underline-offset-2 disabled:opacity-50"
      >
        {pending ? "…" : "Supprimer"}
      </button>
      {error && <p className="text-[10px] text-red mt-1 max-w-[10rem]">{error}</p>}
    </div>
  );
}
