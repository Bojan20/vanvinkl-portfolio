/**
 * Quality Settings Store - Adaptive Performance System
 *
 * Auto-detects device capabilities and adjusts visual quality
 * to maintain 60fps target.
 *
 * Quality Tiers:
 * - LOW: Essential effects only (SSAO, Bloom, Vignette)
 * - MEDIUM: + Chromatic Aberration, Noise
 * - HIGH: + God Rays
 * - ULTRA: + DOF, Lens Flare
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra' | 'auto'

interface QualityState {
  // Current quality setting
  preset: QualityPreset

  // Resolved quality (when preset is 'auto')
  resolvedQuality: Exclude<QualityPreset, 'auto'>

  // Current FPS measurement
  currentFPS: number

  // Average FPS over last 60 frames
  averageFPS: number

  // Performance tier auto-detected
  deviceTier: 'low' | 'medium' | 'high'

  // Actions
  setPreset: (preset: QualityPreset) => void
  updateFPS: (fps: number) => void
  autoAdjustQuality: () => void
  detectDeviceTier: () => void
}

// FPS thresholds for auto-adjustment (mobile-aware: tighter thresholds)
const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const FPS_THRESHOLDS = {
  downgrade: isMobile ? 45 : 35,  // Mobile: react faster to drops
  upgrade: isMobile ? 55 : 50,    // Mobile: require higher sustained FPS before upgrading
  stable: isMobile ? 50 : 45      // Mobile: higher stability bar
}

// FPS history za averaging (ring buffer)
const fpsHistory: number[] = []
const FPS_HISTORY_SIZE = 60 // Average over 1 second at 60fps

function calculateAverageFPS(): number {
  if (fpsHistory.length === 0) return 60
  const sum = fpsHistory.reduce((a, b) => a + b, 0)
  return sum / fpsHistory.length
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set, get) => ({
      preset: 'auto',
      resolvedQuality: 'medium', // Default fallback
      currentFPS: 60,
      averageFPS: 60,
      deviceTier: 'medium',

      setPreset: (preset: QualityPreset) => {
        set({ preset })

        // If manual preset (not auto), resolve immediately
        if (preset !== 'auto') {
          set({ resolvedQuality: preset as Exclude<QualityPreset, 'auto'> })
        } else {
          // Auto mode - trigger re-detection
          get().autoAdjustQuality()
        }
      },

      updateFPS: (fps: number) => {
        // Add to history
        fpsHistory.push(fps)
        if (fpsHistory.length > FPS_HISTORY_SIZE) {
          fpsHistory.shift() // Remove oldest
        }

        const avgFPS = calculateAverageFPS()

        set({
          currentFPS: fps,
          averageFPS: avgFPS
        })

        // Auto-adjust if in auto mode
        if (get().preset === 'auto') {
          get().autoAdjustQuality()
        }
      },

      autoAdjustQuality: () => {
        const { averageFPS, resolvedQuality } = get()

        let newQuality = resolvedQuality

        // Downgrade logic (aggressive - maintain 60fps)
        if (averageFPS < FPS_THRESHOLDS.downgrade) {
          if (resolvedQuality === 'ultra') newQuality = 'high'
          else if (resolvedQuality === 'high') newQuality = 'medium'
          else if (resolvedQuality === 'medium') newQuality = 'low'
          // Stay on low if already there
        }

        // Upgrade logic (conservative - verify stability first)
        else if (averageFPS > FPS_THRESHOLDS.upgrade) {
          // Only upgrade if stable (60 frames of good performance)
          if (fpsHistory.length >= FPS_HISTORY_SIZE) {
            const allGood = fpsHistory.every(f => f > FPS_THRESHOLDS.stable)
            if (allGood) {
              if (resolvedQuality === 'low') newQuality = 'medium'
              else if (resolvedQuality === 'medium') newQuality = 'high'
              else if (resolvedQuality === 'high') newQuality = 'ultra'
              // Stay on ultra if already there
            }
          }
        }

        // Update if changed
        if (newQuality !== resolvedQuality) {
          console.log(`[Quality] Auto-adjust: ${resolvedQuality} → ${newQuality} (FPS: ${averageFPS.toFixed(1)})`)
          set({ resolvedQuality: newQuality })
        }
      },

      detectDeviceTier: () => {
        // Detect device capabilities
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

        if (!gl) {
          set({ deviceTier: 'low' })
          return
        }

        // Check GPU vendor/renderer
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        const renderer = debugInfo
          ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          : ''

        // CRITICAL: Release test context to avoid "Too many active WebGL contexts"
        const loseExt = gl.getExtension('WEBGL_lose_context')
        loseExt?.loseContext()

        // Heuristic device tier detection
        let tier: 'low' | 'medium' | 'high' = 'medium'

        const r = renderer.toLowerCase()

        // High-end GPUs
        if (
          r.includes('nvidia') ||
          r.includes('radeon') ||
          r.includes('rtx') ||
          r.includes('geforce') ||
          r.includes('apple m') // Catches M1, M2, M3, M4, M5+
        ) {
          tier = 'high'
        }

        // Low-end indicators (integrated graphics)
        else if (
          r.includes('intel hd') ||
          r.includes('intel uhd') ||
          r.includes('intel iris') ||
          r.includes('powervr') ||
          r.includes('adreno 5') || // Older Qualcomm
          r.includes('mali-g5') ||   // Older ARM
          /iPhone|iPad|Android/i.test(navigator.userAgent)
        ) {
          tier = 'low'
        }

        console.log(`[Quality] Device tier detected: ${tier} (GPU: ${renderer})`)
        set({ deviceTier: tier })

        // Set initial quality based on tier
        const initialQuality = tier === 'low' ? 'low' : tier === 'high' ? 'high' : 'medium'
        set({ resolvedQuality: initialQuality })
      }
    }),
    {
      name: 'vanvinkl-quality', // localStorage key
      partialize: (state) => ({
        // Only persist user preference, not runtime state
        preset: state.preset
      })
    }
  )
)

/**
 * Initialize quality system
 * Call this once on app mount
 */
export function initQualitySystem(): void {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const store = useQualityStore.getState()

  store.detectDeviceTier()

  // MOBILE OPTIMIZATION: Pre-set LOW quality to avoid initial frame drops
  if (isMobile) {
    store.setPreset('low')
    console.log('[Quality] Mobile detected - forced LOW quality for instant 60fps')
  } else if (store.preset === 'auto') {
    // Desktop remains AUTO (adapts based on FPS)
    console.log('[Quality] Desktop detected - using AUTO quality')
  }
}

/**
 * Get effective quality setting (resolves 'auto')
 */
export function getEffectiveQuality(): Exclude<QualityPreset, 'auto'> {
  const state = useQualityStore.getState()
  return state.preset === 'auto' ? state.resolvedQuality : state.preset as Exclude<QualityPreset, 'auto'>
}
