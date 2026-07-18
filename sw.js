// ============================================================
// SERVICE WORKER - N5 Sentence Builder PWA
// ============================================================

const CACHE_NAME = 'n5-sentence-builder-v1';

// Files to cache for offline use
const ASSETS_TO_CACHE = [
  // HTML
  '/',
  '/index.html',
  
  // Manifest
  '/manifest.json',
  
  // Icons
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  
  // JavaScript - Data
  '/js/data/sentences.js',
  '/js/data/wordDict.js',
  
  // JavaScript - Utils
  '/js/utils/furigana.js',
  '/js/utils/tooltips.js',
  
  // JavaScript - Modules
  '/js/modules/audio.js',
  '/js/modules/sentenceBuilder.js'
];

// ============================================================
// INSTALL EVENT - Cache all assets
// ============================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Assets cached successfully!');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

// ============================================================
// ACTIVATE EVENT - Clean up old caches
// ============================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Service Worker activated!');
      return self.clients.claim();
    })
  );
});

// ============================================================
// FETCH EVENT - Serve from cache, fallback to network
// ============================================================

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip requests that aren't from our domain
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          // Check if it's a navigational request (HTML)
          if (event.request.mode === 'navigate') {
            // For HTML, we want to check for updates
            return fetch(event.request)
              .then((networkResponse) => {
                // Update cache with fresh response
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                  });
                return networkResponse;
              })
              .catch(() => {
                // If network fails, return cached
                return cachedResponse;
              });
          }
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache the response for future
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            // Return a fallback response for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// ============================================================
// MESSAGE EVENT - Handle messages from the app
// ============================================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');