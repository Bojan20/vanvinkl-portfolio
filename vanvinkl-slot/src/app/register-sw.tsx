'use client'

import { useEffect } from 'react'

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope)

            // Check for updates every hour
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000)

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('New content available, refresh to update.')

                    // Auto-update after 5 seconds
                    setTimeout(() => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' })
                      window.location.reload()
                    }, 5000)
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error)
          })

        // Handle controller change (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      })
    }
  }, [])

  return null
}
