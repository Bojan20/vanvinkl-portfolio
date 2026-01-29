import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerServiceWorker, setupInstallPrompt } from './pwa'

// Register PWA service worker (production only)
if (import.meta.env.PROD) {
  registerServiceWorker()
  setupInstallPrompt()
}

createRoot(document.getElementById('root')!).render(<App />)
