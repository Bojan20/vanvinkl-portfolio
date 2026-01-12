/**
 * AVATAR PARTICLE TRAIL
 *
 * Suptilan trail iza avatara - isti stil kao cursor trail
 * - Mali cyan/magenta particles
 * - Pojavljuju se samo kad se avatar kreće
 * - Idu iza avatara u smeru kretanja
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa'
}

// ============================================
// AVATAR PARTICLE TRAIL - Cursor-style trail behind avatar
// ============================================
export function AvatarParticleTrail({
  positionRef,
  isMovingRef
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>
  isMovingRef: React.MutableRefObject<boolean>
}) {
  const pointsRef = useRef<THREE.Points>(null!)
  const particleCount = 60
  const spawnTimer = useRef(0)
  const prevPos = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  // Per-particle data
  const data = useRef({
    velocities: new Float32Array(particleCount * 3),
    lifetimes: new Float32Array(particleCount),
    maxLifetimes: new Float32Array(particleCount)
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

      data.current.lifetimes[i] = 0
      data.current.maxLifetimes[i] = 0.5
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.08, // Small like cursor trail
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      sizeAttenuation: true
    })
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    // Initialize on first frame
    if (!initialized.current) {
      prevPos.current.copy(positionRef.current)
      initialized.current = true
    }

    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const vel = data.current.velocities
    const life = data.current.lifetimes
    const maxLife = data.current.maxLifetimes

    // Calculate movement
    const vx = positionRef.current.x - prevPos.current.x
    const vz = positionRef.current.z - prevPos.current.z
    const speed = Math.sqrt(vx * vx + vz * vz)
    prevPos.current.copy(positionRef.current)

    // Only spawn when moving
    if (isMovingRef.current && speed > 0.01) {
      spawnTimer.current += delta

      // Spawn based on speed - faster = more particles
      const spawnRate = Math.max(0.02, 0.06 - speed * 0.5)

      if (spawnTimer.current > spawnRate) {
        spawnTimer.current = 0

        // Spawn 1-2 particles behind avatar
        const count = speed > 0.1 ? 2 : 1

        for (let c = 0; c < count; c++) {
          for (let i = 0; i < particleCount; i++) {
            if (life[i] <= 0) {
              const i3 = i * 3

              // Spawn behind avatar (opposite of movement direction)
              const backOffset = 0.3 + Math.random() * 0.2
              const sideOffset = (Math.random() - 0.5) * 0.3

              // Normalize movement direction
              const len = Math.max(0.001, speed)
              const dirX = -vx / len
              const dirZ = -vz / len

              // Position behind avatar feet
              posArray[i3] = positionRef.current.x + dirX * backOffset + dirZ * sideOffset
              posArray[i3 + 1] = 0.05 + Math.random() * 0.1 // Near floor
              posArray[i3 + 2] = positionRef.current.z + dirZ * backOffset - dirX * sideOffset

              // Slow drift velocity
              vel[i3] = (Math.random() - 0.5) * 0.3 + dirX * 0.2
              vel[i3 + 1] = 0.3 + Math.random() * 0.4 // Gentle rise
              vel[i3 + 2] = (Math.random() - 0.5) * 0.3 + dirZ * 0.2

              life[i] = 1.0
              maxLife[i] = 0.4 + Math.random() * 0.3

              break
            }
          }
        }
      }
    }

    // Update particles
    let needsUpdate = false
    for (let i = 0; i < particleCount; i++) {
      if (life[i] > 0) {
        const i3 = i * 3

        life[i] -= delta / maxLife[i]

        // Update position
        posArray[i3] += vel[i3] * delta
        posArray[i3 + 1] += vel[i3 + 1] * delta
        posArray[i3 + 2] += vel[i3 + 2] * delta

        // Slow down and slight gravity
        vel[i3] *= 0.95
        vel[i3 + 1] -= 0.5 * delta
        vel[i3 + 2] *= 0.95

        if (life[i] <= 0) {
          posArray[i3 + 1] = -100
        }

        needsUpdate = true
      }
    }

    if (needsUpdate) {
      posAttr.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  )
}

// ============================================
// MAIN EXPORT
// ============================================
export function AvatarEffects({
  positionRef,
  isMovingRef
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>
  isMovingRef: React.MutableRefObject<boolean>
}) {
  return <AvatarParticleTrail positionRef={positionRef} isMovingRef={isMovingRef} />
}
