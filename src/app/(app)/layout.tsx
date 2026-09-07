import { requireUserAndBusiness } from "@/lib/data";
import { NICHES, nicheLabel } from "@/lib/niches";
import { ADMIN_EMAIL } from "@/lib/admin";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SignOutButton from "@/components/SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, business } = await requireUserAndBusiness();
  const n = NICHES[business.niche];
  const label = nicheLabel(business.niche, business.custom_niche);
  const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
              <p className="text-xs text-muted leading-tight">{label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin" className="text-xs font-medium text-indigo">
                Admin
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 max-w-2xl mx-auto w-full">{children}</main>

      <BottomNav type={business.type} />
    </div>
  );
}
