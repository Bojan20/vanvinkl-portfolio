/**
 * AAA Rendering Configuration
 *
 * Defines quality presets for optimal performance/quality balance
 * User can switch between modes without code changes
 */

export type RenderQuality = 'ultra' | 'high' | 'performance'

export interface RenderingConfig {
  // Post-processing
  enableSSAO: boolean
  enableDOF: boolean
  bloomIntensity: number
  bloomThreshold: number

  // Lighting
  enableVolumetricLighting: boolean
  enableDynamicLights: boolean
  shadowMapSize: number

  // Reflections
  reflectorResolution: number
  reflectorMixStrength: number

  // Particles
  maxParticles: number

  // General
  pixelRatio: [number, number]
  antialias: boolean
}

/**
 * ULTRA MODE — Maximum visual fidelity
 * Target: High-end desktop (RTX 3060+)
 */
export const ULTRA_PRESET: RenderingConfig = {
  // Post-processing
  enableSSAO: true,
  enableDOF: false, // Disabled by default (can enable for cinematic)
  bloomIntensity: 1.2,
  bloomThreshold: 0.85,

  // Lighting
  enableVolumetricLighting: true,
  enableDynamicLights: true,
  shadowMapSize: 2048,

  // Reflections
  reflectorResolution: 1024, // Higher res reflections
  reflectorMixStrength: 50,

  // Particles
  maxParticles: 500,

  // General
  pixelRatio: [1, 2], // Support high DPI displays
  antialias: true
}

/**
 * HIGH MODE — Balanced quality/performance
 * Target: Mid-range desktop, high-end laptops (GTX 1660+)
 */
export const HIGH_PRESET: RenderingConfig = {
  // Post-processing
  enableSSAO: true,
  enableDOF: false,
  bloomIntensity: 1.0,
  bloomThreshold: 0.9,

  // Lighting
  enableVolumetricLighting: true,
  enableDynamicLights: true,
  shadowMapSize: 1024,

  // Reflections
  reflectorResolution: 512,
  reflectorMixStrength: 40,

  // Particles
  maxParticles: 300,

  // General
  pixelRatio: [1, 1.5],
  antialias: false // Disabled for performance
}

/**
 * PERFORMANCE MODE — Maximum FPS
 * Target: Laptops, integrated GPUs
 */
export const PERFORMANCE_PRESET: RenderingConfig = {
  // Post-processing
  enableSSAO: false, // Disabled (expensive)
  enableDOF: false,
  bloomIntensity: 0.8,
  bloomThreshold: 0.95,

  // Lighting
  enableVolumetricLighting: false, // Disabled (shader cost)
  enableDynamicLights: false, // Use static only
  shadowMapSize: 512,

  // Reflections
  reflectorResolution: 256,
  reflectorMixStrength: 30,

  // Particles
  maxParticles: 150,

  // General
  pixelRatio: [1, 1],
  antialias: false
}

/**
 * Get rendering config based on quality setting
 */
export function getRenderingConfig(quality: RenderQuality = 'ultra'): RenderingConfig {
  switch (quality) {
    case 'ultra':
      return ULTRA_PRESET
    case 'high':
      return HIGH_PRESET
    case 'performance':
      return PERFORMANCE_PRESET
    default:
      return HIGH_PRESET
  }
}

/**
 * Auto-detect optimal quality based on device
 */
export function detectOptimalQuality(): RenderQuality {
  if (typeof window === 'undefined') return 'high'

  // Check for high-end GPU indicators
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

  if (!gl) return 'performance'

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)

    // High-end GPUs
    if (
      renderer.includes('RTX') ||
      renderer.includes('RX 6') ||
      renderer.includes('RX 7') ||
      renderer.includes('M1 Max') ||
      renderer.includes('M2 Max') ||
      renderer.includes('M3')
    ) {
      return 'ultra'
    }

    // Mid-range GPUs
    if (
      renderer.includes('GTX 1') ||
      renderer.includes('GTX 2') ||
      renderer.includes('RX 5') ||
      renderer.includes('M1') ||
      renderer.includes('M2')
    ) {
      return 'high'
    }
  }

  // Check device memory (8GB+ = high, 4GB- = performance)
  const memory = (navigator as any).deviceMemory
  if (memory >= 8) return 'high'
  if (memory <= 4) return 'performance'

  // Default to high for unknown devices
  return 'high'
}

/**
 * Runtime quality adjustment based on FPS
 */
export class AdaptiveQualityManager {
  private fpsHistory: number[] = []
  private readonly historySize = 60 // 1 second at 60fps
  private currentQuality: RenderQuality = 'ultra'

  constructor(initialQuality: RenderQuality = 'ultra') {
    this.currentQuality = initialQuality
  }

  /**
   * Update FPS measurement
   */
  updateFPS(fps: number) {
    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift()
    }
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return sum / this.fpsHistory.length
  }

  /**
   * Adjust quality based on performance
   * Returns true if quality changed
   */
  adjustQuality(): { quality: RenderQuality; changed: boolean } {
    const avgFPS = this.getAverageFPS()
    const previousQuality = this.currentQuality

    // Downgrade if FPS drops below 45
    if (avgFPS < 45) {
      if (this.currentQuality === 'ultra') {
        this.currentQuality = 'high'
      } else if (this.currentQuality === 'high') {
        this.currentQuality = 'performance'
      }
    }

    // Upgrade if FPS consistently above 55
    if (avgFPS > 55) {
      if (this.currentQuality === 'performance') {
        this.currentQuality = 'high'
      } else if (this.currentQuality === 'high') {
        this.currentQuality = 'ultra'
      }
    }

    return {
      quality: this.currentQuality,
      changed: previousQuality !== this.currentQuality
    }
  }

  /**
   * Force set quality
   */
  setQuality(quality: RenderQuality) {
    this.currentQuality = quality
  }

  /**
   * Get current quality
   */
  getQuality(): RenderQuality {
    return this.currentQuality
  }
}
