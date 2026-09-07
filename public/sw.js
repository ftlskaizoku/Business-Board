// Minimal service worker. Its only job is to satisfy PWA installability
// requirements (Chrome/Android requires a registered service worker with a
// fetch handler). It intentionally does not cache app data, since this app
// is dynamic and per-business — we don't want stale sales/stock figures
// served from a cache.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through: always hit the network, no offline caching of data.
  event.respondWith(fetch(event.request));
});
