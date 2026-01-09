const CACHE_NAME = 'vanvinkl-casino-v1';
const RUNTIME = 'runtime';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/3d',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          // Still fetch in background to update cache
          event.waitUntil(
            fetch(event.request).then((response) => {
              return caches.open(RUNTIME).then((cache) => {
                cache.put(event.request, response.clone());
                return response;
              });
            }).catch(() => {
              // Network error, stick with cached version
            })
          );

          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            return caches.open(RUNTIME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          }
          return response;
        }).catch(() => {
          // Network error and not in cache
          // Could return offline page here
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
  }
});

// Message event - for communication with clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
