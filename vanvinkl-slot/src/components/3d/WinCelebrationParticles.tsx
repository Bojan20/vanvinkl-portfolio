'use client'

import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WinCelebrationParticlesProps {
  position: [number, number, number]
  active: boolean
  onComplete?: () => void
  intensity?: 'low' | 'medium' | 'high'
}

const INTENSITY_CONFIG = {
  low: { count: 50, speed: 4, duration: 1.5 },
  medium: { count: 100, speed: 5, duration: 2.0 },
  high: { count: 200, speed: 6, duration: 2.5 }
}

/**
 * Win Celebration Particle System - 60fps optimized
 *
 * Features:
 * - Burst effect on activation
 * - Gold/amber color gradient
 * - Gravity + air resistance physics
 * - Auto-cleanup after duration
 */
export function WinCelebrationParticles({
  position,
  active,
  onComplete,
  intensity = 'medium'
}: WinCelebrationParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  const config = INTENSITY_CONFIG[intensity]
  const { count, speed, duration } = config

  // Particle state - pre-allocated arrays for zero GC
  const particleState = useMemo(() => ({
    positions: new Float32Array(count * 3),
    velocities: new Float32Array(count * 3),
    lifetimes: new Float32Array(count),
    scales: new Float32Array(count),
    active: false,
    startTime: 0
  }), [count])

  // Initialize burst on activation
  const initBurst = useCallback(() => {
    const { positions, velocities, lifetimes, scales } = particleState

    for (let i = 0; i < count; i++) {
      const idx = i * 3

      // Start at center
      positions[idx] = position[0]
      positions[idx + 1] = position[1] + 1
      positions[idx + 2] = position[2]

      // Random velocity (cone burst upward)
      const theta = Math.random() * Math.PI * 2
      const upBias = 0.3 + Math.random() * 0.7 // 30-100% upward
      const spreadFactor = 1 - upBias

      velocities[idx] = Math.cos(theta) * spreadFactor * speed
      velocities[idx + 1] = upBias * speed * 1.5
      velocities[idx + 2] = Math.sin(theta) * spreadFactor * speed

      // Random lifetime and scale
      lifetimes[i] = 0.5 + Math.random() * (duration - 0.5)
      scales[i] = 0.05 + Math.random() * 0.08
    }

    particleState.active = true
    particleState.startTime = performance.now()
  }, [count, position, speed, duration, particleState])

  // Watch for activation
  useEffect(() => {
    if (active && !particleState.active) {
      initBurst()
    } else if (!active) {
      particleState.active = false
    }
  }, [active, initBurst, particleState])

  useFrame((_, delta) => {
    if (!meshRef.current || !particleState.active) return

    const { positions, velocities, lifetimes, scales } = particleState
    const elapsed = (performance.now() - particleState.startTime) / 1000

    // Check if effect complete
    if (elapsed > duration + 0.5) {
      particleState.active = false
      onComplete?.()
      return
    }

    let allDead = true

    for (let i = 0; i < count; i++) {
      const idx = i * 3

      lifetimes[i] -= delta

      if (lifetimes[i] <= 0) {
        // Dead particle - scale to 0
        dummy.scale.setScalar(0)
      } else {
        allDead = false

        // Apply gravity
        velocities[idx + 1] -= 12 * delta

        // Air resistance
        velocities[idx] *= 0.97
        velocities[idx + 1] *= 0.97
        velocities[idx + 2] *= 0.97

        // Update position
        positions[idx] += velocities[idx] * delta
        positions[idx + 1] += velocities[idx + 1] * delta
        positions[idx + 2] += velocities[idx + 2] * delta

        // Floor bounce
        if (positions[idx + 1] < 0.1) {
          positions[idx + 1] = 0.1
          velocities[idx + 1] *= -0.3 // Energy loss
        }

        // Set transform
        dummy.position.set(positions[idx], positions[idx + 1], positions[idx + 2])

        // Fade scale with lifetime
        const lifeRatio = lifetimes[i] / duration
        dummy.scale.setScalar(scales[i] * lifeRatio)

        // Color: gold -> orange -> red
        tempColor.setHSL(0.12 * lifeRatio, 1.0, 0.55)
        meshRef.current.setColorAt(i, tempColor)
      }

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }

    if (allDead) {
      particleState.active = false
      onComplete?.()
    }
  })

  if (!active && !particleState.active) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        toneMapped={false}
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
