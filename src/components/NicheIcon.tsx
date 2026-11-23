import type { Niche } from "@/lib/types";

/**
 * One consistent line-icon set for business types (24px grid, stroke follows
 * currentColor so it respects every theme). Replaces the old emoji glyphs.
 */
const SHAPES: Record<Niche, React.ReactNode> = {
  // Cloche on a tray
  restaurant: (
    <>
      <path d="M4.5 16.5a7.5 7.5 0 0115 0z" />
      <path d="M2.5 19.5h19" />
      <path d="M12 9V7M10.25 7h3.5" />
    </>
  ),
  // Storefront with scalloped awning
  boutique: (
    <>
      <path d="M3.5 10L5 4.5h14l1.5 5.5" />
      <path d="M3.5 10a2.83 2.83 0 005.67 0 2.83 2.83 0 005.66 0 2.83 2.83 0 005.67 0" />
      <path d="M5 12.5V20h14v-7.5" />
      <path d="M10 20v-4.5h4V20" />
    </>
  ),
  // Scissors
  salon: (
    <>
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="6" cy="18" r="2.6" />
      <path d="M7.9 7.8L20 17.5M7.9 16.2L20 6.5" />
    </>
  ),
  // Toolbox
  prestataire: (
    <>
      <path d="M3.5 9h17v10.5h-17z" />
      <path d="M9 9V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V9" />
      <path d="M3.5 14h17" />
      <path d="M10.5 12.25v3.5h3v-3.5z" />
    </>
  ),
  // Cart
  ecommerce: (
    <>
      <path d="M3 4.5h2.4l2.1 10.2h10.2L20 7.5H6.2" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="16.8" cy="19" r="1.4" />
    </>
  ),
  // Three tiles + one "add your own" tile
  autre: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <path d="M16.75 13.5V20M13.5 16.75H20" />
    </>
  ),
};

export default function NicheIcon({
  niche,
  size = 20,
  strokeWidth = 1.7,
  className,
}: {
  niche: Niche;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {SHAPES[niche]}
    </svg>
  );
}
