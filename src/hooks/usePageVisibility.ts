/**
 * usePageVisibility - LIFECYCLE POLICY §6 Implementation
 *
 * Handles tab visibility changes:
 * - Tab hidden → SUSPEND: pause audio, stop FPS monitoring
 * - Tab visible → RESUME: resume audio, restart FPS monitoring
 *
 * This prevents:
 * - Audio playing in background (battery drain)
 * - GPU rendering invisible scene (wasted power)
 * - FPS monitoring running unnecessarily
 */

import { useEffect, useRef } from 'react'
import { uaSuspend, uaResume } from '../audio'

interface UsePageVisibilityOptions {
  /** Called when page becomes hidden */
  onHidden?: () => void
  /** Called when page becomes visible */
  onVisible?: () => void
}

export function usePageVisibility(options?: UsePageVisibilityOptions) {
  const wasHiddenRef = useRef(false)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // SUSPENDED state — pause everything
        wasHiddenRef.current = true
        uaSuspend()
        options?.onHidden?.()
        console.log('[Lifecycle] Tab hidden → SUSPENDED')
      } else if (wasHiddenRef.current) {
        // RESUME — only if we were previously hidden
        wasHiddenRef.current = false
        uaResume()
        options?.onVisible?.()
        console.log('[Lifecycle] Tab visible → RESUMED')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [options])
}
