// Gossip! Bookings — Service Worker
// Handles background push notifications and offline caching

const CACHE_NAME = 'gossip-bookings-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// ── Install: cache core files ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache when offline ───────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── Notification click: open app ───────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// ── Message: schedule a notification ──────────────────────
// The main app sends { type: 'SCHEDULE', booking: {...} } messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { booking, delay } = event.data;
    setTimeout(() => {
      self.registration.showNotification('Upcoming booking — Gossip!', {
        body: `${booking.name} · ${booking.type} at ${booking.fromTime} (${booking.guests} guests · ${booking.event})`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `booking-${booking.id}`,
        renotify: false,
        requireInteraction: true,
        data: { bookingId: booking.id }
      });
    }, delay);
  }

  if (event.data && event.data.type === 'CANCEL_NOTIFICATION') {
    self.registration.getNotifications({ tag: `booking-${event.data.bookingId}` })
      .then(notifications => notifications.forEach(n => n.close()));
  }
});
