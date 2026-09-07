"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "bb-install-dismissed-at";
const DISMISS_DAYS = 14;

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

function recentlyDismissed() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // register the service worker (required by Chrome for installability)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isStandalone() || recentlyDismissed()) return;

    if (isIos()) {
      setShowIosHelp(true);
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-3">
      <div className="max-w-2xl mx-auto bg-ink text-white rounded-xl p-3.5 flex items-start gap-3 shadow-lg">
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
              <button onClick={handleInstall} className="text-xs font-medium text-ochre-soft underline underline-offset-2">
                Installer
              </button>
            )}
            <button onClick={dismiss} className="text-xs text-white/60">
              {showIosHelp ? "Compris" : "Plus tard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
