// Gossip! Bookings — Service Worker v3
// Handles Firebase Cloud Messaging background notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE_NAME = 'gossip-bookings-v3';
const BASE = '/gossipbookings/';

// ── Firebase config (same as index.html) ──────────────────
firebase.initializeApp({
  apiKey:            "AIzaSyAITydT4tYzjOyP3m995_WHh188omR8drU",
  authDomain:        "gossipbookings.firebaseapp.com",
  projectId:         "gossipbookings",
  storageBucket:     "gossipbookings.firebasestorage.app",
  messagingSenderId: "612011316352",
  appId:             "1:612011316352:web:50cf6f27fc36101a5f8265"
});

const fcmMessaging = firebase.messaging();

// ── Handle background FCM messages ────────────────────────
fcmMessaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Gossip! Bookings', {
    body: body || '',
    icon: BASE + 'icon-192.png',
    badge: BASE + 'icon-192.png',
    tag: payload.data?.bookingId || 'gossip-notif',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: 'https://tarunjain26.github.io/gossipbookings/' }
  });
});

// ── Install ────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Notification click: open app ───────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || BASE;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
