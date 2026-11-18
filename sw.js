// Guarda la app en el teléfono para que abra sin internet.
// Al publicar una versión nueva, cambiar el número de CACHE.
const CACHE = 'mi-glucosa-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Responde desde la copia guardada y la actualiza en segundo plano.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
      return res;
    }).catch(() => null);
    if (cached) return cached;
    const res = await net;
    if (res) return res;
    if (e.request.mode === 'navigate') return cache.match('./index.html');
    return Response.error();
  }));
});
