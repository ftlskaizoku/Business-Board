import Link from "next/link";
import { requireUserAndBusiness } from "@/lib/data";
import { ADMIN_EMAIL } from "@/lib/admin";
import { nicheLabel, hasProducts } from "@/lib/niches";
import NicheIcon from "@/components/NicheIcon";
import { SectionHeader } from "@/components/ui";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import RestartTourButton from "@/components/RestartTourButton";
import TrackStockToggle from "@/components/TrackStockToggle";
import SignOutButton from "@/components/SignOutButton";
import InlineEdit from "@/components/InlineEdit";
import { updateFullName, updateBusinessName } from "../actions";

export const dynamic = "force-dynamic";

/** Rounded block whose rows are separated by hairlines (iOS-settings style). */
function Group({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="bg-card border border-line rounded-[20px] card-surface divide-y divide-line overflow-hidden" {...rest}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 min-w-0">
      <span className="text-sm text-muted shrink-0">{label}</span>
      <span className="text-sm font-medium truncate text-right">{value}</span>
    </div>
  );
}

function LinkRow({
  title,
  hint,
  action,
  tone = "ochre",
}: {
  title: string;
  hint: string;
  action: React.ReactNode;
  tone?: "ochre" | "indigo";
}) {
  void tone;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 min-w-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted mt-0.5">{hint}</p>
      </div>
      {action}
    </div>
  );
}

export default async function ParametresPage() {
  const { user, business, profile } = await requireUserAndBusiness();

  const isAdmin = (user.email || "").trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL || null;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })
    : "—";
  const displayName = profile?.full_name || profile?.email || "Votre compte";

  return (
    <div className="lg:max-w-3xl">
      {/* Identity block */}
      <div className="flex items-center gap-4 mb-2 min-w-0">
        <span className="w-16 h-16 shrink-0 rounded-[22px] bg-ochre-soft text-ochre flex items-center justify-center font-display text-2xl font-semibold">
          {displayName.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted font-medium">Paramètres</p>
          <h1 className="font-display text-[24px] leading-tight font-semibold truncate">{displayName}</h1>
          <p className="text-xs text-muted truncate mt-0.5 flex items-center gap-1.5">
            <NicheIcon niche={business.niche} size={14} className="shrink-0 text-ochre" />
            <span className="truncate">{business.name} · depuis <span className="capitalize">{memberSince}</span></span>
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
        <div className="min-w-0">
      <SectionHeader title="Profil" />
      <Group>
        <InlineEdit label="Nom complet" name="full_name" value={profile?.full_name || ""} action={updateFullName} />
        <Row label="E-mail" value={profile?.email || "—"} />
        <Row label="Téléphone" value={profile?.phone || "—"} />
      </Group>

      <SectionHeader title="Votre commerce" />
      <Group>
        <InlineEdit label="Nom du commerce" name="name" value={business.name} action={updateBusinessName} />
        <Row label="Activité" value={nicheLabel(business.niche, business.custom_niche)} />
        <Row label="Devise" value={business.currency} />
        {hasProducts(business.type) && (
          <div className="px-4 py-3.5">
            <TrackStockToggle initial={business.track_stock} />
          </div>
        )}
      </Group>

      <SectionHeader title="Compte" />
      <Group>
        <LinkRow title="Se déconnecter" hint={profile?.email || user.email || ""} action={<SignOutButton />} />
      </Group>
        </div>
        <div className="min-w-0">
      <SectionHeader title="Apparence" />
      <div className="bg-card border border-line rounded-[20px] card-surface p-4" data-tour="parametres-theme">
        <ThemeSwitcher />
      </div>

      <SectionHeader title="Application" />
      <Group>
        {apkUrl ? (
          <div className="px-4 py-3.5">
            <p className="text-sm font-medium">Application Android (APK)</p>
            <p className="text-xs text-muted mt-1 mb-3 leading-relaxed">
              Installez Business Board directement sur votre téléphone, hors Play Store. Android peut demander
              d&apos;autoriser les sources inconnues la première fois — c&apos;est normal.
            </p>
            <a href={apkUrl} download className="inline-flex items-center h-10 rounded-xl bg-ochre px-4 text-sm font-medium">
              Télécharger l&apos;APK
            </a>
          </div>
        ) : (
          <div className="px-4 py-3.5">
            <p className="text-sm font-medium">Sur votre écran d&apos;accueil</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Ajoutez Business Board depuis votre navigateur : la bannière d&apos;installation vous le propose
              automatiquement. Une version APK arrive bientôt.
            </p>
          </div>
        )}
      </Group>

      <SectionHeader title="Aide" />
      <Group>
        <LinkRow
          title="Visite guidée"
          hint="Refaire le tour de l'application."
          action={<RestartTourButton />}
        />
        <LinkRow
          title="Comment utiliser Business Board"
          hint="Guide écrit, à votre rythme."
          action={
            <Link href="/aide" className="text-xs font-medium text-ochre shrink-0 h-9 flex items-center">
              Ouvrir →
            </Link>
          }
        />
      </Group>

      {isAdmin && (
        <>
          <SectionHeader title="Administration" />
          <Group>
            <LinkRow
              title="Espace admin"
              hint="Utilisateurs et commerces de la plateforme."
              action={
                <Link href="/admin" className="text-xs font-medium text-indigo shrink-0 h-9 flex items-center">
                  Ouvrir →
                </Link>
              }
            />
          </Group>
        </>
      )}
        </div>
      </div>
    </div>
  );
}
