/**
 * Service Worker - VanVinkl Casino PWA
 *
 * CLEAN SLATE: Unregisters old broken SW, purges all caches.
 * Media files (mp4, opus, m4a, etc.) are NEVER cached by SW —
 * Cache API cannot store 206 Partial Content responses from range requests.
 *
 * After this version activates and cleans up, it does NOTHING —
 * all requests go straight to network (HTTP cache handles caching via vercel.json).
 */

const CACHE_NAME = 'vanvinkl-v4'

// Install: skip waiting immediately — take over from old SW ASAP
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate: nuke ALL caches from every previous SW version, then claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
      .then(() => console.log('[SW v4] Activated — all old caches purged'))
  )
})

// Fetch: NO interception — let browser handle everything natively
// This is intentionally a no-op. HTTP cache (vercel.json) handles all caching.
// Previously, caching .mp4/.opus/.m4a files caused TypeError on 206 responses.
