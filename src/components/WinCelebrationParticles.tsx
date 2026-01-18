/**
 * WIN CELEBRATION PARTICLES - GPU Optimized
 *
 * Performance rules:
 * - ALL animation done on GPU via shaders
 * - Pre-allocated buffers, zero per-frame allocations
 * - Single Points object, minimal draw calls
 * - Time-based animation (no JS physics)
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WinCelebrationParticlesProps {
  position: [number, number, number]
  active: boolean
  isJackpot?: boolean
}

const PARTICLE_COUNT = 200
const JACKPOT_PARTICLE_COUNT = 400

// Pre-create shader material ONCE
const createCelebrationMaterial = (isJackpot: boolean) => new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    active: { value: 0 },
    isJackpot: { value: isJackpot ? 1.0 : 0.0 }
  },
  vertexShader: `
    attribute float size;
    attribute vec3 velocity;
    attribute float phase;
    attribute vec3 particleColor;

    uniform float time;
    uniform float active;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = particleColor;

      // Time-based animation - GPU handles ALL physics
      float t = mod(time + phase, 3.0); // 3 second loop
      float progress = t / 3.0;

      // Explosion outward + gravity
      vec3 pos = position;
      pos += velocity * t * 2.0;
      pos.y += velocity.y * t * 3.0 - 4.9 * t * t; // gravity

      // Fade out over time
      vAlpha = active * (1.0 - progress) * (1.0 - progress);

      // Scale particles
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (200.0 / -mvPosition.z) * (1.0 - progress * 0.5);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Circular particle with soft edge
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;

      float alpha = vAlpha * (1.0 - dist * 2.0);
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false
})

export function WinCelebrationParticles({ position, active, isJackpot = false }: WinCelebrationParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const startTime = useRef(0)
  const wasActive = useRef(false)

  const count = isJackpot ? JACKPOT_PARTICLE_COUNT : PARTICLE_COUNT

  // Create geometry with all attributes ONCE
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    // Cyberpunk celebration colors
    const colorPalette = isJackpot
      ? [
          new THREE.Color('#ffd700'), // Gold
          new THREE.Color('#ffaa00'), // Orange gold
          new THREE.Color('#ffffff'), // White sparkle
          new THREE.Color('#ff00aa'), // Magenta
        ]
      : [
          new THREE.Color('#00ffff'), // Cyan
          new THREE.Color('#ff00aa'), // Magenta
          new THREE.Color('#8844ff'), // Purple
          new THREE.Color('#ffffff'), // White
        ]

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Initial position at center
      positions[i3] = 0
      positions[i3 + 1] = 0
      positions[i3 + 2] = 0

      // Random explosion velocity (spherical)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 1 + Math.random() * 3
      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i3 + 1] = Math.cos(phi) * speed * 1.5 + 2 // Upward bias
      velocities[i3 + 2] = Math.sin(phi) * Math.sin(theta) * speed

      // Random size
      sizes[i] = 0.08 + Math.random() * 0.15

      // Random phase offset for staggered animation
      phases[i] = Math.random() * 0.5

      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('particleColor', new THREE.BufferAttribute(colors, 3))

    const mat = createCelebrationMaterial(isJackpot)

    return { geometry: geo, material: mat }
  }, [count, isJackpot])

  useFrame((state) => {
    if (!pointsRef.current) return

    // Detect activation
    if (active && !wasActive.current) {
      startTime.current = state.clock.elapsedTime
    }
    wasActive.current = active

    // Update shader uniforms - minimal overhead
    material.uniforms.active.value = active ? 1.0 : 0.0
    material.uniforms.time.value = active
      ? state.clock.elapsedTime - startTime.current
      : 0
  })

  return (
    <points
      ref={pointsRef}
      position={position}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  )
}

// Jackpot variant with more particles and different colors
export function JackpotCelebration({ position, active }: { position: [number, number, number], active: boolean }) {
  return <WinCelebrationParticles position={position} active={active} isJackpot />
}
