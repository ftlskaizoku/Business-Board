export function Card({
  children,
  className = "",
  ...rest
}: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  // min-w-0 lets this card shrink below its content's natural width when
  // it's a grid/flex item (e.g. one of two columns on a narrow phone).
  // Without it, a long unbroken value (a big FCFA figure, a long product
  // name) forces the whole row wider than the screen instead of wrapping.
  return (
    <div className={`bg-card border border-line rounded-[20px] card-surface p-4 min-w-0 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-widest text-muted mt-7 mb-2.5 font-medium">{children}</p>;
}

/** Section title with an optional right-hand slot (a count, a link, a total). */
export function SectionHeader({
  title,
  aside,
  className = "",
}: {
  title: string;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 mt-8 mb-3 min-w-0 ${className}`}>
      <h2 className="font-display text-[17px] font-semibold leading-tight truncate">{title}</h2>
      {aside && <div className="text-xs text-muted shrink-0 font-mono">{aside}</div>}
    </div>
  );
}

/** Screen title: small eyebrow, big display title, optional one-line subtitle. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 lg:mb-8 flex items-end justify-between gap-3 min-w-0">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-muted mb-1 font-medium">{eyebrow}</p>
        <h1 className="font-display text-[28px] lg:text-4xl leading-[1.1] font-semibold break-words">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Label + control, the one form-field layout used app-wide. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}
    </label>
  );
}

/** Full-width primary action. */
export const primaryBtn =
  "w-full h-12 rounded-2xl bg-ochre font-medium text-[15px] disabled:opacity-50 shadow-[0_6px_16px_-8px_var(--color-ochre)]";
export const ghostBtn =
  "h-10 rounded-xl border border-line px-4 text-sm font-medium text-ink bg-card disabled:opacity-50";

/** Empty state: icon bubble + one line + optional hint. */
export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <span className="w-12 h-12 rounded-full bg-ochre-soft text-ochre flex items-center justify-center mb-3">
        {icon}
      </span>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted mt-1 max-w-[16rem]">{hint}</p>}
    </div>
  );
}

/** Small rounded "+12%" badge, green or red like the reference dashboards. */
export function DeltaPill({ value, tone }: { value: string; tone: "good" | "bad" | "default" }) {
  const cls =
    tone === "good" ? "bg-green-soft text-green" : tone === "bad" ? "bg-red-soft text-red" : "bg-cream text-muted";
  const arrow = tone === "good" ? "▲" : tone === "bad" ? "▼" : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium font-mono ${cls}`}>
      {arrow && <span className="text-[8px] leading-none">{arrow}</span>}
      {value}
    </span>
  );
}

export function Metric({
  label,
  value,
  tone = "default",
  delta,
  icon,
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
  delta?: string;
  icon?: React.ReactNode;
}) {
  const toneClass = tone === "good" ? "text-green" : tone === "bad" ? "text-red" : "text-ink";
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span className="w-7 h-7 shrink-0 rounded-full bg-ochre-soft text-ochre flex items-center justify-center">
            {icon}
          </span>
        )}
        <p className="text-xs text-muted truncate">{label}</p>
      </div>
      {/* break-words (not truncate): large FCFA figures must stay fully
          readable, so they wrap onto a second line at the thousand-separator
          spaces instead of being cut off or pushing the card off-screen. */}
      <p className={`font-mono text-lg sm:text-xl font-medium leading-snug break-words ${toneClass}`}>{value}</p>
      {delta && (
        <div className="mt-1.5">
          <DeltaPill value={delta} tone={tone} />
        </div>
      )}
    </Card>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-muted py-6">{children}</p>;
}

/** Page title block used on every screen, so headings look the same everywhere. */
export function PageHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 lg:mb-8">
      <p className="text-xs uppercase tracking-widest text-muted mb-1 font-medium">{eyebrow}</p>
      <h1 className="font-display text-[26px] lg:text-4xl leading-tight font-semibold">{title}</h1>
    </div>
  );
}

/** Tiny inline icons (stroke = currentColor, so they follow the theme). */
export function Icon({ name, size = 16 }: { name: "sales" | "expense" | "profit" | "stock" | "box" | "filter" | "plus" | "close"; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    sales: <path d="M4 15l5-5 4 4 7-8M15 6h5v5" />,
    expense: <path d="M4 9l5 5 4-4 7 8M15 18h5v-5" />,
    profit: <path d="M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />,
    stock: <path d="M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8" />,
    box: <path d="M4 7h16v13H4zM9 7V4h6v3" />,
    filter: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
