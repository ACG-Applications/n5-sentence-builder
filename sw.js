// sw.js - Service Worker for N5 Sentence Builder
const CACHE_NAME = 'n5-sentence-builder-v1';
const urlsToCache = [
  '/n5-sentence-builder/',
  '/n5-sentence-builder/index.html',
  '/n5-sentence-builder/manifest.json',
  // Add paths to your JS files
  '/n5-sentence-builder/js/data/sentences.js',
  '/n5-sentence-builder/js/data/wordDict.js',
  '/n5-sentence-builder/js/utils/furigana.js',
  '/n5-sentence-builder/js/modules/audio.js',
  '/n5-sentence-builder/js/managers/masteryManager.js',
  '/n5-sentence-builder/js/modules/sentenceBuilder.js',
  // Add icons
  '/n5-sentence-builder/icons/icon-192x192.png',
  '/n5-sentence-builder/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});