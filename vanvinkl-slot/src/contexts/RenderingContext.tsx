'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  RenderQuality,
  RenderingConfig,
  getRenderingConfig,
  detectOptimalQuality,
  AdaptiveQualityManager
} from '@/config/rendering'

interface RenderingContextValue {
  quality: RenderQuality
  config: RenderingConfig
  setQuality: (quality: RenderQuality) => void
  enableAdaptiveQuality: boolean
  setEnableAdaptiveQuality: (enabled: boolean) => void
}

const RenderingContext = createContext<RenderingContextValue | null>(null)

interface RenderingProviderProps {
  children: ReactNode
  initialQuality?: RenderQuality
  enableAdaptive?: boolean
}

export function RenderingProvider({
  children,
  initialQuality,
  enableAdaptive = false
}: RenderingProviderProps) {
  // Auto-detect optimal quality if not specified
  const [quality, setQualityState] = useState<RenderQuality>(() => {
    if (initialQuality) return initialQuality
    return detectOptimalQuality()
  })

  const [enableAdaptiveQuality, setEnableAdaptiveQuality] = useState(enableAdaptive)
  const [config, setConfig] = useState<RenderingConfig>(() => getRenderingConfig(quality))

  // Update config when quality changes
  useEffect(() => {
    setConfig(getRenderingConfig(quality))
  }, [quality])

  const setQuality = (newQuality: RenderQuality) => {
    setQualityState(newQuality)
    console.log(`[Rendering] Quality changed to: ${newQuality}`)
  }

  const value: RenderingContextValue = {
    quality,
    config,
    setQuality,
    enableAdaptiveQuality,
    setEnableAdaptiveQuality
  }

  return <RenderingContext.Provider value={value}>{children}</RenderingContext.Provider>
}

/**
 * Hook to access rendering configuration
 */
export function useRenderingConfig() {
  const context = useContext(RenderingContext)
  if (!context) {
    throw new Error('useRenderingConfig must be used within RenderingProvider')
  }
  return context
}

/**
 * Hook for adaptive quality management
 */
export function useAdaptiveQuality() {
  const { quality, setQuality, enableAdaptiveQuality } = useRenderingConfig()
  const [manager] = useState(() => new AdaptiveQualityManager(quality))

  useEffect(() => {
    if (!enableAdaptiveQuality) return

    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      const currentTime = performance.now()
      const delta = currentTime - lastTime

      if (delta >= 1000) {
        const fps = (frameCount * 1000) / delta
        manager.updateFPS(fps)

        // Check if quality should adjust (every second)
        const { quality: newQuality, changed } = manager.adjustQuality()
        if (changed) {
          setQuality(newQuality)
        }

        frameCount = 0
        lastTime = currentTime
      }

      frameCount++
      requestAnimationFrame(measureFPS)
    }

    const rafId = requestAnimationFrame(measureFPS)

    return () => cancelAnimationFrame(rafId)
  }, [enableAdaptiveQuality, manager, setQuality])

  return manager
}
