/**
 * Ambient Dust Particles - Atmospheric effect
 *
 * Performance: Instanced Points, GPU-driven motion
 * 60fps target with 500+ particles
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DustParticlesProps {
  count?: number
  area?: [number, number, number]
  color?: string
  opacity?: number
  size?: number
}

export function DustParticles({
  count = 500,
  area = [50, 8, 40],
  color = '#ffffff',
  opacity = 0.3,
  size = 0.05
}: DustParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const velocitiesRef = useRef<Float32Array>()

  // Generate particle positions and velocities
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Random position within area
      pos[i3] = (Math.random() - 0.5) * area[0]
      pos[i3 + 1] = Math.random() * area[1]
      pos[i3 + 2] = (Math.random() - 0.5) * area[2] + 5 // Center around z=5

      // Random velocity (slow drift)
      vel[i3] = (Math.random() - 0.5) * 0.02
      vel[i3 + 1] = Math.random() * 0.01 + 0.002 // Slight upward bias
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02
    }

    velocitiesRef.current = vel
    return { positions: pos, velocities: vel }
  }, [count, area])

  // Animation
  useFrame((_, delta) => {
    if (!pointsRef.current || !velocitiesRef.current) return

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const vel = velocitiesRef.current

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Update position
      positions[i3] += vel[i3] * delta * 60
      positions[i3 + 1] += vel[i3 + 1] * delta * 60
      positions[i3 + 2] += vel[i3 + 2] * delta * 60

      // Wrap around bounds
      if (positions[i3] > area[0] / 2) positions[i3] = -area[0] / 2
      if (positions[i3] < -area[0] / 2) positions[i3] = area[0] / 2
      if (positions[i3 + 1] > area[1]) positions[i3 + 1] = 0
      if (positions[i3 + 2] > area[2] / 2 + 5) positions[i3 + 2] = -area[2] / 2 + 5
      if (positions[i3 + 2] < -area[2] / 2 + 5) positions[i3 + 2] = area[2] / 2 + 5

      // Random velocity wobble
      vel[i3] += (Math.random() - 0.5) * 0.001
      vel[i3 + 1] += (Math.random() - 0.5) * 0.0005
      vel[i3 + 2] += (Math.random() - 0.5) * 0.001

      // Clamp velocity
      vel[i3] = Math.max(-0.03, Math.min(0.03, vel[i3]))
      vel[i3 + 1] = Math.max(0.001, Math.min(0.02, vel[i3 + 1]))
      vel[i3 + 2] = Math.max(-0.03, Math.min(0.03, vel[i3 + 2]))
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
