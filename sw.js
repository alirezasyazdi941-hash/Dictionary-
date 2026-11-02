// Ali English - Service Worker (GitHub Pages friendly: all paths are relative to the SW scope)
const CACHE_NAME = 'ali-english-v2';
const SCOPE = self.registration.scope;
const PRECACHE = ['./', 'index.html', 'manifest.json', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(PRECACHE.map((u) => cache.add(new Request(new URL(u, SCOPE).href, { cache: 'reload' })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only handle same-origin; never touch third-party API calls (e.g. Gemini)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match(new URL('index.html', SCOPE).href) : undefined))
      )
  );
});
