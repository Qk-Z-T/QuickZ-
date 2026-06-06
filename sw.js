// sw.js - Service Worker for QuickZ
const CACHE_NAME = 'quickz-v3';

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
  
  // 🔥 Firestore রিকোয়েস্ট সম্পূর্ণ বাইপাস করুন
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebaseauth.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com')) {
    return; // নেটওয়ার্কে যেতে দিন
  }
  
  // শুধু আমাদের ডোমেইনের রিকোয়েস্ট হ্যান্ডেল করুন
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
