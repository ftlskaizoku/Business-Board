"use client";

import { useId, useRef, useState } from "react";
import { areaPath, smoothPath, type Pt } from "@/lib/chart-path";

export interface TrendPoint {
  label: string; // short axis label, e.g. "12"
  title: string; // tooltip heading, e.g. "12 nov."
  a: number; // main series (sales)
  b?: number; // optional second series (expenses)
}

const W = 320;
const H = 150;
const PAD_X = 6;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;

function money(n: number, currency: string) {
  return Math.round(n).toLocaleString("fr-FR") + " " + currency;
}

/**
 * Smooth area chart with a touch/hover tooltip (the interaction seen in the
 * reference dashboards). Colours come from the theme tokens.
 */
export function TrendChart({
  points,
  currency,
  aLabel,
  bLabel,
}: {
  points: TrendPoint[];
  currency: string;
  aLabel: string;
  bLabel?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(1, ...points.map((p) => Math.max(p.a, p.b ?? 0)));
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const baseline = PAD_TOP + innerH;
  const xAt = (i: number) => PAD_X + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const yAt = (v: number) => PAD_TOP + innerH - (v / max) * innerH;

  const aPts: Pt[] = points.map((p, i) => ({ x: xAt(i), y: yAt(p.a) }));
  const bPts: Pt[] | null = points.some((p) => p.b !== undefined)
    ? points.map((p, i) => ({ x: xAt(i), y: yAt(p.b ?? 0) }))
    : null;

  function onMove(clientX: number) {
    const el = ref.current;
    if (!el || points.length === 0) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - PAD_X) / innerW) * (points.length - 1));
    setActive(Math.min(points.length - 1, Math.max(0, idx)));
  }

  const act = active !== null ? points[active] : null;
  const tipLeftPct = active !== null ? (xAt(active) / W) * 100 : 0;
  // keep the tooltip inside the card on both edges
  const tipShift = tipLeftPct < 22 ? "0%" : tipLeftPct > 78 ? "-100%" : "-50%";

  return (
    <div className="relative">
      {act && (
        <div
          className="pointer-events-none absolute -top-1 z-10 rounded-xl bg-ink text-cream px-2.5 py-1.5 text-[11px] leading-snug shadow-lg whitespace-nowrap"
          style={{ left: `${tipLeftPct}%`, transform: `translate(${tipShift}, -100%)` }}
        >
          <p className="font-medium mb-0.5">{act.title}</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--color-green)" }} />
            {aLabel}: <span className="font-mono">{money(act.a, currency)}</span>
          </p>
          {bPts && bLabel && (
            <p className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--color-red)" }} />
              {bLabel}: <span className="font-mono">{money(act.b ?? 0, currency)}</span>
            </p>
          )}
        </div>
      )}

      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-pan-y select-none"
        role="img"
        aria-label={`Courbe ${aLabel}${bLabel ? " et " + bLabel : ""}`}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerDown={(e) => onMove(e.clientX)}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-green)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + innerH * t}
            y2={PAD_TOP + innerH * t}
            stroke="var(--color-line)"
            strokeWidth="1"
            strokeDasharray={t === 1 ? undefined : "3 4"}
          />
        ))}

        <path d={areaPath(aPts, baseline)} fill={`url(#fill-${gid})`} className="chart-fade" />
        {bPts && (
          <path
            d={smoothPath(bPts)}
            fill="none"
            stroke="var(--color-red)"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            strokeLinecap="round"
            opacity="0.8"
            className="chart-fade"
          />
        )}
        <path
          d={smoothPath(aPts)}
          fill="none"
          stroke="var(--color-green)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="chart-line"
        />

        {act && active !== null && (
          <g>
            <line
              x1={xAt(active)}
              x2={xAt(active)}
              y1={PAD_TOP}
              y2={baseline}
              stroke="var(--color-muted)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={xAt(active)} cy={yAt(act.a)} r="4.5" fill="var(--color-card)" stroke="var(--color-green)" strokeWidth="2.5" />
            {bPts && <circle cx={xAt(active)} cy={yAt(act.b ?? 0)} r="3.5" fill="var(--color-card)" stroke="var(--color-red)" strokeWidth="2" />}
          </g>
        )}

        {points.map((p, i) =>
          (i % Math.ceil(points.length / 7) === 0 && points.length - 1 - i >= Math.ceil(points.length / 7)) ||
          i === points.length - 1 ? (
            <text
              key={i}
              x={xAt(i)}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              fontSize="9.5"
              fill="var(--color-muted)"
            >
              {p.label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

/** Compact line + fill for hero cards (no interaction, server-renderable shape). */
export function Sparkline({ values }: { values: number[] }) {
  const gid = useId().replace(/:/g, "");
  const w = 120;
  const h = 40;
  const max = Math.max(1, ...values);
  const pts: Pt[] = values.map((v, i) => ({
    x: values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w,
    y: 4 + (h - 8) - (v / max) * (h - 8),
  }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(pts, h)} fill={`url(#sp-${gid})`} />
      <path d={smoothPath(pts)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
