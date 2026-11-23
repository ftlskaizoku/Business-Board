"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// Loose E.164 check: a "+" then 7–15 digits (e.g. +221771234567).
const PHONE_RE = /^\+[1-9]\d{6,14}$/;

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signin" ? "signin" : "signup"
  );
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "oauth" ? "La connexion avec Google a échoué. Réessayez." : null
  );
  const [checkEmail, setCheckEmail] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser navigates to Google's consent screen, so this
    // line only runs when signInWithOAuth itself failed to start.
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } =
        method === "email"
          ? await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: fullName } },
            })
          : await supabase.auth.signUp({
              phone,
              password,
              options: { data: { full_name: fullName } },
            });
      setLoading(false);
      if (error) return setError(error.message);
      if (data.session) {
        router.push("/onboarding");
      } else if (method === "phone") {
        // Phone sign-up confirms via a 6-digit SMS code rather than a link.
        setAwaitingOtp(true);
      } else {
        setCheckEmail(true);
      }
    } else {
      const { error } =
        method === "email"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signInWithPassword({ phone, password });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/");
      router.refresh();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/onboarding");
    router.refresh();
  }

  async function resendOtp() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "sms", phone });
    if (error) setError(error.message);
  }

  const primary =
    "w-full h-12 rounded-2xl bg-ochre font-medium text-[15px] disabled:opacity-50 shadow-[0_6px_16px_-8px_var(--color-ochre)]";
  const label = "block text-xs font-medium text-muted mb-1.5";

  if (awaitingOtp) {
    return (
      <AuthShell>
        <p className="text-xs uppercase tracking-widest text-muted mb-2">Vérification</p>
        <h1 className="font-display text-[28px] leading-tight font-semibold mb-2">Vérifiez votre téléphone</h1>
        <p className="text-muted text-sm mb-8">
          Entrez le code à 6 chiffres envoyé par SMS au <b className="text-ink">{phone}</b>.
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            className="field !h-14 text-center tracking-[0.5em] text-xl font-mono"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            aria-label="Code à 6 chiffres"
            required
          />
          {error && <p role="alert" className="text-red text-sm">{error}</p>}
          <button type="submit" disabled={loading || otp.length < 6} className={primary}>
            {loading ? "Vérification…" : "Confirmer"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-1">
          <button className="text-sm text-muted h-10 px-3" onClick={resendOtp}>
            Renvoyer le code
          </button>
          <button
            className="text-sm text-muted h-10 px-3"
            onClick={() => {
              setAwaitingOtp(false);
              setOtp("");
            }}
          >
            ← Modifier le numéro
          </button>
        </div>
      </AuthShell>
    );
  }

  if (checkEmail) {
    return (
      <AuthShell>
        <span className="w-14 h-14 rounded-2xl bg-ochre-soft text-ochre flex items-center justify-center mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M3.5 7l8.5 6 8.5-6" />
          </svg>
        </span>
        <h1 className="font-display text-[28px] leading-tight font-semibold mb-2">Vérifiez vos e-mails</h1>
        <p className="text-muted text-sm leading-relaxed">
          Un lien de confirmation a été envoyé à <b className="text-ink break-all">{email}</b>. Ouvrez-le pour activer votre
          compte, puis revenez ici pour vous connecter.
        </p>
        <button
          className="mt-6 text-ochre text-sm font-medium h-10"
          onClick={() => {
            setCheckEmail(false);
            setMode("signin");
          }}
        >
          ← Retour à la connexion
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <p className="text-xs uppercase tracking-widest text-muted mb-2">{mode === "signup" ? "Inscription" : "Connexion"}</p>
      <h1 className="font-display text-[30px] leading-tight font-semibold mb-1.5">
        {mode === "signup" ? "Créer un compte" : "Bon retour"}
      </h1>
      <p className="text-muted text-sm mb-7">
        {mode === "signup"
          ? "Quelques informations de base pour commencer."
          : "Connectez-vous pour retrouver votre commerce."}
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full h-12 rounded-2xl border border-line bg-card font-medium text-[15px] flex items-center justify-center gap-2.5 mb-5 disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.97v2.33A9 9 0 0 0 9 18Z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.03l2.98-2.33Z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .97 4.97l2.98 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
        </svg>
        {googleLoading ? "Redirection…" : "Continuer avec Google"}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <span className="flex-1 h-px bg-line" />
        <span className="text-xs text-muted">ou</span>
        <span className="flex-1 h-px bg-line" />
      </div>

      <div role="tablist" aria-label="Méthode de connexion" className="relative flex p-1 rounded-2xl bg-line/60 mb-5">
        <span
          aria-hidden
          className="nav-pill absolute top-1 bottom-1 left-1 rounded-xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
          style={{ width: "calc((100% - 0.5rem) / 2)", transform: `translateX(${method === "email" ? 0 : 100}%)` }}
        />
        {(["email", "phone"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={method === m}
            onClick={() => setMethod(m)}
            className={`relative z-10 flex-1 h-10 rounded-xl text-sm transition-colors ${
              method === m ? "font-semibold text-ink" : "font-medium text-muted"
            }`}
          >
            {m === "email" ? "E-mail" : "Téléphone"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className={label}>Nom complet</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              className="field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aïssatou Diop"
              required
            />
          </div>
        )}

        {method === "email" ? (
          <div>
            <label htmlFor="email" className={label}>E-mail</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </div>
        ) : (
          <div>
            <label htmlFor="phone" className={label}>Numéro de téléphone</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              className="field font-mono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+221771234567"
              pattern="\+[1-9]\d{6,14}"
              required
            />
            <p className="text-[11px] text-muted mt-1.5">Format international avec indicatif, ex. +221771234567.</p>
          </div>
        )}

        <div>
          <label htmlFor="password" className={label}>Mot de passe</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              name="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="field !pr-20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-pressed={showPw}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-3 rounded-lg text-xs font-medium text-muted"
            >
              {showPw ? "Masquer" : "Afficher"}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-red text-sm bg-red-soft rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading || (method === "phone" && !PHONE_RE.test(phone))} className={primary}>
          {loading ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>

      <button
        className="mt-6 text-sm text-muted w-full text-center h-10"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? En créer un"}
      </button>
    </AuthShell>
  );
}

const POINTS = [
  "Ventes et dépenses en quelques taps",
  "Stock, clients et statistiques clairs",
  "En FCFA, en français, installable sur téléphone",
];

/** Two-column on desktop (brand panel + form), single column on phones. */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden lg:flex flex-col justify-between bg-ink text-cream p-12 xl:p-16">
        <Link href="/" className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-ochre flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20V10m6 10V4m6 16v-7" />
            </svg>
          </span>
          <span className="font-display font-semibold text-lg">Business Board</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.1] max-w-md [text-wrap:balance]">
            Le tableau de bord de votre commerce.
          </h2>
          <ul className="mt-8 space-y-3.5 max-w-sm">
            {POINTS.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] text-cream/80">
                <svg className="mt-0.5 shrink-0 text-ochre" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-cream/50">Fait pour les commerces d&apos;Afrique de l&apos;Ouest</p>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-8">
        <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8 w-fit">
          <span className="w-9 h-9 rounded-xl bg-ochre flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20V10m6 10V4m6 16v-7" />
            </svg>
          </span>
          <span className="font-display font-semibold">Business Board</span>
        </Link>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm lg:max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
