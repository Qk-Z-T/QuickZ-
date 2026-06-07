// sw.js - Service Worker
const CACHE_NAME = 'quickz-v3';

// ইনস্টল ইভেন্ট - শুধু ক্যাশ ওপেন করুন
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// অ্যাক্টিভেট ইভেন্ট - পুরনো ক্যাশ পরিষ্কার করুন
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// ফেচ ইভেন্ট - ফায়ারস্টোর রিকোয়েস্ট সম্পূর্ণ বাইপাস
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // ফায়ারস্টোর/অথ রিকোয়েস্ট বাইপাস (কোনো ইন্টারসেপ্ট না)
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebaseauth.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com')) {
    return; // ডিফল্ট নেটওয়ার্ক আচরণ
  }
  
  // শুধু আমাদের ডোমেইনের রিকোয়েস্ট হ্যান্ডেল করুন
  if (!url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
      return new Response('Offline', { status: 503 });
    })
  );
});
