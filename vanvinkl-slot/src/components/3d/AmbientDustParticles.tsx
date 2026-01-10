'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AmbientDustParticlesProps {
  count?: number
  bounds?: { x: number; y: number; z: number }
  speed?: number
}

/**
 * Ambient Dust Particle System - 60fps optimized
 *
 * Features:
 * - GPU instanced rendering (single draw call)
 * - Gentle floating motion with sine waves
 * - Additive blending for soft glow
 * - Minimal CPU overhead
 */
export function AmbientDustParticles({
  count = 200,
  bounds = { x: 40, y: 8, z: 30 },
  speed = 0.3
}: AmbientDustParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Pre-calculate particle data once
  const particleData = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      data.push({
        // Random position within bounds
        x: (Math.random() - 0.5) * bounds.x,
        y: Math.random() * bounds.y + 0.5,
        z: (Math.random() - 0.5) * bounds.z - 5,
        // Random movement parameters
        speedX: (Math.random() - 0.5) * speed * 0.5,
        speedY: (Math.random() - 0.5) * speed * 0.3,
        speedZ: (Math.random() - 0.5) * speed * 0.5,
        // Phase offset for sine wave
        phase: Math.random() * Math.PI * 2,
        // Base scale
        scale: 0.02 + Math.random() * 0.04,
        // Oscillation amplitude
        amplitude: 0.5 + Math.random() * 1.5
      })
    }
    return data
  }, [count, bounds, speed])

  // Animation loop - minimal operations per frame
  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const p = particleData[i]

      // Gentle floating motion
      const floatX = Math.sin(time * 0.5 + p.phase) * p.amplitude
      const floatY = Math.cos(time * 0.3 + p.phase * 1.5) * p.amplitude * 0.5
      const floatZ = Math.sin(time * 0.4 + p.phase * 0.7) * p.amplitude * 0.7

      dummy.position.set(
        p.x + floatX,
        p.y + floatY,
        p.z + floatZ
      )

      // Subtle pulsing scale
      const pulseScale = p.scale * (1 + Math.sin(time * 2 + p.phase) * 0.2)
      dummy.scale.setScalar(pulseScale)

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color="#d4af37"
        transparent
        opacity={0.15}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
