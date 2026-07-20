// MoneyMate PWA Service Worker
const CACHE = 'moneymate-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: precache core assets ──────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for static, network-first for API ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls — network first, no cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
