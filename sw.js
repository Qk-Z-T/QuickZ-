// sw.js - Service Worker for QuickZ
// This file should be placed in the root directory

const CACHE_NAME = 'quickz-v3';

// Import static assets from assets.js
importScripts('./assets.js');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(self.STATIC_ASSETS || []);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip Firestore requests completely - don't intercept them
  if (url.includes('firestore.googleapis.com')) {
    // Just pass through to network
    return;
  }
  
  // Skip Firebase Auth requests
  if (url.includes('firebaseauth.googleapis.com')) {
    return;
  }
  
  // Skip Firebase Auth requests
  if (url.includes('identitytoolkit.googleapis.com')) {
    return;
  }
  
  // Only handle same-origin requests
  if (!url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
