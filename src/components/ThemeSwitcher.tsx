"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "default", label: "Ochre", swatch: "#C97A2B", bg: "#FBF6EE" },
  { id: "indigo", label: "Indigo", swatch: "#3F4B8C", bg: "#F3F4FB" },
  { id: "foret", label: "Forêt", swatch: "#3D8B5F", bg: "#F2F5EE" },
  { id: "corail", label: "Corail", swatch: "#D96B4F", bg: "#FDF3EF" },
  { id: "slate", label: "Slate", swatch: "#47586E", bg: "#F1F3F5" },
  { id: "purple", label: "Violet", swatch: "#7C4FBF", bg: "#F7F3FB" },
  { id: "sombre", label: "Sombre", swatch: "#E29A4E", bg: "#1B1712" },
  { id: "nuit-indigo", label: "Nuit indigo", swatch: "#7B86D9", bg: "#14162A" },
] as const;

const STORAGE_KEY = "bb-theme";

export default function ThemeSwitcher() {
  const [active, setActive] = useState<string>("default");

  // Reads the theme the blocking <script> in the root layout already applied
  // to <html data-theme>, so the swatch selection matches without needing to
  // duplicate that logic (and without touching localStorage during SSR,
  // which would mismatch between server and client anyway).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(document.documentElement.getAttribute("data-theme") || "default");
  }, []);

  function apply(themeId: string) {
    setActive(themeId);
    if (themeId === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    } catch {}
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => apply(t.id)}
          className={`rounded-xl border p-2.5 text-left ${
            active === t.id ? "border-ochre" : "border-line"
          }`}
        >
          <span
            className="block w-full h-8 rounded-lg mb-2 border border-line/50"
            style={{ background: t.bg }}
          >
            <span className="block w-4 h-4 rounded-full ml-2 mt-2" style={{ background: t.swatch }} />
          </span>
          <span className="text-xs font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
