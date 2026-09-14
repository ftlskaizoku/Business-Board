export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  // min-w-0 lets this card shrink below its content's natural width when
  // it's a grid/flex item (e.g. one of two columns on a narrow phone).
  // Without it, a long unbroken value (a big FCFA figure, a long product
  // name) forces the whole row wider than the screen instead of wrapping.
  return <div className={`bg-card border border-line rounded-2xl p-4 min-w-0 ${className}`}>{children}</div>;
}

export function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-widest text-muted mt-6 mb-2">{children}</p>;
}

export function Metric({
  label,
  value,
  tone = "default",
  delta,
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
  delta?: string;
}) {
  const toneClass = tone === "good" ? "text-green" : tone === "bad" ? "text-red" : "text-ink";
  return (
    <Card>
      <p className="text-xs text-muted mb-1 truncate">
        {label} {delta && <span className="font-mono text-[10.5px]">{delta}</span>}
      </p>
      {/* break-words (not truncate): large FCFA figures must stay fully
          readable, so they wrap onto a second line at the thousand-separator
          spaces instead of being cut off or pushing the card off-screen. */}
      <p className={`font-mono text-lg sm:text-xl font-medium leading-snug break-words ${toneClass}`}>
        {value}
      </p>
    </Card>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-muted py-6">{children}</p>;
}
