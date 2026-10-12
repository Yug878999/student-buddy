// Student Buddy service worker: makes the app installable and lets the screens open offline.
// Chat and other API calls always go to the network, so answers are never stale.
const CACHE = "sb-v3";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const api = /^\/(chat|api|events|clubs|share-info|qr\.png|health|ticket|admin)/.test(url.pathname);
  if (api) return; // never cache live data
  // pages and files: try the network first, fall back to the saved copy when offline
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("/") : Response.error())))
  );
});
