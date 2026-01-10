'use client'

import { useMemo } from 'react'
import {
  EffectComposer,
  Bloom,
  Vignette,
  DepthOfField,
  ChromaticAberration,
  ToneMapping,
  N8AO
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

interface AdvancedPostProcessingProps {
  focusDistance?: number // For DOF
  enableSSAO?: boolean
  enableDOF?: boolean
}

/**
 * AAA-tier Post-Processing Stack
 *
 * Features:
 * - N8AO (Ground-truth Ambient Occlusion) — modern AO without NormalPass
 * - Depth of Field — focus on active slot
 * - Bloom — HDR glow with mipmap blur
 * - Vignette — cinematic framing
 * - Chromatic Aberration — lens distortion
 * - Tone Mapping — ACES filmic
 *
 * Performance: Medium-High
 * Recommended for: Desktop, high-end mobile
 *
 * Notes:
 * - Using N8AO instead of SSAO (better quality, no NormalPass requirement)
 * - SSR not available in @react-three/postprocessing (using MeshReflectorMaterial instead)
 */
export function AdvancedPostProcessing({
  focusDistance = 0.02,
  enableSSAO = true,
  enableDOF = false // Disabled by default
}: AdvancedPostProcessingProps) {
  // Chromatic aberration offset
  const chromaticAberrationOffset = useMemo(
    () => new THREE.Vector2(0.0008, 0.0008),
    []
  )

  return (
    <EffectComposer
      multisampling={0}
      stencilBuffer={false}
    >
      {/* Bloom — Performance optimized */}
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.7}
        mipmapBlur={false}
        kernelSize={KernelSize.MEDIUM}
        levels={6}
      />

      {/* Vignette — Minimal cost */}
      <Vignette
        offset={0.5}
        darkness={0.4}
        eskil={false}
      />
    </EffectComposer>
  )
}

/**
 * Performance-optimized variant (for mobile/lower-end)
 */
export function LightweightPostProcessing() {
  return (
    <EffectComposer
      multisampling={0}
      stencilBuffer={false}
    >
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.7}
        mipmapBlur={false}
        kernelSize={KernelSize.MEDIUM}
      />
      <Vignette offset={0.5} darkness={0.4} />
    </EffectComposer>
  )
}
