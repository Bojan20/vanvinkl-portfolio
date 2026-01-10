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
  focusDistance?: number
  enableSSAO?: boolean
  enableDOF?: boolean
  quality?: 'low' | 'medium' | 'high' | 'ultra'
}

/**
 * AAA Post-Processing Stack
 *
 * Features:
 * - N8AO (Ground-truth Ambient Occlusion) - modern AO
 * - Bloom - HDR glow with mipmap blur for neon lights
 * - Depth of Field - cinematic focus
 * - Vignette - cinematic framing
 * - Chromatic Aberration - lens distortion
 * - ACES Filmic Tone Mapping - Hollywood color science
 *
 * Quality presets:
 * - low: Only vignette + tonemapping (60fps mobile)
 * - medium: + Bloom (60fps desktop)
 * - high: + N8AO (45-60fps desktop)
 * - ultra: + DoF + ChromaticAberration (30-45fps, cinematic)
 */
export function AdvancedPostProcessing({
  focusDistance = 0.02,
  enableSSAO = true,
  enableDOF = false,
  quality = 'high'
}: AdvancedPostProcessingProps) {
  const chromaticAberrationOffset = useMemo(
    () => new THREE.Vector2(0.001, 0.001),
    []
  )

  // LOW - Mobile/Low-end
  if (quality === 'low') {
    return (
      <EffectComposer multisampling={0} stencilBuffer={false}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.5} darkness={0.3} eskil={false} />
      </EffectComposer>
    )
  }

  // MEDIUM - Good balance (60fps)
  if (quality === 'medium') {
    return (
      <EffectComposer multisampling={0} stencilBuffer={false}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          mipmapBlur={true}
          kernelSize={KernelSize.LARGE}
        />
        <Vignette offset={0.5} darkness={0.35} eskil={false} />
      </EffectComposer>
    )
  }

  // HIGH - Desktop recommended (smooth 60fps)
  if (quality === 'high') {
    if (enableSSAO) {
      return (
        <EffectComposer multisampling={0} stencilBuffer={false}>
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <N8AO
            aoRadius={0.5}
            intensity={2.5}
            aoSamples={16}
            denoiseSamples={4}
            distanceFalloff={0.8}
            halfRes={true}
            color={new THREE.Color(0, 0, 0)}
          />
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur={true}
            kernelSize={KernelSize.HUGE}
          />
          <Vignette offset={0.5} darkness={0.4} eskil={false} />
        </EffectComposer>
      )
    }
    return (
      <EffectComposer multisampling={0} stencilBuffer={false}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur={true}
          kernelSize={KernelSize.HUGE}
        />
        <Vignette offset={0.5} darkness={0.4} eskil={false} />
      </EffectComposer>
    )
  }

  // ULTRA - Maximum quality (cinematic)
  // Full stack with all effects
  if (enableSSAO && enableDOF) {
    return (
      <EffectComposer multisampling={4} stencilBuffer={false}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <N8AO
          aoRadius={0.6}
          intensity={3.0}
          aoSamples={32}
          denoiseSamples={8}
          distanceFalloff={1.0}
          halfRes={false}
          color={new THREE.Color(0, 0, 0)}
        />
        <DepthOfField
          focusDistance={focusDistance}
          focalLength={0.05}
          bokehScale={3}
          height={480}
        />
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.95}
          mipmapBlur={true}
          kernelSize={KernelSize.HUGE}
        />
        <ChromaticAberration
          offset={chromaticAberrationOffset}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={true}
          modulationOffset={0.5}
        />
        <Vignette offset={0.45} darkness={0.5} eskil={false} />
      </EffectComposer>
    )
  }

  if (enableSSAO) {
    return (
      <EffectComposer multisampling={4} stencilBuffer={false}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <N8AO
          aoRadius={0.6}
          intensity={3.0}
          aoSamples={32}
          denoiseSamples={8}
          distanceFalloff={1.0}
          halfRes={false}
          color={new THREE.Color(0, 0, 0)}
        />
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.95}
          mipmapBlur={true}
          kernelSize={KernelSize.HUGE}
        />
        <ChromaticAberration
          offset={chromaticAberrationOffset}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={true}
          modulationOffset={0.5}
        />
        <Vignette offset={0.45} darkness={0.5} eskil={false} />
      </EffectComposer>
    )
  }

  // Default ULTRA without SSAO
  return (
    <EffectComposer multisampling={4} stencilBuffer={false}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Bloom
        intensity={2.0}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.95}
        mipmapBlur={true}
        kernelSize={KernelSize.HUGE}
      />
      <ChromaticAberration
        offset={chromaticAberrationOffset}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={true}
        modulationOffset={0.5}
      />
      <Vignette offset={0.45} darkness={0.5} eskil={false} />
    </EffectComposer>
  )
}

/**
 * Lightweight variant for performance testing
 */
export function LightweightPostProcessing() {
  return (
    <EffectComposer multisampling={0} stencilBuffer={false}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
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
