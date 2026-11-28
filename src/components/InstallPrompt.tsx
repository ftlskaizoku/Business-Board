"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// The install banner is offered ONE time per device. It is remembered as soon
// as it appears (localStorage + a long-lived cookie), so refreshing, logging
// out and back in, or ignoring it never brings it back. Installing later is
// still possible from Paramètres.
const SEEN_KEY = "bb-install-offered";

function alreadyOffered() {
  try {
    if (window.localStorage.getItem(SEEN_KEY)) return true;
  } catch {}
  return document.cookie.split("; ").some((c) => c.startsWith(SEEN_KEY + "="));
}

function rememberOffered() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {}
  document.cookie = `${SEEN_KEY}=1; max-age=${60 * 60 * 24 * 365 * 2}; path=/; samesite=lax`;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  // The banner belongs to the page where it popped up: moving to another page
  // (or waiting a few seconds) closes it for good — it is already marked seen.
  const [shownOn, setShownOn] = useState<string | null>(null);

  useEffect(() => {
    // register the service worker (required by Chrome for installability)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isStandalone() || alreadyOffered()) return;

    if (isIos()) {
      const t = window.setTimeout(() => {
        setShowIosHelp(true);
        setVisible(true);
        setShownOn(window.location.pathname);
        window.setTimeout(() => setVisible(false), 15000);
        rememberOffered();
      }, 0);
      return () => window.clearTimeout(t);
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
        setShownOn(window.location.pathname);
        window.setTimeout(() => setVisible(false), 15000);
      rememberOffered();
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    rememberOffered();
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    rememberOffered();
  }

  if (!visible || shownOn !== pathname) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 lg:bottom-4 lg:left-64 z-30 px-4 pb-3">
      <div className="max-w-2xl mx-auto bg-card text-ink border border-line rounded-xl p-3.5 flex items-start gap-3 shadow-lg">
        <span className="text-xl leading-none mt-0.5">📲</span>
        <div className="flex-1 min-w-0">
          {showIosHelp ? (
            <p className="text-xs leading-snug">
              Installez Business Board sur votre écran d&apos;accueil : appuyez sur{" "}
              <span className="font-medium">Partager</span> puis{" "}
              <span className="font-medium">« Sur l&apos;écran d&apos;accueil »</span>.
            </p>
          ) : (
            <p className="text-xs leading-snug">
              Installez Business Board sur votre téléphone pour y accéder en un tap, comme une vraie application.
            </p>
          )}
          <div className="flex gap-3 mt-2">
            {!showIosHelp && (
              <button onClick={handleInstall} className="text-xs font-semibold text-ochre underline underline-offset-2">
                Installer
              </button>
            )}
            <button onClick={dismiss} className="text-xs text-muted">
              {showIosHelp ? "Compris" : "Plus tard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
