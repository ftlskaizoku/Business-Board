"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-card border border-line rounded-[28px] card-surface p-7 sm:p-9 text-center">
        <span className="mx-auto w-14 h-14 rounded-2xl bg-ochre-soft text-ochre flex items-center justify-center mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0" />
            <path d="M12 19.5h.01" />
            <path d="M3 3l18 18" />
          </svg>
        </span>
        <h1 className="font-display text-2xl font-semibold mb-2">Vous êtes hors connexion</h1>
        <p className="text-sm text-muted leading-relaxed mb-6 [text-wrap:pretty]">
          Cette page n&apos;a pas encore été chargée sur cet appareil. Reconnectez-vous à internet pour y accéder — les
          pages déjà visitées restent, elles, disponibles hors ligne.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full h-12 rounded-2xl bg-ochre font-medium text-[15px]"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
