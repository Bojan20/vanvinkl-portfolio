'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { VolumetricLightMaterial } from '@/shaders/VolumetricLight'
import { RenderingConfig } from '@/config/rendering'
import * as THREE from 'three'
import gsap from 'gsap'

// Extend R3F with custom material
extend({ VolumetricLightMaterial })

interface AdvancedLightingProps {
  machinePositions: Array<{ id: string; pos: [number, number, number] }>
  nearMachine?: string | null
  config: RenderingConfig
}

/**
 * AAA Lighting System
 *
 * Features:
 * - Volumetric god rays
 * - HDR environment with custom lightformers
 * - Dynamic light sequencing (attract mode)
 * - Area lights for soft shadows
 * - Per-machine accent lights
 */
export function AdvancedLighting({ machinePositions, nearMachine, config }: AdvancedLightingProps) {
  const volumetricRef = useRef<THREE.Mesh>(null!)
  const attractTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const machineLightsRef = useRef<THREE.PointLight[]>([])

  // Volumetric material time update
  useFrame((state, delta) => {
    if (volumetricRef.current) {
      const material = volumetricRef.current.material as any
      material.uniforms.time.value = state.clock.elapsedTime
    }
  })

  // Attract mode light sequencing
  useEffect(() => {
    if (machineLightsRef.current.length === 0) return

    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 2 })

    // Chase sequence left → right
    machinePositions.forEach((machine, i) => {
      const light = machineLightsRef.current[i]
      if (!light) return

      timeline.to(
        light,
        {
          intensity: 8,
          duration: 0.3,
          ease: 'power2.out'
        },
        i * 0.2
      )

      timeline.to(
        light,
        {
          intensity: 2,
          duration: 0.5,
          ease: 'power2.in'
        },
        i * 0.2 + 0.3
      )
    })

    attractTimelineRef.current = timeline
    timeline.play()

    return () => {
      timeline.kill()
    }
  }, [machinePositions])

  // Boost light intensity for near machine
  useEffect(() => {
    if (!nearMachine) return

    const index = machinePositions.findIndex(m => m.id === nearMachine)
    if (index === -1) return

    const light = machineLightsRef.current[index]
    if (!light) return

    // Pause attract mode
    attractTimelineRef.current?.pause()

    // Boost intensity
    gsap.to(light, {
      intensity: 12,
      duration: 0.3,
      ease: 'power2.out'
    })

    return () => {
      // Restore
      gsap.to(light, {
        intensity: 2,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          attractTimelineRef.current?.resume()
        }
      })
    }
  }, [nearMachine, machinePositions])

  return (
    <group>
      {/* HDR ENVIRONMENT — Professional layered lighting (Bellagio/Wynn standard) */}
      <Environment resolution={256}>
        {/* Floor fill - deep charcoal reflection */}
        <Lightformer
          intensity={0.3}
          rotation-x={Math.PI / 2}
          position={[0, -5, 0]}
          scale={[20, 20, 1]}
          color="#1C1C1C"
        />

        {/* Ceiling ambient - warm white (chandelier reflection) */}
        <Lightformer
          intensity={0.8}
          rotation-x={-Math.PI / 2}
          position={[0, 10, 0]}
          scale={[30, 30, 1]}
          color="#FFF8E7"
        />

        {/* Left wall - burgundy accent (Italian textile mood) */}
        <Lightformer
          intensity={0.4}
          rotation-y={Math.PI / 2}
          position={[-20, 2, -5]}
          scale={[20, 10, 1]}
          color="#4A0E0E"
        />

        {/* Right wall - emerald accent (jewel tone complement) */}
        <Lightformer
          intensity={0.4}
          rotation-y={-Math.PI / 2}
          position={[20, 2, -5]}
          scale={[20, 10, 1]}
          color="#0F4C3A"
        />

        {/* Back wall - rich mahogany wood tone */}
        <Lightformer
          intensity={0.6}
          rotation-y={0}
          position={[0, 4, -20]}
          scale={[50, 8, 1]}
          color="#2D1810"
        />
      </Environment>

      {/* VOLUMETRIC ATMOSPHERE — Additive glow sphere (quality-aware) */}
      {config.enableVolumetricLighting && (
        <mesh ref={volumetricRef} position={[0, 12, -8]}>
          <sphereGeometry args={[15, 32, 32]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* AMBIENT LIGHT — Base fill */}
      <ambientLight intensity={0.4} color="#1a1a2e" />

      {/* KEY LIGHT — Main ceiling spot */}
      <spotLight
        position={[0, 15, -8]}
        angle={Math.PI / 2}
        penumbra={0.8}
        intensity={4}
        color="#FFD700"
        castShadow={false}
      />

      {/* FILL LIGHTS — Much darker, warmer ambient */}
      <spotLight
        position={[-15, 10, -5]}
        angle={Math.PI / 2.2}
        penumbra={0.9}
        intensity={0.6}
        color="#6B0000"
        castShadow={false}
      />

      <spotLight
        position={[15, 10, -5]}
        angle={Math.PI / 2.2}
        penumbra={0.9}
        intensity={0.6}
        color="#6B0000"
        castShadow={false}
      />

      {/* RIM LIGHTS — Subtle, no bright colors */}
      <directionalLight
        position={[-10, 5, 10]}
        intensity={0.4}
        color="#3D1810"
      />

      <directionalLight
        position={[10, 5, 10]}
        intensity={0.4}
        color="#3D1810"
      />

      {/* PER-MACHINE ACCENT LIGHTS — Dynamic attract mode */}
      {machinePositions.map((machine, i) => (
        <pointLight
          key={machine.id}
          ref={(el) => {
            if (el) machineLightsRef.current[i] = el
          }}
          position={[machine.pos[0], machine.pos[1] + 3, machine.pos[2]]}
          intensity={2}
          distance={8}
          decay={2}
          color="#FFD700"
        />
      ))}

      {/* FLOOR LIGHT — Subtle uplight */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={0.8}
        distance={20}
        decay={2}
        color="#2a1a1f"
      />
    </group>
  )
}
