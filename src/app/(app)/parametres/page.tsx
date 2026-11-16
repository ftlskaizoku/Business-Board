import Link from "next/link";
import { requireUserAndBusiness } from "@/lib/data";
import { ADMIN_EMAIL } from "@/lib/admin";
import { nicheLabel, hasProducts } from "@/lib/niches";
import { Card, EyebrowLabel } from "@/components/ui";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import RestartTourButton from "@/components/RestartTourButton";
import TrackStockToggle from "@/components/TrackStockToggle";
import SignOutButton from "@/components/SignOutButton";
import { updateFullName, updateBusinessName } from "../actions";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const { user, business, profile } = await requireUserAndBusiness();

  const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL || null;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "—";

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">Paramètres</p>
      <h1 className="font-display text-[26px] leading-tight font-semibold mb-5">Votre compte</h1>

      <EyebrowLabel>Informations personnelles</EyebrowLabel>
      <Card>
        <form action={updateFullName} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">Nom complet</label>
            <input
              name="full_name"
              defaultValue={profile?.full_name || ""}
              required
              className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
            />
          </div>
          <button type="submit" className="text-xs font-medium text-ochre underline underline-offset-2">
            Enregistrer
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-line space-y-1.5">
          <p className="text-xs text-muted">
            E-mail <span className="text-ink">{profile?.email || "—"}</span>
          </p>
          <p className="text-xs text-muted">
            Téléphone <span className="text-ink">{profile?.phone || "—"}</span>
          </p>
          <p className="text-xs text-muted">
            Membre depuis <span className="text-ink capitalize">{memberSince}</span>
          </p>
        </div>
      </Card>

      <EyebrowLabel>Votre commerce</EyebrowLabel>
      <Card>
        <form action={updateBusinessName} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">Nom du commerce</label>
            <input
              name="name"
              defaultValue={business.name}
              required
              className="w-full border border-line rounded-lg px-3 py-2 bg-cream"
            />
          </div>
          <button type="submit" className="text-xs font-medium text-ochre underline underline-offset-2">
            Enregistrer
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-line space-y-1.5">
          <p className="text-xs text-muted">
            Activité <span className="text-ink">{nicheLabel(business.niche, business.custom_niche)}</span>
          </p>
          <p className="text-xs text-muted">
            Devise <span className="text-ink">{business.currency}</span>
          </p>
        </div>
      </Card>

      {hasProducts(business.type) && (
        <>
          <EyebrowLabel>Stock</EyebrowLabel>
          <Card>
            <TrackStockToggle initial={business.track_stock} />
          </Card>
        </>
      )}

      <EyebrowLabel>Apparence</EyebrowLabel>
      <Card data-tour="parametres-theme">
        <ThemeSwitcher />
      </Card>

      <EyebrowLabel>Application Android</EyebrowLabel>
      <Card>
        {apkUrl ? (
          <>
            <p className="text-sm font-medium mb-1">Télécharger le fichier APK</p>
            <p className="text-xs text-muted mb-3">
              Installez Business Board directement sur votre téléphone Android, en dehors du Play Store.
              Android peut demander d&apos;autoriser l&apos;installation depuis des sources inconnues la
              première fois — c&apos;est normal.
            </p>
            <a
              href={apkUrl}
              download
              className="inline-block bg-ochre text-white text-sm font-medium rounded-lg px-4 py-2.5"
            >
              Télécharger l&apos;APK
            </a>
          </>
        ) : (
          <>
            <p className="text-sm font-medium mb-1">Bientôt disponible</p>
            <p className="text-xs text-muted">
              En attendant, vous pouvez ajouter Business Board à votre écran d&apos;accueil directement
              depuis votre navigateur — la bannière d&apos;installation vous le proposera automatiquement.
            </p>
          </>
        )}
      </Card>

      <EyebrowLabel>Aide</EyebrowLabel>
      <Card className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium">Visite guidée</p>
          <p className="text-xs text-muted mt-0.5">Refaire le tour de l&apos;application, écran par écran.</p>
        </div>
        <RestartTourButton />
      </Card>
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Comment utiliser Business Board</p>
          <p className="text-xs text-muted mt-0.5">Guide écrit, à consulter à votre rythme.</p>
        </div>
        <Link href="/aide" className="text-xs font-medium text-ochre shrink-0">
          Ouvrir →
        </Link>
      </Card>

      {isAdmin && (
        <>
          <EyebrowLabel>Administration</EyebrowLabel>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Espace admin</p>
              <p className="text-xs text-muted mt-0.5">Gérer les utilisateurs et voir tous les commerces.</p>
            </div>
            <Link href="/admin" className="text-xs font-medium text-indigo shrink-0">
              Ouvrir →
            </Link>
          </Card>
        </>
      )}

      <EyebrowLabel>Compte</EyebrowLabel>
      <Card className="flex items-center justify-between">
        <p className="text-sm">Se déconnecter de Business Board</p>
        <SignOutButton />
      </Card>
    </div>
  );
}
