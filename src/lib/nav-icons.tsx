// Shared by the phone tab bar, the desktop sidebar and the help page.
// Lives in a plain module (not a "use client" one) so server components can read it too.
export const NAV_ICONS: Record<string, React.ReactNode> = {
  "/dashboard": <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z" />,
  "/stats": <path d="M4 20V10m6 10V4m6 16v-7m4 7H3" />,
  "/vente": <path d="M12 5v14M5 12h14" />,
  "/depenses": <path d="M4 7.5A2.5 2.5 0 016.5 5H18v3M4 7.5V17a2 2 0 002 2h13a1 1 0 001-1V9a1 1 0 00-1-1H6.5A2.5 2.5 0 014 7.5zM16 13.5h.01" />,
  "/catalogue": <path d="M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4" />,
  "/clients": <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm10 9v-1.5a3.5 3.5 0 00-2.5-3.35M15.5 4.2a3.5 3.5 0 010 6.6" />,
};

