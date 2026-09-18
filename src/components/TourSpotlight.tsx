"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { TourStep } from "@/lib/tour-steps";

interface Props {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
}

const MAX_ATTEMPTS = 30; // ~3s at 100ms — covers navigation + render + hydration
const RETRY_MS = 100;

function TourBubble({ step, index, total, onNext, onPrev, onSkip }: Props) {
  const isLast = index === total - 1;
  return (
    <div className="bg-card rounded-2xl p-4 shadow-xl w-full max-w-sm">
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-ochre" : "bg-line"}`} />
        ))}
      </div>
      <h2 className="font-display text-base font-semibold mb-1.5">{step.title}</h2>
      <p className="text-sm text-muted leading-relaxed mb-4">{step.body}</p>
      <div className="flex items-center justify-between gap-2">
        <button onClick={onSkip} className="text-xs text-muted shrink-0">
          Passer
        </button>
        <div className="flex items-center gap-2">
          {onPrev && (
            <button onClick={onPrev} className="text-sm font-medium px-2 py-1.5 text-muted shrink-0">
              ← Précédent
            </button>
          )}
          <button
            onClick={onNext}
            className="bg-ochre text-white rounded-lg px-4 py-2 text-sm font-medium shrink-0"
          >
            {isLast ? "Terminer" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TourSpotlight(props: Props) {
  const { step } = props;
  const pathname = usePathname();
  const onRightPage = pathname === step.page;
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [searched, setSearched] = useState(false);

  // Locate the target element on the current step's page. Retries because
  // right after a router.push the new page may not have rendered (or
  // hydrated) yet; gives up gracefully (falls back to a centered card)
  // rather than leaving the tour stuck if an element never appears — e.g.
  // the Stats calendar before a business has any sales yet.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRect(null);
    setSearched(false);
    if (!onRightPage || !step.target) {
      setSearched(true);
      return;
    }
    let attempts = 0;
    let cancelled = false;
    function tryFind() {
      if (cancelled) return;
      const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      if (el) {
        setRect(el.getBoundingClientRect());
        setSearched(true);
        return;
      }
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        setSearched(true);
        return;
      }
      setTimeout(tryFind, RETRY_MS);
    }
    tryFind();
    return () => {
      cancelled = true;
    };
  }, [onRightPage, step.target, step.page]);

  // Keep the spotlight aligned with its target if the viewport resizes.
  useEffect(() => {
    if (!rect || !step.target) return;
    function recompute() {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    }
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [rect, step.target]);

  // Lock background scroll while a spotlight is up, so the highlighted
  // rect can't drift out of sync with the page underneath.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!onRightPage || !searched) {
    // Waiting on navigation to land, or still searching for the target —
    // a plain dimmed backdrop avoids flashing unstyled content mid-transition.
    return <div className="fixed inset-0 z-[60] bg-ink/50" />;
  }

  if (!rect) {
    return (
      <div className="fixed inset-0 z-[60] bg-ink/60 flex items-center justify-center p-4">
        <TourBubble {...props} />
      </div>
    );
  }

  const PADDING = 8;
  const boxTop = rect.top - PADDING;
  const boxLeft = rect.left - PADDING;
  const boxWidth = rect.width + PADDING * 2;
  const boxHeight = rect.height + PADDING * 2;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bubbleWidth = Math.min(320, vw - 32);
  const placeBelow = boxTop + boxHeight + 240 < vh;
  const bubbleLeft = Math.min(Math.max(16, boxLeft + boxWidth / 2 - bubbleWidth / 2), vw - bubbleWidth - 16);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute bg-ink/60" style={{ top: 0, left: 0, right: 0, height: Math.max(0, boxTop) }} />
      <div className="absolute bg-ink/60" style={{ top: boxTop + boxHeight, left: 0, right: 0, bottom: 0 }} />
      <div
        className="absolute bg-ink/60"
        style={{ top: boxTop, left: 0, width: Math.max(0, boxLeft), height: boxHeight }}
      />
      <div className="absolute bg-ink/60" style={{ top: boxTop, left: boxLeft + boxWidth, right: 0, height: boxHeight }} />
      {/* transparent — sits over the highlighted hole just to swallow taps,
          so nothing underneath can be triggered by accident mid-tour */}
      <div className="absolute" style={{ top: boxTop, left: boxLeft, width: boxWidth, height: boxHeight }} />
      <div
        className="absolute rounded-xl border-2 border-ochre pointer-events-none"
        style={{
          top: boxTop,
          left: boxLeft,
          width: boxWidth,
          height: boxHeight,
          boxShadow: "0 0 0 4px rgba(201,122,43,0.25)",
        }}
      />
      <div
        className="absolute"
        style={{
          width: bubbleWidth,
          left: bubbleLeft,
          ...(placeBelow ? { top: boxTop + boxHeight + 12 } : { bottom: vh - boxTop + 12 }),
        }}
      >
        <TourBubble {...props} />
      </div>
    </div>
  );
}
