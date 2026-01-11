/**
 * AVATAR EFFECTS - OPTIMIZED
 *
 * Performance rules:
 * - Use Points instead of multiple meshes
 * - Pre-allocate all buffers
 * - NO per-frame allocations
 * - Minimal draw calls
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa'
}

// ============================================
// FOOTSTEP PARTICLES - Optimized points system
// ============================================
export function FootstepParticles({
  positionRef,
  isMoving
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>
  isMoving: boolean
}) {
  const particlesRef = useRef<THREE.Points>(null!)
  const particleCount = 30 // Reduced
  const spawnTimer = useRef(0)
  const lastSpawnPos = useRef(new THREE.Vector3())

  const data = useRef({
    velocities: new Float32Array(particleCount * 3),
    lifetimes: new Float32Array(particleCount)
  })

  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const cyanColor = new THREE.Color(COLORS.cyan)
    const magentaColor = new THREE.Color(COLORS.magenta)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = 0
      positions[i3 + 1] = -100 // Hidden
      positions[i3 + 2] = 0

      const color = i % 2 === 0 ? cyanColor : magentaColor
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!particlesRef.current) return

    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const vel = data.current.velocities
    const life = data.current.lifetimes

    // Spawn when moving
    if (isMoving) {
      spawnTimer.current += delta
      const dist = lastSpawnPos.current.distanceTo(positionRef.current)

      if (spawnTimer.current > 0.08 && dist > 0.3) {
        spawnTimer.current = 0
        lastSpawnPos.current.copy(positionRef.current)

        // Find dead particle
        for (let i = 0; i < particleCount; i++) {
          if (life[i] <= 0) {
            const i3 = i * 3
            posArray[i3] = positionRef.current.x + (Math.random() - 0.5) * 0.2
            posArray[i3 + 1] = 0.05
            posArray[i3 + 2] = positionRef.current.z + (Math.random() - 0.5) * 0.2

            const angle = Math.random() * Math.PI * 2
            vel[i3] = Math.cos(angle) * 0.3
            vel[i3 + 1] = 1 + Math.random() * 0.5
            vel[i3 + 2] = Math.sin(angle) * 0.3
            life[i] = 0.4
            break
          }
        }
      }
    }

    // Update all
    let needsUpdate = false
    for (let i = 0; i < particleCount; i++) {
      if (life[i] > 0) {
        const i3 = i * 3
        life[i] -= delta
        posArray[i3] += vel[i3] * delta
        posArray[i3 + 1] += vel[i3 + 1] * delta
        posArray[i3 + 2] += vel[i3 + 2] * delta
        vel[i3 + 1] -= 4 * delta

        if (life[i] <= 0) {
          posArray[i3 + 1] = -100
        }
        needsUpdate = true
      }
    }

    if (needsUpdate) posAttr.needsUpdate = true
  })

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

// ============================================
// GHOST TRAIL - Using Points instead of meshes
// ============================================
export function GhostTrail({
  positionRef,
  rotationRef
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>
  rotationRef: React.MutableRefObject<number>
  isMoving: boolean
}) {
  const pointsRef = useRef<THREE.Points>(null!)
  const ghostCount = 5
  const updateTimer = useRef(0)

  const history = useRef<THREE.Vector3[]>(
    Array(ghostCount).fill(null).map(() => new THREE.Vector3(0, -100, 0))
  )

  const geometry = useMemo(() => {
    const positions = new Float32Array(ghostCount * 3)
    const sizes = new Float32Array(ghostCount)

    for (let i = 0; i < ghostCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = -100 // Hidden initially
      positions[i * 3 + 2] = 0
      sizes[i] = 0.3 * (1 - i / ghostCount * 0.6) // Decreasing size
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    updateTimer.current += delta

    if (updateTimer.current > 0.04) {
      updateTimer.current = 0

      // Shift positions
      for (let i = ghostCount - 1; i > 0; i--) {
        history.current[i].copy(history.current[i - 1])
      }
      history.current[0].copy(positionRef.current)

      // Update geometry
      const posAttr = geometry.attributes.position as THREE.BufferAttribute
      const posArray = posAttr.array as Float32Array

      for (let i = 0; i < ghostCount; i++) {
        const i3 = i * 3
        posArray[i3] = history.current[i].x
        posArray[i3 + 1] = i === 0 ? -100 : 0.15 // Hide first (avatar position)
        posArray[i3 + 2] = history.current[i].z
      }

      posAttr.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.25}
        color={COLORS.magenta}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  )
}

// ============================================
// COMBINED - Minimal components
// ============================================
export function AvatarEffects({
  positionRef,
  rotationRef,
  isMoving
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>
  rotationRef: React.MutableRefObject<number>
  isMoving: boolean
}) {
  return (
    <>
      <FootstepParticles positionRef={positionRef} isMoving={isMoving} />
      <GhostTrail positionRef={positionRef} rotationRef={rotationRef} isMoving={isMoving} />
    </>
  )
}
