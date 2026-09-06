export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-line rounded-2xl p-4 ${className}`}>{children}</div>;
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
      <p className="text-xs text-muted mb-1">
        {label} {delta && <span className="font-mono text-[10.5px]">{delta}</span>}
      </p>
      <p className={`font-mono text-xl font-medium ${toneClass}`}>{value}</p>
    </Card>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-muted py-6">{children}</p>;
}
