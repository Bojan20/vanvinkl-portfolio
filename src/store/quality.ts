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

        const r = renderer.toLowerCase()
        const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

        let tier: 'low' | 'medium' | 'high' = 'medium'

        if (mobile) {
          // === MOBILE GPU TIERING ===
          // HIGH: Apple GPU A15+ (iPhone 13+), Adreno 7xx/8xx (Snapdragon 8 Gen1+)
          if (
            r.includes('apple gpu') ||           // All modern Apple (A12+, WebGL reports "Apple GPU")
            r.includes('apple a') ||              // Explicit Apple A-series
            r.includes('adreno (tm) 7') ||        // Snapdragon 8 Gen1/Gen2/Gen3
            r.includes('adreno (tm) 8') ||        // Snapdragon 8 Elite
            r.includes('mali-g7') ||              // ARM Mali G77/G78/G710 (flagship Android)
            r.includes('mali-g6') ||              // ARM Mali G68/G610 (upper-mid Android)
            r.includes('adreno (tm) 6')           // Adreno 6xx (Snapdragon 855-888, solid mid-range)
          ) {
            tier = 'high'
          }
          // LOW: Old/budget GPUs
          else if (
            r.includes('powervr') ||              // Old iOS / budget Android
            r.includes('adreno (tm) 5') ||        // Snapdragon 6xx/7xx (2017-2019)
            r.includes('adreno (tm) 4') ||        // Very old Qualcomm
            r.includes('adreno (tm) 3') ||        // Ancient Qualcomm
            r.includes('mali-g5') ||              // Mali G51/G52 (budget 2018-2020)
            r.includes('mali-t') ||               // Mali T-series (very old)
            r.includes('mali-4') ||               // Mali 400 (ancient)
            r.includes('sgx') ||                  // PowerVR SGX (ancient)
            r.includes('vivante') ||              // Budget SoC GPU
            r === ''                              // No renderer info = assume low
          ) {
            tier = 'low'
          }
          // MEDIUM: everything else (unknown but modern enough for WebGL2)
          // else tier stays 'medium'
        } else {
          // === DESKTOP GPU TIERING ===
          // High-end: discrete NVIDIA/AMD, Apple Silicon
          if (
            r.includes('nvidia') ||
            r.includes('radeon') ||
            r.includes('rtx') ||
            r.includes('geforce') ||
            r.includes('apple m')
          ) {
            tier = 'high'
          }
          // Low-end: integrated Intel
          else if (
            r.includes('intel hd') ||
            r.includes('intel uhd') ||
            r.includes('intel iris')
          ) {
            tier = 'low'
          }
        }

        console.log(`[Quality] Device tier: ${tier} | Mobile: ${mobile} | GPU: ${renderer}`)
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
  const store = useQualityStore.getState()

  // Detect GPU tier first — sets resolvedQuality based on actual hardware
  store.detectDeviceTier()

  const { deviceTier } = store
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  if (mobile) {
    // Mobile: lock to detected tier (no auto-upgrade to avoid frame drops)
    const mobileQuality = deviceTier === 'low' ? 'low' : deviceTier === 'high' ? 'medium' : 'medium'
    store.setPreset(mobileQuality)
    console.log(`[Quality] Mobile ${deviceTier} → quality: ${mobileQuality}`)
  } else if (store.preset === 'auto') {
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
