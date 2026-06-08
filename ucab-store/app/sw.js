/* Service Worker para UCAB Store
   - Cachea el shell de la app para uso offline.
   - Estrategia: cache-first para los assets, network-first para datos externos.
*/
const VERSION = 'ucab-store-v2';
const SHELL = [
  '/app/index.html',
  '/app/catalog.html',
  '/app/product.html',
  '/app/cart.html',
  '/app/checkout.html',
  '/app/login.html',
  '/app/register.html',
  '/app/profile.html',
  '/app/admin.html',
  '/app/404.html',
  '/app/css/styles.css',
  '/app/manifest.webmanifest',
  '/app/js/state.js',
  '/app/js/api.js',
  '/app/js/auth.js',
  '/app/js/ui.js',
  '/app/js/shell.js',
  '/app/js/pages/home.js',
  '/app/js/pages/catalog.js',
  '/app/js/pages/product.js',
  '/app/js/pages/cart.js',
  '/app/js/pages/checkout.js',
  '/app/js/pages/login.js',
  '/app/js/pages/register.js',
  '/app/js/pages/profile.js',
  '/app/js/pages/admin.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.hostname.includes('fakestoreapi.com')) {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  if (url.pathname.startsWith('/app/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        }).catch(() => caches.match('/app/index.html'));
      })
    );
  }
});
