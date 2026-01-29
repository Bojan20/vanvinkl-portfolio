/**
 * Service Worker - VanVinkl Casino PWA
 *
 * Caching Strategy:
 * - Static assets: Cache-first (fast loading)
 * - API/dynamic: Network-first (fresh data)
 * - Offline fallback: Show cached content
 */

const CACHE_NAME = 'vanvinkl-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg'
]

// Install: Pre-cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        // Activate immediately (skip waiting)
        return self.skipWaiting()
      })
  )
})

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim()
      })
  )
})

// Fetch: Cache-first for assets, network-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Static assets (JS, CSS, images, fonts): Cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // HTML/navigation: Network-first with cache fallback
  if (request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(networkFirst(request))
    return
  }

  // Everything else: Network-first
  event.respondWith(networkFirst(request))
})

/**
 * Check if pathname is a static asset
 */
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.glb') ||
    pathname.endsWith('.gltf')
  )
}

/**
 * Cache-first strategy
 * Try cache, fallback to network (and cache response)
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn('[SW] Network request failed:', request.url)
    // Return offline fallback if available
    return caches.match('/offline.html') || new Response('Offline', { status: 503 })
  }
}

/**
 * Network-first strategy
 * Try network, fallback to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    // Cache successful navigation responses
    if (networkResponse.ok && request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', request.url)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    // Return cached index for navigation failures
    if (request.mode === 'navigate') {
      return caches.match('/') || caches.match('/index.html')
    }
    return new Response('Offline', { status: 503 })
  }
}
