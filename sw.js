// sw.js
// Service Worker – offline caching & sync

importScripts('assets.js');

const CACHE_STATIC = 'quickz-static-v5';
const CACHE_DYNAMIC = 'quickz-dynamic-v5';
const CACHE_API = 'quickz-api-v1';
const OFFLINE_PAGE = '/offline.html';

// Install: pre‑cache all static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('📦 Pre-caching static assets');
        return cache.addAll(self.STATIC_ASSETS);
      })
      .catch(err => console.warn('Pre-cache failed:', err))
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_STATIC && key !== CACHE_DYNAMIC && key !== CACHE_API)
          .map(key => caches.delete(key))
    ))
  );
  return self.clients.claim();
});

// Fetch: network-first for API, cache-first for static, navigate fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return; // ignore POST/PUT

  // API calls → network first, cache fallback
  if (url.pathname.includes('/api/') || url.hostname.includes('firebaseio') || url.hostname.includes('firestore')) {
    event.respondWith(networkFirstWithCache(event.request, CACHE_API));
    return;
  }

  // Navigation requests (HTML) → network with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE_DYNAMIC).then(cache => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // Other static assets → cache first, network update
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const cloned = networkResponse.clone();
              caches.open(CACHE_STATIC).then(cache => cache.put(event.request, cloned));
            }
            return networkResponse;
          })
          .catch(() => {});
        return cached || fetchPromise;
      })
  );
});

// Helper: network first, then cache
function networkFirstWithCache(request, cacheName) {
  return fetch(request)
    .then(response => {
      if (!response || response.status !== 200) return response;
      const cloned = response.clone();
      caches.open(cacheName).then(cache => cache.put(request, cloned));
      return response;
    })
    .catch(() => caches.match(request));
}
