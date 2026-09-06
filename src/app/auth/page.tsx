"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (data.session) {
        router.push("/onboarding");
      } else {
        setCheckEmail(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      router.push("/");
      router.refresh();
    }
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
        <p className="text-muted text-sm mb-8">
          {mode === "signup"
            ? "Quelques informations de base pour commencer."
            : "Connectez-vous pour retrouver votre commerce."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs text-muted mb-1">Nom complet</label>
              <input
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-card outline-none focus:border-ochre"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aïssatou Diop"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">E-mail</label>
            <input
              type="email"
              className="w-full border border-line rounded-lg px-3 py-2.5 bg-card outline-none focus:border-ochre"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Mot de passe</label>
            <input
              type="password"
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
            disabled={loading}
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
