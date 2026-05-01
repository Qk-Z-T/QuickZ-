// assets.js
const STATIC_ASSETS = [
  // Root level
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/src/shared/styles/global.css',
  '/src/shared/styles/animations.css',
  '/src/landing/main.js',
  // '/src/shared/services/db.service.js',   // not needed as direct script load, modules handle it

  // Student portal
  '/student/',
  '/student/index.html',
  // (keep actual files you have; remove any that don't exist)
];

self.STATIC_ASSETS = STATIC_ASSETS;
