// Gossip! Bookings — Service Worker
const CACHE_NAME = 'gossip-bookings-v2';
const BASE = '/gossipbookings/';
const ASSETS = [BASE, BASE + 'index.html', BASE + 'manifest.json', BASE + 'icon-192.png'];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Notification click — open app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(BASE);
    })
  );
});

// Message from app — schedule or cancel notification
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { booking, delay } = event.data;
    setTimeout(() => {
      self.registration.showNotification('Upcoming booking — Gossip! 🔔', {
        body: `${booking.name}  ·  ${booking.type}  ·  ${booking.fromTime}  ·  ${booking.guests} guests`,
        icon: BASE + 'icon-192.png',
        badge: BASE + 'icon-192.png',
        tag: `booking-${booking.id}`,
        renotify: false,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { bookingId: booking.id }
      });
    }, delay);
  }

  if (event.data.type === 'CANCEL_NOTIFICATION') {
    self.registration.getNotifications({ tag: `booking-${event.data.bookingId}` })
      .then(notifications => notifications.forEach(n => n.close()));
  }
});
