import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineBanner from "@/components/OfflineBanner";
import { cookies } from "next/headers";
import { cleanTheme, THEME_COOKIE, THEME_IDS } from "@/lib/themes";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// Variable font: no explicit weights (multi-weight queries break Turbopack builds).
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Business Board",
  description: "Le tableau de bord de votre commerce",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Business Board",
  },
};

export const viewport: Viewport = {
  themeColor: "#2B2013",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The saved theme is read on the server from a cookie and written straight
  // onto <html>, so the very first paint already has the right colours and a
  // reload can never fall back to the default palette.
  const theme = cleanTheme((await cookies()).get(THEME_COOKIE)?.value);
  const themeIds = JSON.stringify(THEME_IDS);
  return (
    <html
      lang="fr"
      data-theme={theme}
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Safety net for people who saved a theme before the cookie existed:
            it re-applies the localStorage value and writes the cookie. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var ok=" + themeIds + ",t=localStorage.getItem('bb-theme'),h=document.documentElement;" +
              "if(t&&t!=='default'&&ok.indexOf(t)>-1){if(h.getAttribute('data-theme')!==t){h.setAttribute('data-theme',t);}" +
              "document.cookie='bb-theme='+t+';path=/;max-age=31536000;samesite=lax';}" +
              "else if(t==='default'){h.removeAttribute('data-theme');document.cookie='bb-theme=default;path=/;max-age=31536000;samesite=lax';}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <OfflineBanner />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
