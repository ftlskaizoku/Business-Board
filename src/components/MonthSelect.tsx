"use client";

import { useRouter } from "next/navigation";

export default function MonthSelect({ months, current }: { months: string[]; current: string }) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => router.push(`/stats?month=${e.target.value}`)}
      className="border border-line rounded-lg px-2 py-1.5 text-sm bg-cream"
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
