'use client'

import { useCallback } from 'react'
import { triggerHaptic, HapticPattern, isHapticSupported } from '@/utils/haptics'

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  const haptic = useCallback((pattern: HapticPattern = 'medium') => {
    triggerHaptic(pattern)
  }, [])

  const isSupported = useCallback(() => {
    return isHapticSupported()
  }, [])

  return {
    haptic,
    isSupported
  }
}
