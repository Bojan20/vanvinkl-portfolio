/**
 * PROXIMITY FEEDBACK - Interactive Hints
 *
 * - Floating "PRESS SPACE" holographic text near interactables
 * - Floor pulse/glow under avatar near objects
 * - Animated, cyberpunk style
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00aa',
  purple: '#8844ff'
}

// Floating holographic text near interactable objects
export function FloatingHint({
  position,
  text = 'PRESS SPACE',
  active,
  color = COLORS.cyan
}: {
  position: [number, number, number]
  text?: string
  active: boolean
  color?: string
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const time = useRef(Math.random() * 100)

  // Create canvas texture for text
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    // Clear
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Glow effect
    ctx.shadowColor = color
    ctx.shadowBlur = 20

    // Text
    ctx.font = 'bold 48px "Orbitron", "Rajdhani", system-ui, sans-serif'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [text, color])

  // Cleanup texture on unmount (prevent memory leak)
  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useFrame((_, delta) => {
    if (!groupRef.current || !active) return

    time.current += delta

    // Floating animation
    groupRef.current.position.y = position[1] + Math.sin(time.current * 3) * 0.1

    // Subtle rotation
    groupRef.current.rotation.y = Math.sin(time.current * 0.5) * 0.1
  })

  if (!active) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Main text plane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.5, 0.6]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Holographic border */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.7, 0.75]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            time: { value: 0 },
            color: { value: new THREE.Color(color) }
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            uniform vec3 color;
            varying vec2 vUv;
            void main() {
              float border = 0.05;
              float alpha = 0.0;

              // Top border
              if (vUv.y > 1.0 - border) alpha = 0.6;
              // Bottom border
              if (vUv.y < border) alpha = 0.6;
              // Left border
              if (vUv.x < border) alpha = 0.6;
              // Right border
              if (vUv.x > 1.0 - border) alpha = 0.6;

              // Scanline effect
              float scanline = sin(vUv.y * 50.0 + time * 5.0) * 0.5 + 0.5;
              alpha *= 0.5 + scanline * 0.5;

              gl_FragColor = vec4(color, alpha * 0.5);
            }
          `}
        />
      </mesh>

      {/* Corner brackets */}
      {[
        [-1.35, 0.38, 0, Math.PI],
        [1.35, 0.38, 0, 0],
        [-1.35, -0.38, 0, Math.PI],
        [1.35, -0.38, 0, 0]
      ].map(([x, y, z, rot], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, rot + (i < 2 ? 0 : Math.PI)]}>
          <planeGeometry args={[0.15, 0.15]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}

      {/* Glow light */}
      <pointLight color={color} intensity={0.5} distance={3} />
    </group>
  )
}

// Floor pulse effect under avatar when near interactable
export function FloorPulse({
  position,
  active,
  color = COLORS.cyan,
  radius = 1.5
}: {
  position: [number, number, number]
  active: boolean
  color?: string
  radius?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const time = useRef(0)

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(color) },
      intensity: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center) * 2.0;

        // Ripple effect
        float ripple1 = sin(dist * 8.0 - time * 4.0) * 0.5 + 0.5;
        float ripple2 = sin(dist * 12.0 - time * 6.0) * 0.5 + 0.5;

        // Fade at edges
        float fade = 1.0 - smoothstep(0.3, 1.0, dist);

        // Combine
        float alpha = (ripple1 * 0.6 + ripple2 * 0.4) * fade * intensity;

        // Grid pattern
        float gridX = step(0.95, fract(vUv.x * 10.0));
        float gridY = step(0.95, fract(vUv.y * 10.0));
        float grid = max(gridX, gridY) * 0.3;

        gl_FragColor = vec4(color, (alpha * 0.6 + grid * fade * intensity * 0.3));
      }
    `
  }), [color])

  useFrame((_, delta) => {
    time.current += delta

    // Animate intensity
    const targetIntensity = active ? 1 : 0
    material.uniforms.intensity.value += (targetIntensity - material.uniforms.intensity.value) * delta * 5

    material.uniforms.time.value = time.current

    if (meshRef.current) {
      meshRef.current.position.x = position[0]
      meshRef.current.position.z = position[2]
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[position[0], 0.02, position[2]]}
    >
      <circleGeometry args={[radius, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// Combined proximity indicator component
// Note: Couch "PRESS SPACE TO SIT" hints are now permanent FloatingSitSign in CasinoScene
export function ProximityIndicator({
  avatarPosition,
  nearMachine,
  nearCouch,
  machinePositions,
  couchPositions
}: {
  avatarPosition: THREE.Vector3
  nearMachine: string | null
  nearCouch: { id: string; x: number; z: number } | null
  machinePositions: { id: string; x: number; z: number }[]
  couchPositions: { id: string; x: number; z: number }[]
}) {
  // Find the nearest machine position (couch hints are permanent in CasinoScene)
  let hintPosition: [number, number, number] | null = null
  let hintText = 'PRESS SPACE'
  let hintColor = COLORS.cyan

  if (nearMachine) {
    const machine = machinePositions.find(m => m.id === nearMachine)
    if (machine) {
      hintPosition = [machine.x, 3.5, machine.z + 1.5]
      const isMobile = window.innerWidth < 768; hintText = isMobile ? 'TAP TO SPIN' : 'PRESS SPACE TO SPIN'
      hintColor = COLORS.magenta
    }
  }
  // Couch hint removed - now permanent FloatingSitSign in CasinoScene

  const isNearAnything = nearMachine !== null || nearCouch !== null

  return (
    <>
      {/* Floor pulse under avatar */}
      <FloorPulse
        position={[avatarPosition.x, 0, avatarPosition.z]}
        active={isNearAnything}
        color={nearMachine ? COLORS.magenta : COLORS.purple}
      />

      {/* Floating hint text - only for machines now */}
      {hintPosition && (
        <FloatingHint
          position={hintPosition}
          text={hintText}
          active={true}
          color={hintColor}
        />
      )}
    </>
  )
}
