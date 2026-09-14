// Service worker for Business Board.
//
// Deliberately narrow in scope:
// - Navigation requests (page loads) always go to the network first, so
//   signed-in users see fresh data. Only falls back to a cached "/offline"
//   page if the network genuinely fails.
// - Hashed, immutable Next.js build assets (/_next/static/*) and our own
//   icons are cached, since a new deploy ships new filenames rather than
//   overwriting old ones — safe to cache aggressively.
// - Everything else — most importantly all Supabase calls (sales, stock,
//   expenses, auth) — is left completely untouched and always hits the
//   network. This app's numbers must never be served from a cache.
const STATIC_CACHE = "bb-static-v2";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase & other cross-origin calls: untouched

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
