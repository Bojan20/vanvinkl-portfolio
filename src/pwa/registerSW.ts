/**
 * Service Worker Registration + Install Prompt
 *
 * Registers SW and handles PWA install prompt.
 */

// Store the deferred install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Register service worker
 * Call this once on app mount
 */
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always fetch sw.js from network, never from HTTP/SW cache
    })

    console.log('[PWA] Service worker registered:', registration.scope)

    // Force immediate update check
    registration.update().catch(() => {})

    // When new SW installs, reload to activate it immediately
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version installed — reloading to activate')
            window.location.reload()
          }
        })
      }
    })
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error)
  }
}

/**
 * Listen for install prompt
 * Called automatically when app is installable
 */
export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser mini-infobar
    e.preventDefault()

    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent

    console.log('[PWA] Install prompt available')

    // Dispatch custom event for UI to show install button
    window.dispatchEvent(new CustomEvent('pwa-installable'))
  })

  // Track when app was installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully!')
    deferredPrompt = null

    // Dispatch custom event for analytics/UI
    window.dispatchEvent(new CustomEvent('pwa-installed'))
  })
}

/**
 * Show the install prompt
 * Call this when user clicks "Install" button
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available')
    return false
  }

  // Show the prompt
  await deferredPrompt.prompt()

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice

  console.log('[PWA] Install prompt outcome:', outcome)

  // Clear the deferred prompt
  deferredPrompt = null

  return outcome === 'accepted'
}

/**
 * Check if app is installed (standalone mode)
 */
export function isAppInstalled(): boolean {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // iOS Safari standalone check
  if ('standalone' in navigator && (navigator as any).standalone) {
    return true
  }

  return false
}

/**
 * Check if install prompt is available
 */
export function canInstall(): boolean {
  return deferredPrompt !== null
}
