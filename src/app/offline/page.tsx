"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <span className="text-3xl mb-4">📡</span>
      <h1 className="font-display text-xl font-semibold mb-2">Vous êtes hors connexion</h1>
      <p className="text-sm text-muted max-w-xs mb-6">
        Cette page n&apos;a pas encore été chargée sur cet appareil. Reconnectez-vous à
        internet pour y accéder — les pages déjà visitées restent, elles, disponibles
        hors ligne.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-sm font-medium text-ochre-soft bg-ink px-4 py-2.5 rounded-lg"
      >
        Réessayer
      </button>
    </div>
  );
}
