const CACHE = 'hocvienmagic-offline-v1';
const SAME_ORIGIN = [
  './hocvienmagic_fixed.html',
  './'
];
const EXTERNAL = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js',
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=JetBrains+Mono:wght@500;700;800&display=swap'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(SAME_ORIGIN.map(url => cache.add(url)));
    await Promise.allSettled(EXTERNAL.map(url => cache.add(new Request(url, { mode: 'no-cors' }))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreVary: true });
    try {
      const fresh = await fetch(req);
      // Cache static app shell and CDN libraries/fonts; Firebase data requests stay network-only.
      const isStatic = url.origin === location.origin || /cdn\.tailwindcss\.com|cdn\.jsdelivr\.net|gstatic\.com\/firebase|fonts\.googleapis\.com/.test(url.host + url.pathname);
      if (isStatic) cache.put(req, fresh.clone()).catch(() => {});
      return fresh;
    } catch (e) {
      return cached || new Response('', { status: 504, statusText: 'Offline and resource not cached' });
    }
  })());
});
