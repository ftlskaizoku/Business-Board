import { requireUserAndBusiness } from "@/lib/data";
import { NICHES } from "@/lib/niches";
import BottomNav from "@/components/BottomNav";
import SignOutButton from "@/components/SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business } = await requireUserAndBusiness();
  const n = NICHES[business.niche];

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <header className="px-5 pt-6 pb-4 border-b border-line bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-ochre-soft flex items-center justify-center text-base">
              {n.icon}
            </span>
            <div>
              <p className="font-display font-semibold leading-tight">{business.name}</p>
              <p className="text-xs text-muted leading-tight">{n.label}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 px-5 py-5 max-w-2xl mx-auto w-full">{children}</main>

      <BottomNav type={business.type} />
    </div>
  );
}
