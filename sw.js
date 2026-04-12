// AMT 매출관리 Service Worker v28
const CACHE = 'amt-v28';
const ASSETS = [
  '/AMT/',
  '/AMT/index.html',
  '/AMT/manifest.json',
  '/AMT/icon-192.png',
  '/AMT/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Firebase / Telegram / Google Fonts 등 외부 요청 → 네트워크 우선
  if (!e.request.url.startsWith(self.location.origin)) {
    return e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
  // 앱 자체 파일 → 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'error') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});

// Push 알림 수신 (KY 주문 / OTP 알림 등)
self.addEventListener('push', e => {
  let data = { title: 'AMT 알림', body: '새 알림이 있습니다.' };
  try { data = e.data.json(); } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'AMT 알림', {
      body: data.body || '',
      icon: '/AMT/icon-192.png',
      badge: '/AMT/icon-192.png',
      tag: data.tag || 'amt-notif',
      requireInteraction: false,
      data: data
    })
  );
});

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('/AMT/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/AMT/');
    })
  );
});
