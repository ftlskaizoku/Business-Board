export const THEME_COOKIE = "bb-theme";
export const THEME_STORAGE_KEY = "bb-theme";

export interface ThemeDef {
  id: string; // "default" = no data-theme attribute (the original Ochre palette)
  label: string;
  swatch: string; // accent colour
  bg: string; // page background
  card: string; // card colour, for the preview tile
  dark: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: "default", label: "Ochre", swatch: "#C97A2B", bg: "#FBF6EE", card: "#FFFFFF", dark: false },
  { id: "indigo", label: "Indigo", swatch: "#3F4B8C", bg: "#F3F4FB", card: "#FFFFFF", dark: false },
  { id: "foret", label: "Forêt", swatch: "#3D8B5F", bg: "#F2F5EE", card: "#FFFFFF", dark: false },
  { id: "corail", label: "Corail", swatch: "#D96B4F", bg: "#FDF3EF", card: "#FFFFFF", dark: false },
  { id: "ardoise", label: "Ardoise", swatch: "#475569", bg: "#F1F5F9", card: "#FFFFFF", dark: false },
  { id: "violet", label: "Violet", swatch: "#7C4DBC", bg: "#F7F4FC", card: "#FFFFFF", dark: false },
  { id: "sombre", label: "Sombre", swatch: "#E29A4E", bg: "#1B1712", card: "#242019", dark: true },
  { id: "nuit-indigo", label: "Nuit indigo", swatch: "#7B86D9", bg: "#14162A", card: "#1D2038", dark: true },
  { id: "minuit", label: "Minuit", swatch: "#4C8DFF", bg: "#0A0E17", card: "#121826", dark: true },
  { id: "foret-nuit", label: "Forêt de nuit", swatch: "#4FC47F", bg: "#0F1A14", card: "#16241C", dark: true },
  { id: "violet-nuit", label: "Violet de nuit", swatch: "#A67BEA", bg: "#150F20", card: "#1E1630", dark: true },
  { id: "carbone", label: "Carbone", swatch: "#2DD4BF", bg: "#121212", card: "#1C1C1E", dark: true },
  { id: "braise", label: "Braise", swatch: "#FF7A59", bg: "#1C1210", card: "#271A17", dark: true },
];

export const THEME_IDS = THEMES.map((t) => t.id);

/** Returns a safe theme id (or undefined for the default palette). */
export function cleanTheme(value: string | undefined | null): string | undefined {
  if (!value || value === "default") return undefined;
  return THEME_IDS.includes(value) ? value : undefined;
}
