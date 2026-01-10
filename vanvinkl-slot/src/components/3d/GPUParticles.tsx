'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GPUParticlesProps {
  count?: number
  emitPosition: THREE.Vector3
  active?: boolean
}

/**
 * High-performance GPU Particle System
 *
 * Features:
 * - Instanced geometry (minimal draw calls)
 * - Physics simulation (gravity, velocity decay)
 * - Lifecycle management (spawn/die/respawn)
 * - Color gradients over lifetime
 */
export function GPUParticles({ count = 500, emitPosition, active = false }: GPUParticlesProps) {
  const particlesRef = useRef<THREE.InstancedMesh>(null!)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const lifetimesRef = useRef<Float32Array | null>(null)
  const tempMatrix = useMemo(() => new THREE.Matrix4(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  // Initialize particle data
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const lifetimes = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Initial position at emit point
      positions[i * 3] = emitPosition.x
      positions[i * 3 + 1] = emitPosition.y
      positions[i * 3 + 2] = emitPosition.z

      // Random velocity (spherical explosion)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const speed = 3 + Math.random() * 4 // 3-7 units/sec

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 5 // Upward bias
      velocities[i * 3 + 2] = Math.cos(phi) * speed

      // Staggered spawn
      lifetimes[i] = Math.random() * 2

      // Initial gold color
      colors[i * 3] = 1.0 // R
      colors[i * 3 + 1] = 0.84 // G
      colors[i * 3 + 2] = 0.0 // B
    }

    velocitiesRef.current = velocities
    lifetimesRef.current = lifetimes

    return { positions, colors }
  }, [count, emitPosition])

  useFrame((state, delta) => {
    if (!particlesRef.current || !active) return

    const velocities = velocitiesRef.current!
    const lifetimes = lifetimesRef.current!

    for (let i = 0; i < count; i++) {
      lifetimes[i] -= delta

      if (lifetimes[i] <= 0) {
        // Respawn
        tempMatrix.setPosition(emitPosition.x, emitPosition.y, emitPosition.z)

        // Reset velocity
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        const speed = 3 + Math.random() * 4

        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
        velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 5
        velocities[i * 3 + 2] = Math.cos(phi) * speed

        lifetimes[i] = 2.0 + Math.random() * 1.0
      } else {
        // Update physics
        const idx = i * 3

        // Apply gravity
        velocities[idx + 1] -= 9.8 * delta

        // Velocity decay (air resistance)
        velocities[idx] *= 0.98
        velocities[idx + 1] *= 0.98
        velocities[idx + 2] *= 0.98

        // Update position
        const x = particleData.positions[idx] + velocities[idx] * delta
        const y = particleData.positions[idx + 1] + velocities[idx + 1] * delta
        const z = particleData.positions[idx + 2] + velocities[idx + 2] * delta

        particleData.positions[idx] = x
        particleData.positions[idx + 1] = y
        particleData.positions[idx + 2] = z

        // Set transform
        const scale = lifetimes[i] / 2.0 // Fade scale with lifetime
        tempMatrix.makeScale(scale, scale, scale)
        tempMatrix.setPosition(x, y, z)
      }

      particlesRef.current.setMatrixAt(i, tempMatrix)

      // Color gradient (gold → orange → red)
      const life = lifetimes[i] / 2.0
      tempColor.setHSL(0.1 * life, 1.0, 0.5) // Hue shift
      particlesRef.current.setColorAt(i, tempColor)
    }

    particlesRef.current.instanceMatrix.needsUpdate = true
    if (particlesRef.current.instanceColor) {
      particlesRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial
        toneMapped={false}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
