// Business Board service worker.
//
// Strategy:
//  - Page navigations: network-first. A successful response is cached per
//    URL, so the *last data the user saw* stays available offline. If the
//    network fails and there's no cached copy of that exact page, we fall
//    back to a generic /offline page instead of the browser's dinosaur.
//  - Static build assets (_next/static, icons): cache-first with a
//    background refresh, since they're immutable/hashed by Next.js.
//  - Everything else (API calls, Server Action POSTs, data mutations):
//    network only. We never want stale sales/stock figures served from a
//    cache, and mutations can't be replayed from here.
const VERSION = "v2";
const STATIC_CACHE = `bb-static-${VERSION}`;
const PAGES_CACHE = `bb-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Let pages ask the SW to drop cached HTML (e.g. on sign-out) so the next
// person to use this device/browser never sees a previous user's data
// while offline.
self.addEventListener("message", (event) => {
  if (event.data === "CLEAR_PAGES_CACHE") {
    event.waitUntil(caches.delete(PAGES_CACHE));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never intercept mutations

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
