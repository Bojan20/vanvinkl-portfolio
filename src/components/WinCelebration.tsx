/**
 * Win Celebration Particles - Explosive effect on machine wins
 *
 * Performance: Instanced Points, burst animation
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WinCelebrationProps {
  position: [number, number, number]
  active: boolean
  color?: string
  count?: number
}

export function WinCelebration({
  position,
  active,
  color = '#ffd700',
  count = 100
}: WinCelebrationProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const lifetimesRef = useRef<Float32Array | null>(null)
  const activeRef = useRef(false)

  // Particle data
  const { positions, _velocities, _lifetimes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const life = new Float32Array(count)

    velocitiesRef.current = vel
    lifetimesRef.current = life

    return { positions: pos, _velocities: vel, _lifetimes: life }
  }, [count])

  // Trigger burst when active changes
  useEffect(() => {
    if (active && !activeRef.current) {
      activeRef.current = true

      const pos = pointsRef.current?.geometry.attributes.position.array as Float32Array
      const vel = velocitiesRef.current!
      const life = lifetimesRef.current!

      for (let i = 0; i < count; i++) {
        const i3 = i * 3

        // Start at center
        pos[i3] = position[0]
        pos[i3 + 1] = position[1] + 3
        pos[i3 + 2] = position[2]

        // Random explosion velocity
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        const speed = 3 + Math.random() * 5

        vel[i3] = Math.sin(phi) * Math.cos(theta) * speed
        vel[i3 + 1] = Math.cos(phi) * speed + 2 // Upward bias
        vel[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed

        // Random lifetime
        life[i] = 1 + Math.random() * 1.5
      }

      if (pointsRef.current) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true
      }
    }

    if (!active) {
      activeRef.current = false
    }
  }, [active, position, count])

  // Animation
  useFrame((_, delta) => {
    if (!pointsRef.current || !velocitiesRef.current || !lifetimesRef.current) return

    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    const vel = velocitiesRef.current
    const life = lifetimesRef.current

    let anyAlive = false

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      if (life[i] > 0) {
        anyAlive = true

        // Update position
        pos[i3] += vel[i3] * delta
        pos[i3 + 1] += vel[i3 + 1] * delta
        pos[i3 + 2] += vel[i3 + 2] * delta

        // Gravity
        vel[i3 + 1] -= 9.8 * delta

        // Air resistance
        vel[i3] *= 0.99
        vel[i3 + 2] *= 0.99

        // Decrease lifetime
        life[i] -= delta
      }
    }

    if (anyAlive) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true

      // Update opacity based on average lifetime
      const mat = pointsRef.current.material as THREE.PointsMaterial
      const avgLife = life.reduce((a, b) => a + b, 0) / count
      mat.opacity = Math.max(0, avgLife * 0.8)
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.15}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
