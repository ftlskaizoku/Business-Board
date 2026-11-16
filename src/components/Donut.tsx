const COLORS = [
  "var(--color-ochre)",
  "var(--color-indigo)",
  "var(--color-green)",
  "var(--color-red)",
  "var(--color-muted)",
];

export function sliceColor(i: number) {
  return COLORS[i % COLORS.length];
}

/** Ring chart: each slice is one expense name. Pure SVG, theme colours. */
export default function Donut({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: { name: string; value: number }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 38;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative w-[132px] h-[132px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label="Répartition des dépenses">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="11" />
        {slices.map((s, i) => {
          const len = (s.value / total) * c;
          const gap = slices.length > 1 ? 1.5 : 0;
          const el = (
            <circle
              key={s.name}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={sliceColor(i)}
              strokeWidth="11"
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span className="text-[10px] text-muted leading-tight">{centerLabel}</span>
        <span className="font-mono text-[11px] font-medium leading-tight break-words">{centerValue}</span>
      </div>
    </div>
  );
}
