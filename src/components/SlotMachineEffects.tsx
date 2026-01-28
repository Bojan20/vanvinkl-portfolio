/**
 * SLOT MACHINE WOW EFFECTS - OPTIMIZED
 *
 * Performance rules:
 * - NO new materials/geometries in render
 * - NO per-frame allocations
 * - Minimal lights
 * - Conditional rendering only when needed
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  gold: '#ffd700'
}

// ============================================
// PODIUM GLOW - Simple floor circle (LIGHTWEIGHT)
// ============================================
function PodiumGlow({ x, z, active }: { x: number; z: number; active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const opacityRef = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const target = active ? 0.4 : 0
    opacityRef.current += (target - opacityRef.current) * delta * 8
    ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacityRef.current
  })

  return (
    <mesh ref={meshRef} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.8, 16]} />
      <meshBasicMaterial
        color={COLORS.magenta}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

// ============================================
// WIN PARTICLES - Only rendered during win
// ============================================
function WinParticles({ x, z, active, isJackpot }: { x: number; z: number; active: boolean; isJackpot: boolean }) {
  const particlesRef = useRef<THREE.Points>(null!)
  const particleCount = isJackpot ? 80 : 40
  const startTime = useRef(0)
  const initialized = useRef(false)

  // Pre-allocate geometry ONCE
  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    const goldColor = new THREE.Color(COLORS.gold)
    const cyanColor = new THREE.Color(COLORS.cyan)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = 0
      positions[i3 + 1] = -100 // Hidden
      positions[i3 + 2] = 0

      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      velocities[i3] = Math.cos(angle) * speed * 0.5
      velocities[i3 + 1] = 3 + Math.random() * 3
      velocities[i3 + 2] = Math.sin(angle) * speed * 0.5

      const color = i % 3 === 0 ? cyanColor : goldColor
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return { geometry: geo, velocities }
  }, [particleCount])

  useFrame((state, delta) => {
    if (!particlesRef.current) return

    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array

    if (active) {
      // Initialize on first active frame
      if (!initialized.current) {
        initialized.current = true
        startTime.current = state.clock.elapsedTime
        // Reset positions to center
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3
          posArray[i3] = 0
          posArray[i3 + 1] = 1
          posArray[i3 + 2] = 0
          // Reset velocities
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 4
          velocities[i3] = Math.cos(angle) * speed * 0.5
          velocities[i3 + 1] = 3 + Math.random() * 3
          velocities[i3 + 2] = Math.sin(angle) * speed * 0.5
        }
      }

      // Update particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        posArray[i3] += velocities[i3] * delta
        posArray[i3 + 1] += velocities[i3 + 1] * delta
        posArray[i3 + 2] += velocities[i3 + 2] * delta
        velocities[i3 + 1] -= 6 * delta // Gravity
      }
      posAttr.needsUpdate = true
    } else {
      // Reset when inactive
      if (initialized.current) {
        initialized.current = false
        for (let i = 0; i < particleCount; i++) {
          posArray[i * 3 + 1] = -100 // Hide
        }
        posAttr.needsUpdate = true
      }
    }
  })

  return (
    <points ref={particlesRef} geometry={geometry} position={[x, 0, z]}>
      <pointsMaterial
        size={isJackpot ? 0.12 : 0.08}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

// ============================================
// WIN TEXT - Canvas texture, only when active
// ============================================
function WinText({ x, z, active, isJackpot }: { x: number; z: number; active: boolean; isJackpot: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const time = useRef(0)

  // Create texture ONCE
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 256, 64)
    ctx.shadowColor = COLORS.gold
    ctx.shadowBlur = 15
    ctx.font = 'bold 36px system-ui'
    ctx.fillStyle = COLORS.gold
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(isJackpot ? 'JACKPOT!' : 'WINNER!', 128, 32)
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [isJackpot])

  // Cleanup texture on unmount (prevent memory leak)
  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useFrame((_, delta) => {
    if (!active || !meshRef.current) return
    time.current += delta
    meshRef.current.position.y = 3 + Math.sin(time.current * 5) * 0.1
    const s = 1 + Math.sin(time.current * 8) * 0.1
    meshRef.current.scale.set(s, s, 1)
  })

  if (!active) return null

  return (
    <mesh ref={meshRef} position={[x, 3, z + 1]}>
      <planeGeometry args={[2, 0.5]} />
      <meshBasicMaterial
        map={texture}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ============================================
// SINGLE ACTIVATION LIGHT - One per active machine
// ============================================
function ActivationLight({ x, z, active }: { x: number; z: number; active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null!)
  const intensityRef = useRef(0)

  useFrame((_, delta) => {
    if (!lightRef.current) return
    const target = active ? 2 : 0
    intensityRef.current += (target - intensityRef.current) * delta * 8
    lightRef.current.intensity = intensityRef.current
  })

  return (
    <pointLight
      ref={lightRef}
      position={[x, 2, z + 1]}
      color={COLORS.magenta}
      intensity={0}
      distance={6}
    />
  )
}

// ============================================
// WIN FLASH - Screen flash effect on win
// ============================================
function WinFlash({ x, z, active, isJackpot }: { x: number; z: number; active: boolean; isJackpot: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const startTime = useRef(0)
  const wasActive = useRef(false)

  useFrame((state) => {
    if (!meshRef.current) return

    const mat = meshRef.current.material as THREE.MeshBasicMaterial

    // Detect win start
    if (active && !wasActive.current) {
      startTime.current = state.clock.elapsedTime
    }
    wasActive.current = active

    if (active) {
      const elapsed = state.clock.elapsedTime - startTime.current
      // Quick flash then fade
      if (elapsed < 0.15) {
        // Flash in
        mat.opacity = Math.min(elapsed / 0.08, isJackpot ? 0.8 : 0.5)
      } else if (elapsed < 0.5) {
        // Fade out
        const fadeProgress = (elapsed - 0.15) / 0.35
        mat.opacity = (isJackpot ? 0.8 : 0.5) * (1 - fadeProgress)
      } else {
        mat.opacity = 0
      }

      // Strobe effect for jackpot
      if (isJackpot && elapsed > 0.5 && elapsed < 2) {
        const strobe = Math.sin(elapsed * 20) > 0.7 ? 0.3 : 0
        mat.opacity = strobe
      }
    } else {
      mat.opacity = 0
    }
  })

  return (
    <mesh ref={meshRef} position={[x, 3, z + 1.5]}>
      <planeGeometry args={[8, 6]} />
      <meshBasicMaterial
        color={isJackpot ? COLORS.gold : COLORS.cyan}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ============================================
// COMBINED - Minimal, optimized
// ============================================
export function SlotMachineEffects({
  position,
  isNear,
  isWin,
  isJackpot
}: {
  position: [number, number, number]
  label: string
  isNear: boolean
  isSpinning: boolean
  isWin: boolean
  isJackpot: boolean
}) {
  const [x, , z] = position

  return (
    <>
      {/* Floor glow - always rendered, animated via opacity */}
      <PodiumGlow x={x} z={z} active={isNear || isWin} />

      {/* Single point light per machine */}
      <ActivationLight x={x} z={z} active={isNear} />

      {/* Win effects - only when winning */}
      <WinFlash x={x} z={z} active={isWin} isJackpot={isJackpot} />
      <WinParticles x={x} z={z} active={isWin} isJackpot={isJackpot} />
      <WinText x={x} z={z} active={isWin} isJackpot={isJackpot} />
    </>
  )
}
