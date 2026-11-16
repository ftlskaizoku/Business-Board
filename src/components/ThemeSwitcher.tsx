"use client";

import { useEffect, useState } from "react";
import { THEMES, THEME_COOKIE, THEME_STORAGE_KEY, type ThemeDef } from "@/lib/themes";

function Tile({ t, active, onPick }: { t: ThemeDef; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={`relative rounded-2xl border-2 p-2 text-left transition-colors ${
        active ? "border-ochre" : "border-line"
      }`}
    >
      {/* Mini preview: page background, a card, and the accent colour. */}
      <span
        className="block w-full h-14 rounded-xl mb-2 p-1.5 border border-black/5"
        style={{ background: t.bg }}
      >
        <span
          className="flex items-center gap-1.5 h-full rounded-lg px-1.5"
          style={{ background: t.card }}
        >
          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: t.swatch }} />
          <span className="flex-1 space-y-1">
            <span className="block h-1 rounded-full" style={{ background: t.swatch, opacity: 0.85 }} />
            <span className="block h-1 w-2/3 rounded-full" style={{ background: t.swatch, opacity: 0.3 }} />
          </span>
        </span>
      </span>
      <span className="text-xs font-medium leading-tight block truncate">{t.label}</span>
      {active && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-ochre flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

export default function ThemeSwitcher() {
  const [active, setActive] = useState<string>("default");
  const [saved, setSaved] = useState(false);

  // Reads the theme the server already put on <html data-theme>, so the
  // selection always matches what is on screen.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(document.documentElement.getAttribute("data-theme") || "default");
  }, []);

  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(id);
  }, [saved]);

  function apply(themeId: string) {
    setActive(themeId);
    if (themeId === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
    }
    // Saved in two places: the cookie lets the server render the right theme
    // on every load (no flash, survives reloads), localStorage is the backup.
    try {
      document.cookie = `${THEME_COOKIE}=${themeId};path=/;max-age=31536000;samesite=lax`;
    } catch {}
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {}
    setSaved(true);
  }

  const light = THEMES.filter((t) => !t.dark);
  const dark = THEMES.filter((t) => t.dark);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest text-muted font-medium">Thèmes clairs</p>
        <span
          className={`text-xs text-green font-medium transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}
          aria-live="polite"
        >
          ✓ Thème enregistré
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {light.map((t) => (
          <Tile key={t.id} t={t} active={active === t.id} onPick={() => apply(t.id)} />
        ))}
      </div>

      <p className="text-xs uppercase tracking-widest text-muted font-medium mb-2">Thèmes sombres</p>
      <div className="grid grid-cols-3 gap-2.5">
        {dark.map((t) => (
          <Tile key={t.id} t={t} active={active === t.id} onPick={() => apply(t.id)} />
        ))}
      </div>
      <p className="text-[11px] text-muted mt-3">Votre choix est gardé sur cet appareil à chaque ouverture de l&apos;application.</p>
    </div>
  );
}
