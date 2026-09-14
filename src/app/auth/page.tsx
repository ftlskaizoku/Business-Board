"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);

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

  if (awaitingOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Business Board</p>
          <h1 className="font-display text-2xl font-semibold mb-1">Vérifiez votre téléphone</h1>
          <p className="text-muted text-sm mb-8">
            Entrez le code à 6 chiffres envoyé par SMS au <b>{phone}</b>.
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              inputMode="numeric"
              autoFocus
              maxLength={6}
              className="w-full border border-line rounded-lg px-3 py-2.5 bg-card outline-none focus:border-ochre text-center tracking-[0.4em] text-lg"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
            />
            {error && <p className="text-red text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-ochre text-white rounded-lg py-3 font-medium disabled:opacity-60"
            >
              {loading ? "…" : "Confirmer"}
            </button>
          </form>

          <button className="mt-6 text-sm text-muted w-full text-center" onClick={resendOtp}>
            Renvoyer le code
          </button>
          <button
            className="mt-2 text-sm text-muted w-full text-center"
            onClick={() => {
              setAwaitingOtp(false);
              setOtp("");
            }}
          >
            ← Modifier le numéro
          </button>
        </div>
      </div>
    );
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <p className="font-display text-2xl font-semibold mb-3">Vérifiez vos e-mails</p>
          <p className="text-muted text-sm">
            Un lien de confirmation a été envoyé à <b>{email}</b>. Ouvrez-le pour activer votre compte, puis revenez ici pour vous connecter.
          </p>
          <button
            className="mt-6 text-ochre text-sm font-medium"
            onClick={() => { setCheckEmail(false); setMode("signin"); }}
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <p className="text-xs uppercase tracking-widest text-muted mb-2">Business Board</p>
        <h1 className="font-display text-3xl font-semibold mb-1">
          {mode === "signup" ? "Créer un compte" : "Bon retour"}
        </h1>
        <p className="text-muted text-sm mb-6">
          {mode === "signup"
            ? "Quelques informations de base pour commencer."
            : "Connectez-vous pour retrouver votre commerce."}
        </p>

        <div className="flex border border-line rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setMethod("email")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium ${method === "email" ? "bg-ochre text-white" : "text-muted"}`}
          >
            E-mail
          </button>
          <button
            type="button"
            onClick={() => setMethod("phone")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium ${method === "phone" ? "bg-ochre text-white" : "text-muted"}`}
          >
            Téléphone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs text-muted mb-1">Nom complet</label>
              <input
                name="name"
                autoComplete="name"
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-card outline-none focus:border-ochre"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aïssatou Diop"
                required
              />
            </div>
          )}

          {method === "email" ? (
            <div>
              <label className="block text-xs text-muted mb-1">E-mail</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-card outline-none focus:border-ochre"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-muted mb-1">Numéro de téléphone</label>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-card outline-none focus:border-ochre"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221771234567"
                pattern="\+[1-9]\d{6,14}"
                required
              />
              <p className="text-xs text-muted mt-1">Format international avec indicatif, ex. +221771234567.</p>
            </div>
          )}

          <div>
            <label className="block text-xs text-muted mb-1">Mot de passe</label>
            <input
              type="password"
              name="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full border border-line rounded-lg px-3 py-2.5 bg-card outline-none focus:border-ochre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              minLength={8}
              required
            />
          </div>

          {error && <p className="text-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || (method === "phone" && !PHONE_RE.test(phone))}
            className="w-full bg-ochre text-white rounded-lg py-3 font-medium disabled:opacity-60"
          >
            {loading ? "…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <button
          className="mt-6 text-sm text-muted w-full text-center"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? En créer un"}
        </button>
      </div>
    </div>
  );
}
