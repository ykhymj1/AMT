// AMT Service Worker
const CACHE = 'amt-v7';
const ASSETS = [
  '/AMT/',
  '/AMT/index.html',
  '/AMT/manifest.json',
  '/AMT/icon-192.png',
  '/AMT/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Firebase / Google Fonts 등 외부 요청은 네트워크 우선
  if (!e.request.url.startsWith(self.location.origin)) {
    return e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
  // 앱 자체 파일은 캐시 우선, 실패 시 네트워크
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
