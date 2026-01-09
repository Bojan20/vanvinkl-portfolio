/**
 * Haptic Feedback Utility
 * Provides tactile feedback for mobile interactions
 */

export type HapticPattern =
  | 'light'      // Subtle tap (5ms)
  | 'medium'     // Standard click (20ms)
  | 'heavy'      // Strong impact (40ms)
  | 'success'    // Victory pattern [10,30,10,30]
  | 'error'      // Warning pattern [20,20,20]
  | 'selection'  // Quick tick (5ms)
  | 'spin'       // Slot machine spin [40,20,10,10,10]
  | 'win'        // Jackpot celebration [20,10,20,10,40,10,20]

const patterns: Record<HapticPattern, number | number[]> = {
  light: 5,
  medium: 20,
  heavy: 40,
  success: [10, 30, 10, 30],
  error: [20, 20, 20],
  selection: 5,
  spin: [40, 20, 10, 10, 10],
  win: [20, 10, 20, 10, 40, 10, 20]
}

/**
 * Trigger haptic feedback
 * @param pattern - Haptic pattern type
 */
export function triggerHaptic(pattern: HapticPattern = 'medium'): void {
  if (typeof window === 'undefined') return

  // Check if device supports vibration
  if (!('vibrate' in navigator)) {
    console.log('[Haptics] Vibration API not supported')
    return
  }

  const vibrationPattern = patterns[pattern]

  try {
    navigator.vibrate(vibrationPattern)
  } catch (error) {
    console.warn('[Haptics] Vibration failed:', error)
  }
}

/**
 * Check if haptic feedback is available
 */
export function isHapticSupported(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator
}

/**
 * Haptic feedback for button press
 */
export function hapticButtonPress(): void {
  triggerHaptic('medium')
}

/**
 * Haptic feedback for hover/selection
 */
export function hapticHover(): void {
  triggerHaptic('light')
}

/**
 * Haptic feedback for success action
 */
export function hapticSuccess(): void {
  triggerHaptic('success')
}

/**
 * Haptic feedback for error/warning
 */
export function hapticError(): void {
  triggerHaptic('error')
}

/**
 * Haptic feedback for slot machine spin
 */
export function hapticSlotSpin(): void {
  triggerHaptic('spin')
}

/**
 * Haptic feedback for slot machine win
 */
export function hapticSlotWin(): void {
  triggerHaptic('win')
}
