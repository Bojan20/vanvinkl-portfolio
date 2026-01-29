/**
 * Performance Utilities Tests
 *
 * Tests for FPS monitoring, profiling, and device detection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  FPSMonitor,
  PerformanceProfiler,
  getMemoryUsage,
  isMobileDevice,
  detectGPUTier
} from './performance'

describe('FPSMonitor', () => {
  let monitor: FPSMonitor

  beforeEach(() => {
    monitor = new FPSMonitor()
  })

  afterEach(() => {
    monitor.stop()
  })

  it('starts and stops without error', () => {
    expect(() => {
      monitor.start()
      monitor.stop()
    }).not.toThrow()
  })

  it('returns 60 FPS when no frames recorded', () => {
    expect(monitor.getFPS()).toBe(60)
  })

  it('returns default stats when no frames recorded', () => {
    const stats = monitor.getStats()
    expect(stats).toEqual({ min: 60, max: 60, avg: 60 })
  })

  it('prevents multiple starts', () => {
    monitor.start()
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    monitor.start() // Should not call RAF again
    expect(rafSpy).not.toHaveBeenCalled()
    rafSpy.mockRestore()
  })

  it('resets frame history', () => {
    monitor.reset()
    expect(monitor.getFPS()).toBe(60) // Default value after reset
  })

  it('calculates FPS from frames', async () => {
    // Manually simulate frame data by starting and waiting
    monitor.start()

    // Give it some time to collect frames
    await new Promise(resolve => setTimeout(resolve, 100))

    const fps = monitor.getFPS()
    // Should have some frames now (not default 60)
    expect(fps).toBeGreaterThan(0)
    expect(fps).toBeLessThanOrEqual(120) // Reasonable upper bound
  })
})

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler

  beforeEach(() => {
    profiler = new PerformanceProfiler()
  })

  it('measures execution time', () => {
    profiler.start('test')
    // Small delay
    const start = performance.now()
    while (performance.now() - start < 5) {
      // Busy wait 5ms
    }
    const duration = profiler.end('test')

    expect(duration).toBeGreaterThan(0)
    expect(duration).toBeLessThan(100) // Sanity check
  })

  it('returns 0 for unstarted label', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const duration = profiler.end('nonexistent')

    expect(duration).toBe(0)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No start mark for')
    )
    warnSpy.mockRestore()
  })

  it('tracks multiple labels independently', () => {
    profiler.start('label1')
    profiler.start('label2')

    const d1 = profiler.end('label1')
    const d2 = profiler.end('label2')

    expect(d1).toBeGreaterThanOrEqual(0)
    expect(d2).toBeGreaterThanOrEqual(0)
  })

  it('accumulates results for same label', () => {
    profiler.start('test')
    profiler.end('test')
    profiler.start('test')
    profiler.end('test')

    const results = profiler.getResults()
    expect(results.test.count).toBe(2)
  })

  it('calculates min/max/avg correctly', () => {
    // Run multiple times
    for (let i = 0; i < 3; i++) {
      profiler.start('test')
      profiler.end('test')
    }

    const results = profiler.getResults()
    expect(results.test.count).toBe(3)
    expect(results.test.min).toBeLessThanOrEqual(results.test.avg)
    expect(results.test.max).toBeGreaterThanOrEqual(results.test.avg)
  })

  it('clears all data', () => {
    profiler.start('test')
    profiler.end('test')
    profiler.clear()

    const results = profiler.getResults()
    expect(Object.keys(results)).toHaveLength(0)
  })
})

describe('getMemoryUsage', () => {
  it('returns null when memory API not available', () => {
    // jsdom doesn't have performance.memory
    const result = getMemoryUsage()

    // In jsdom environment, this should be null
    if (!('memory' in performance)) {
      expect(result).toBeNull()
    } else {
      // If somehow available (Chrome), should have correct shape
      expect(result).toHaveProperty('usedMB')
      expect(result).toHaveProperty('totalMB')
      expect(result).toHaveProperty('limitMB')
      expect(result).toHaveProperty('usagePercent')
    }
  })

  it('returns stats when memory API is available', () => {
    // Mock the memory API
    const mockMemory = {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 4096 * 1024 * 1024 // 4GB
    }

    const originalMemory = (performance as any).memory
    ;(performance as any).memory = mockMemory

    const result = getMemoryUsage()

    expect(result).not.toBeNull()
    expect(result!.usedMB).toBe(50)
    expect(result!.totalMB).toBe(100)
    expect(result!.limitMB).toBe(4096)
    expect(result!.usagePercent).toBeCloseTo(1.22, 1) // 50MB / 4096MB

    // Restore
    if (originalMemory) {
      ;(performance as any).memory = originalMemory
    } else {
      delete (performance as any).memory
    }
  })
})

describe('isMobileDevice', () => {
  const originalUserAgent = navigator.userAgent

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true
    })
  })

  const setUserAgent = (ua: string) => {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      writable: true,
      configurable: true
    })
  }

  it('detects iPhone', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
    expect(isMobileDevice()).toBe(true)
  })

  it('detects iPad', () => {
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)')
    expect(isMobileDevice()).toBe(true)
  })

  it('detects Android', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 11; Pixel 5)')
    expect(isMobileDevice()).toBe(true)
  })

  it('detects iPod', () => {
    setUserAgent('Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)')
    expect(isMobileDevice()).toBe(true)
  })

  it('returns false for desktop Chrome', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    expect(isMobileDevice()).toBe(false)
  })

  it('returns false for desktop Safari', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')
    expect(isMobileDevice()).toBe(false)
  })

  it('returns false for desktop Firefox', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0')
    expect(isMobileDevice()).toBe(false)
  })
})

describe('detectGPUTier', () => {
  // Note: jsdom doesn't have WebGL, so these tests mock the context

  it('returns low when no WebGL context', () => {
    // jsdom doesn't support WebGL, so getContext returns null
    const result = detectGPUTier()
    expect(result).toBe('low')
  })

  it('returns medium when no debug info extension', () => {
    // Create mock WebGL context
    const mockGl = {
      getExtension: () => null
    }

    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string) {
      if (type === 'webgl2' || type === 'webgl') {
        return mockGl as any
      }
      return originalGetContext.call(this, type as any)
    }

    const result = detectGPUTier()
    expect(result).toBe('medium')

    HTMLCanvasElement.prototype.getContext = originalGetContext
  })

  it('detects high-end GPU (NVIDIA)', () => {
    const mockGl = {
      getExtension: (name: string) => {
        if (name === 'WEBGL_debug_renderer_info') {
          return { UNMASKED_RENDERER_WEBGL: 0x9246 }
        }
        return null
      },
      getParameter: () => 'NVIDIA GeForce RTX 3080'
    }

    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string) {
      if (type === 'webgl2' || type === 'webgl') {
        return mockGl as any
      }
      return originalGetContext.call(this, type as any)
    }

    const result = detectGPUTier()
    expect(result).toBe('high')

    HTMLCanvasElement.prototype.getContext = originalGetContext
  })

  it('detects high-end GPU (Apple M1)', () => {
    const mockGl = {
      getExtension: (name: string) => {
        if (name === 'WEBGL_debug_renderer_info') {
          return { UNMASKED_RENDERER_WEBGL: 0x9246 }
        }
        return null
      },
      getParameter: () => 'Apple M1'
    }

    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string) {
      if (type === 'webgl2' || type === 'webgl') {
        return mockGl as any
      }
      return originalGetContext.call(this, type as any)
    }

    const result = detectGPUTier()
    expect(result).toBe('high')

    HTMLCanvasElement.prototype.getContext = originalGetContext
  })

  it('detects low-end GPU (Intel HD)', () => {
    const mockGl = {
      getExtension: (name: string) => {
        if (name === 'WEBGL_debug_renderer_info') {
          return { UNMASKED_RENDERER_WEBGL: 0x9246 }
        }
        return null
      },
      getParameter: () => 'Intel HD Graphics 520'
    }

    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string) {
      if (type === 'webgl2' || type === 'webgl') {
        return mockGl as any
      }
      return originalGetContext.call(this, type as any)
    }

    const result = detectGPUTier()
    expect(result).toBe('low')

    HTMLCanvasElement.prototype.getContext = originalGetContext
  })
})
