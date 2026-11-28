"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildTourSteps } from "@/lib/tour-steps";
import TourSpotlight from "./TourSpotlight";

interface TourContextValue {
  startTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

// Lets any page under (app) — e.g. a "Revoir la visite guidée" button in
// Paramètres — restart the tour without prop-drilling through the layout.
export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export default function TourProvider({
  children,
  userId,
  autoStart,
  businessName,
  showsServices,
  showsProducts,
  onFinish,
}: {
  children: React.ReactNode;
  userId: string;
  autoStart: boolean;
  businessName: string;
  showsServices: boolean;
  showsProducts: boolean;
  onFinish: () => Promise<void>;
}) {
  // Derived from props that don't change mid-tour, so plain useMemo (read
  // safely during render) is the right tool here — not a ref.
  const steps = useMemo(
    () => buildTourSteps({ businessName, showsServices, showsProducts }),
    [businessName, showsServices, showsProducts]
  );
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const hasAutoStarted = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // The first-visit tour is shown ONCE. It is marked as seen the moment it
  // opens (not when it is finished), both on the account and on this device,
  // so a refresh, a new login or closing the tab mid-way never brings it back.
  // "Revoir la visite guidée" in Paramètres still works through startTour.
  useEffect(() => {
    if (!autoStart || hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    const key = `bb-tour-seen-${userId}`;
    let seenHere = false;
    try {
      seenHere = window.localStorage.getItem(key) === "1";
    } catch {}
    if (seenHere) {
      onFinish(); // account flag was missing — repair it, don't show the tour
      return;
    }
    try {
      window.localStorage.setItem(key, "1");
    } catch {}
    onFinish();
    setStepIndex(0);
    setActive(true);
  }, [autoStart, userId, onFinish]);

  const step = steps[stepIndex];

  // Each step names the page it belongs to (e.g. /vente). Whenever the
  // active step changes to one on a different page, navigate there — this
  // is what makes the tour actually walk through the app instead of just
  // describing it from one screen.
  useEffect(() => {
    if (active && step && step.page !== pathname) {
      router.push(step.page);
    }
  }, [active, step, pathname, router]);

  const finish = useCallback(() => {
    setActive(false);
    onFinish();
  }, [onFinish]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, finish]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setActive(true);
    if (steps[0].page !== pathname) router.push(steps[0].page);
  }, [pathname, router, steps]);

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      {active && step && (
        <TourSpotlight
          step={step}
          index={stepIndex}
          total={steps.length}
          onNext={next}
          onPrev={stepIndex > 0 ? prev : undefined}
          onSkip={finish}
        />
      )}
    </TourContext.Provider>
  );
}
