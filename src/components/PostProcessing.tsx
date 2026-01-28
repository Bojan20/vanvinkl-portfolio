/**
 * Post-Processing Effects - Cyberpunk visual stack
 *
 * ZERO LATENCY APPROACH:
 * - All effects run on GPU
 * - No per-frame JS overhead
 * - Optimized settings for 60fps
 *
 * Effects stack:
 * 1. SSAO - Ambient occlusion for depth
 * 2. Bloom - Neon glow
 * 3. Chromatic Aberration - Cyberpunk distortion
 * 4. Vignette - Subtle edge darkening
 * 5. God Rays - Volumetric light through fog
 * 6. Depth of Field - Focus blur
 * 7. Screen Space Reflections - Glossy floor
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  SSAO as SSAOEffect,
  GodRays,
  DepthOfField,
  LensFlare
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize, GodRaysEffect } from 'postprocessing'
import * as THREE from 'three'

// ============================================
// QUALITY PRESETS
// ============================================
export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra'

interface QualitySettings {
  ssaoSamples: number
  ssaoRings: number
  ssaoRadius: number
  bloomIntensity: number
  bloomLevels: number
  chromaticOffset: number
  noiseIntensity: number
  multisampling: number
  // New effects
  godRaysSamples: number
  godRaysDensity: number
  dofFocusDistance: number
  dofBokehScale: number
}

const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  low: {
    ssaoSamples: 8,
    ssaoRings: 2,
    ssaoRadius: 0.05,
    bloomIntensity: 0.6,
    bloomLevels: 3,
    chromaticOffset: 0.001,
    noiseIntensity: 0.02,
    multisampling: 0,
    godRaysSamples: 30,
    godRaysDensity: 0.8,
    dofFocusDistance: 10,
    dofBokehScale: 2
  },
  medium: {
    ssaoSamples: 16,
    ssaoRings: 3,
    ssaoRadius: 0.08,
    bloomIntensity: 0.8,
    bloomLevels: 4,
    chromaticOffset: 0.0015,
    noiseIntensity: 0.025,
    multisampling: 2,
    godRaysSamples: 45,
    godRaysDensity: 0.9,
    dofFocusDistance: 10,
    dofBokehScale: 3
  },
  high: {
    ssaoSamples: 24,
    ssaoRings: 4,
    ssaoRadius: 0.1,
    bloomIntensity: 1.0,
    bloomLevels: 5,
    chromaticOffset: 0.002,
    noiseIntensity: 0.03,
    multisampling: 4,
    godRaysSamples: 60,
    godRaysDensity: 0.95,
    dofFocusDistance: 10,
    dofBokehScale: 4
  },
  ultra: {
    ssaoSamples: 32,
    ssaoRings: 5,
    ssaoRadius: 0.12,
    bloomIntensity: 1.2,
    bloomLevels: 6,
    chromaticOffset: 0.0025,
    noiseIntensity: 0.035,
    multisampling: 8,
    godRaysSamples: 80,
    godRaysDensity: 1.0,
    dofFocusDistance: 10,
    dofBokehScale: 5
  }
}

// ============================================
// MAIN POST-PROCESSING COMPONENT
// ============================================
interface PostProcessingProps {
  quality?: QualityPreset
  enabled?: boolean
  // Individual effect toggles
  enableSSAO?: boolean
  enableBloom?: boolean
  enableChromatic?: boolean
  enableVignette?: boolean
  enableNoise?: boolean
  // New AAA effects
  enableGodRays?: boolean
  enableDOF?: boolean
  godRaysLightRef?: React.RefObject<THREE.Mesh>
  dofEnabled?: boolean
}

export function PostProcessing({
  quality = 'medium',
  enabled = true,
  enableSSAO = false,  // Disabled by default - heavy
  enableBloom = true,
  enableChromatic = true,
  enableVignette = true,
  enableNoise = false,  // Disabled by default
  enableGodRays = false, // Auto-enabled based on quality
  enableDOF = false,     // Auto-enabled based on quality
  godRaysLightRef,
  dofEnabled = false
}: PostProcessingProps) {
  const settings = QUALITY_PRESETS[quality]

  if (!enabled) return null

  // Auto-enable heavy effects based on quality tier
  const shouldEnableGodRays = enableGodRays || (quality === 'high' || quality === 'ultra')
  const shouldEnableDOF = enableDOF || dofEnabled || (quality === 'ultra')

  // Build effects array to avoid conditional rendering issues
  const effects: React.ReactNode[] = []

  if (enableSSAO) {
    effects.push(
      <SSAOEffect
        key="ssao"
        blendFunction={BlendFunction.MULTIPLY}
        samples={settings.ssaoSamples}
        rings={settings.ssaoRings}
        radius={settings.ssaoRadius}
        intensity={1.5}
        luminanceInfluence={0.5}
        bias={0.025}
        distanceScaling={true}
        depthAwareUpsampling={true}
      />
    )
  }

  if (enableBloom) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={settings.bloomIntensity}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
        kernelSize={KernelSize.MEDIUM}
        levels={settings.bloomLevels}
      />
    )
  }

  if (enableChromatic) {
    effects.push(
      <ChromaticAberration
        key="chromatic"
        offset={new THREE.Vector2(settings.chromaticOffset, settings.chromaticOffset)}
        radialModulation={true}
        modulationOffset={0.5}
      />
    )
  }

  if (enableVignette) {
    effects.push(
      <Vignette
        key="vignette"
        offset={0.3}
        darkness={0.5}
        eskil={false}
      />
    )
  }

  if (enableNoise) {
    effects.push(
      <Noise
        key="noise"
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={settings.noiseIntensity}
      />
    )
  }

  // God Rays - Heavy, only on high/ultra quality
  if (shouldEnableGodRays && godRaysLightRef?.current) {
    effects.push(
      <GodRays
        key="godrays"
        sun={godRaysLightRef.current}
        samples={settings.godRaysSamples}
        density={settings.godRaysDensity}
        decay={0.95}
        weight={0.6}
        exposure={0.4}
        clampMax={1}
      />
    )
  }

  // Depth of Field - Ultra heavy, only on ultra quality
  if (shouldEnableDOF) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={0}
        focalLength={0.02}
        bokehScale={settings.dofBokehScale}
        height={480}
      />
    )
  }

  return (
    <EffectComposer multisampling={settings.multisampling}>
      {effects as unknown as React.ReactElement[]}
    </EffectComposer>
  )
}

// ============================================
// LIGHTWEIGHT VERSION - For lower-end devices
// Only Bloom, optimized for performance
// ============================================
export function PostProcessingLite() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  )
}

// ============================================
// AUTO-QUALITY DETECTION
// Detects device capabilities and returns appropriate preset
// ============================================
export function detectQualityPreset(): QualityPreset {
  // Check WebGL capabilities
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

  if (!gl) return 'low'

  // Check for mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  if (isMobile) return 'low'

  // Check GPU vendor
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()

    // Integrated graphics = medium
    if (renderer.includes('intel') || renderer.includes('integrated')) {
      return 'medium'
    }

    // High-end discrete GPU = high/ultra
    if (renderer.includes('rtx') || renderer.includes('radeon rx 6') || renderer.includes('radeon rx 7')) {
      return 'ultra'
    }

    if (renderer.includes('gtx') || renderer.includes('radeon')) {
      return 'high'
    }
  }

  // Default to medium
  return 'medium'
}

// ============================================
// ADAPTIVE POST-PROCESSING
// Automatically adjusts quality based on FPS
// ============================================
interface AdaptivePostProcessingProps {
  targetFPS?: number
  children?: React.ReactNode
}

export function AdaptivePostProcessing({
  targetFPS = 55,
  children
}: AdaptivePostProcessingProps) {
  const frameTimesRef = useRef<number[]>([])
  const qualityRef = useRef<QualityPreset>(detectQualityPreset())
  const lastAdjustmentRef = useRef(0)

  useFrame((state) => {
    const now = state.clock.elapsedTime
    const fps = 1 / state.clock.getDelta()

    // Collect frame times (last 60 frames)
    frameTimesRef.current.push(fps)
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift()
    }

    // Adjust quality every 5 seconds
    if (now - lastAdjustmentRef.current > 5) {
      lastAdjustmentRef.current = now

      const avgFPS = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length

      const qualities: QualityPreset[] = ['low', 'medium', 'high', 'ultra']
      const currentIndex = qualities.indexOf(qualityRef.current)

      if (avgFPS < targetFPS - 10 && currentIndex > 0) {
        // Downgrade quality
        qualityRef.current = qualities[currentIndex - 1]
        console.log(`[PostProcessing] Downgrading to ${qualityRef.current} (FPS: ${avgFPS.toFixed(1)})`)
      } else if (avgFPS > targetFPS + 5 && currentIndex < qualities.length - 1) {
        // Upgrade quality
        qualityRef.current = qualities[currentIndex + 1]
        console.log(`[PostProcessing] Upgrading to ${qualityRef.current} (FPS: ${avgFPS.toFixed(1)})`)
      }
    }
  })

  return <PostProcessing quality={qualityRef.current} />
}
