/**
 * Performance Monitoring Utilities
 *
 * Provides FPS measurement, memory tracking, and performance profiling
 * for adaptive quality system.
 */

/**
 * FPS Monitor - Measures frames per second
 *
 * Usage:
 * ```typescript
 * const monitor = new FPSMonitor()
 * monitor.start()
 * // ... game loop
 * const fps = monitor.getFPS()
 * monitor.stop()
 * ```
 */
export class FPSMonitor {
  private frames: number[] = []
  private lastTime = 0
  private rafId: number | null = null
  private running = false

  /**
   * Start monitoring FPS
   */
  start(): void {
    if (this.running) return

    this.running = true
    this.lastTime = performance.now()
    this.frames = []

    const measure = (currentTime: number) => {
      if (!this.running) return

      // Calculate frame time
      const deltaTime = currentTime - this.lastTime
      this.lastTime = currentTime

      // Convert to FPS
      const fps = deltaTime > 0 ? 1000 / deltaTime : 60
      this.frames.push(fps)

      // Keep only last 60 frames (1 second at 60fps)
      if (this.frames.length > 60) {
        this.frames.shift()
      }

      this.rafId = requestAnimationFrame(measure)
    }

    this.rafId = requestAnimationFrame(measure)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * Get current FPS (average over last 60 frames)
   */
  getFPS(): number {
    if (this.frames.length === 0) return 60

    const sum = this.frames.reduce((a, b) => a + b, 0)
    return sum / this.frames.length
  }

  /**
   * Get min/max FPS from history
   */
  getStats(): { min: number; max: number; avg: number } {
    if (this.frames.length === 0) {
      return { min: 60, max: 60, avg: 60 }
    }

    const min = Math.min(...this.frames)
    const max = Math.max(...this.frames)
    const avg = this.getFPS()

    return { min, max, avg }
  }

  /**
   * Clear history
   */
  reset(): void {
    this.frames = []
  }
}

/**
 * React Hook for FPS monitoring
 *
 * Usage:
 * ```typescript
 * const fps = useFPSMonitor()
 * console.log('Current FPS:', fps)
 * ```
 */
export function useFPSMonitor(): number {
  const [fps, setFPS] = React.useState(60)

  React.useEffect(() => {
    const monitor = new FPSMonitor()
    monitor.start()

    // Update FPS every 500ms (not every frame - reduces overhead)
    const interval = setInterval(() => {
      setFPS(monitor.getFPS())
    }, 500)

    return () => {
      clearInterval(interval)
      monitor.stop()
    }
  }, [])

  return fps
}

/**
 * Memory Monitor - Tracks JS heap size (Chrome only)
 *
 * Usage:
 * ```typescript
 * const mem = getMemoryUsage()
 * console.log('Memory:', mem.usedMB, 'MB')
 * ```
 */
export interface MemoryStats {
  usedMB: number
  totalMB: number
  limitMB: number
  usagePercent: number
}

export function getMemoryUsage(): MemoryStats | null {
  // Only available in Chrome with --enable-precise-memory-info flag
  if ('memory' in performance) {
    const mem = (performance as any).memory
    return {
      usedMB: mem.usedJSHeapSize / 1024 / 1024,
      totalMB: mem.totalJSHeapSize / 1024 / 1024,
      limitMB: mem.jsHeapSizeLimit / 1024 / 1024,
      usagePercent: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100
    }
  }

  return null
}

/**
 * Performance Profiler - Measure execution time
 *
 * Usage:
 * ```typescript
 * const profiler = new PerformanceProfiler()
 * profiler.start('render')
 * // ... expensive operation
 * profiler.end('render')
 * console.log(profiler.getResults())
 * ```
 */
export class PerformanceProfiler {
  private marks = new Map<string, number>()
  private results = new Map<string, number[]>()

  start(label: string): void {
    this.marks.set(label, performance.now())
  }

  end(label: string): number {
    const startTime = this.marks.get(label)
    if (!startTime) {
      console.warn(`[Profiler] No start mark for: ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(label)

    // Store result
    if (!this.results.has(label)) {
      this.results.set(label, [])
    }
    this.results.get(label)!.push(duration)

    return duration
  }

  getResults(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const output: Record<string, any> = {}

    for (const [label, durations] of this.results.entries()) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const min = Math.min(...durations)
      const max = Math.max(...durations)

      output[label] = { avg, min, max, count: durations.length }
    }

    return output
  }

  clear(): void {
    this.marks.clear()
    this.results.clear()
  }
}

/**
 * Detect if running on mobile device
 */
export function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * Detect GPU capabilities
 */
export function detectGPUTier(): 'low' | 'medium' | 'high' {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

  if (!gl) return 'low'

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (!debugInfo) {
    // CRITICAL: Release test context before returning
    const loseExt = gl.getExtension('WEBGL_lose_context')
    loseExt?.loseContext()
    return 'medium'
  }

  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string

  // CRITICAL: Release test context to avoid "Too many active WebGL contexts"
  const loseExt = gl.getExtension('WEBGL_lose_context')
  loseExt?.loseContext()

  // High-end
  if (
    renderer.includes('NVIDIA') ||
    renderer.includes('AMD Radeon') ||
    renderer.includes('RTX') ||
    renderer.includes('GeForce GTX 1060') ||
    renderer.includes('Apple M1') ||
    renderer.includes('Apple M2') ||
    renderer.includes('Apple M3')
  ) {
    return 'high'
  }

  // Low-end (integrated graphics)
  if (
    renderer.includes('Intel HD') ||
    renderer.includes('Intel UHD 6') ||
    renderer.includes('PowerVR') ||
    isMobileDevice()
  ) {
    return 'low'
  }

  return 'medium'
}

// React import (avoid circular dependency)
import React from 'react'
