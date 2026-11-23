import { requireUserAndBusiness } from "@/lib/data";
import { NICHES, nicheLabel, hasServices, hasProducts } from "@/lib/niches";
import { ADMIN_EMAIL } from "@/lib/admin";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TourProvider from "@/components/TourProvider";
import { markTutorialSeen } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, business, profile } = await requireUserAndBusiness();
  const n = NICHES[business.niche];
  const label = nicheLabel(business.niche, business.custom_niche);
  const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <TourProvider
      autoStart={!profile?.tutorial_seen}
      businessName={business.name}
      showsServices={hasServices(business.type)}
      showsProducts={hasProducts(business.type)}
      onFinish={markTutorialSeen}
    >
      <div className="min-h-screen flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <header className="sticky top-0 z-20 px-5 pt-5 pb-3.5 border-b border-line bg-card/85 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 shrink-0 rounded-2xl bg-ochre-soft flex items-center justify-center text-lg">
                {n.icon}
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold leading-tight truncate">{business.name}</p>
                <p className="text-xs text-muted leading-tight truncate">{label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isAdmin && (
                <Link href="/admin" className="text-xs font-medium text-indigo bg-indigo-soft rounded-full px-3 py-1.5">
                  Admin
                </Link>
              )}
              <Link
                href="/parametres"
                aria-label="Paramètres"
                className="w-9 h-9 rounded-full bg-cream border border-line text-muted flex items-center justify-center transition-colors hover:text-ink active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
                </svg>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 pt-6 pb-8 max-w-2xl mx-auto w-full">{children}</main>

        <BottomNav type={business.type} />
      </div>
    </TourProvider>
  );
}
