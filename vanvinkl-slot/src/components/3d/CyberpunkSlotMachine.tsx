'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface CyberpunkSlotMachineProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  machineId: string
  label: string
  isActive?: boolean
  onInteract?: () => void
}

/**
 * Cyberpunk Neon Slot Machine
 *
 * Based on reference image:
 * - Tall cabinet (4.5m height feel)
 * - Magenta/Cyan neon LED strips on sides
 * - Top plasma screen with lightning effect
 * - 5-reel display in middle
 * - Cyan info panel at bottom
 * - Chrome/silver metallic frame
 * - Side lever with glowing ball
 */
export function CyberpunkSlotMachine({
  position,
  rotation = [0, 0, 0],
  machineId,
  label,
  isActive = false,
  onInteract
}: CyberpunkSlotMachineProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const ledLeftRef = useRef<THREE.Group>(null!)
  const ledRightRef = useRef<THREE.Group>(null!)
  const plasmaRef = useRef<THREE.Mesh>(null!)
  const reelScreenRef = useRef<THREE.Mesh>(null!)
  const infoScreenRef = useRef<THREE.Mesh>(null!)
  const labelRef = useRef<THREE.Group>(null!)

  // Animation state
  const time = useRef(0)
  const idleFloat = useRef(Math.random() * Math.PI * 2)

  // Machine dimensions (scale 1 = 1 meter)
  const SCALE = 1.5 // Overall scale
  const WIDTH = 1.4 * SCALE
  const HEIGHT = 3.2 * SCALE
  const DEPTH = 0.9 * SCALE

  // Section heights
  const LOWER_H = HEIGHT * 0.22
  const MID_H = HEIGHT * 0.38
  const UPPER_H = HEIGHT * 0.30
  const BASE_H = HEIGHT * 0.10

  useFrame((state, delta) => {
    if (!groupRef.current) return

    time.current += delta
    const t = time.current

    // Subtle idle float
    idleFloat.current += delta * 0.5
    const floatY = Math.sin(idleFloat.current) * 0.02
    groupRef.current.position.y = position[1] + floatY

    // LED chase animation
    if (ledLeftRef.current && ledRightRef.current) {
      const children = [...ledLeftRef.current.children, ...ledRightRef.current.children]
      children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial
          const phase = i * 0.15
          const wave = Math.sin(t * 8 - phase)
          const intensity = isActive
            ? (wave * 0.4 + 0.6) * 2.5
            : (wave * 0.3 + 0.5) * 1.5
          mat.emissiveIntensity = intensity
        }
      })
    }

    // Plasma screen lightning effect
    if (plasmaRef.current) {
      const mat = plasmaRef.current.material as THREE.MeshStandardMaterial
      const flicker1 = Math.sin(t * 15) * Math.cos(t * 23)
      const flicker2 = Math.sin(t * 31)
      const burst = flicker1 > 0.7 ? 1.5 : 1.0
      const intensity = (0.7 + flicker2 * 0.3) * burst
      mat.emissiveIntensity = isActive ? intensity * 2.5 : intensity * 1.5
    }

    // Reel screen pulse
    if (reelScreenRef.current) {
      const mat = reelScreenRef.current.material as THREE.MeshStandardMaterial
      const pulse = Math.sin(t * 2) * 0.1 + 0.9
      mat.emissiveIntensity = isActive ? pulse * 2.0 : pulse * 1.2
    }

    // Info screen pulse
    if (infoScreenRef.current) {
      const mat = infoScreenRef.current.material as THREE.MeshStandardMaterial
      const pulse = Math.sin(t * 1.5) * 0.15 + 0.85
      mat.emissiveIntensity = isActive ? pulse * 2.5 : pulse * 1.5
    }

    // Label billboard + bounce when active
    if (labelRef.current) {
      labelRef.current.lookAt(state.camera.position)
      if (isActive) {
        const bounce = Math.sin(t * 6) * 0.1
        labelRef.current.scale.setScalar(1.3 + bounce * 0.2)
        labelRef.current.position.y = HEIGHT + 0.6 + bounce * 0.15
      } else {
        const gentle = Math.sin(t * 2) * 0.05
        labelRef.current.scale.setScalar(1.0)
        labelRef.current.position.y = HEIGHT + 0.4 + gentle
      }
    }
  })

  // Materials
  const bodyMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#0a0a10"
      metalness={0.92}
      roughness={0.18}
      envMapIntensity={1.2}
    />
  ), [])

  const chromeMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#b8bcc8"
      metalness={1.0}
      roughness={0.08}
      envMapIntensity={2.0}
    />
  ), [])

  const silverMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#8a8d96"
      metalness={0.95}
      roughness={0.15}
      envMapIntensity={1.5}
    />
  ), [])

  // Neon colors
  const MAGENTA = '#ff00aa'
  const CYAN = '#00ffff'
  const BLUE = '#4488ff'

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* === BASE PLATFORM === */}
      <RoundedBox args={[WIDTH + 0.15, BASE_H, DEPTH + 0.1]} radius={0.03} position={[0, BASE_H / 2, 0]}>
        {silverMaterial}
      </RoundedBox>

      {/* Base glow strip - cyan */}
      <mesh position={[0, 0.02, DEPTH / 2 + 0.03]}>
        <boxGeometry args={[WIDTH, 0.03, 0.02]} />
        <meshStandardMaterial
          color={CYAN}
          emissive={CYAN}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* === LOWER SECTION (Info Panel) === */}
      <RoundedBox
        args={[WIDTH, LOWER_H, DEPTH]}
        radius={0.02}
        position={[0, BASE_H + LOWER_H / 2, 0]}
      >
        {bodyMaterial}
      </RoundedBox>

      {/* Lower front panel */}
      <RoundedBox
        args={[WIDTH - 0.05, LOWER_H * 0.9, 0.03]}
        radius={0.01}
        position={[0, BASE_H + LOWER_H / 2, DEPTH / 2]}
      >
        {silverMaterial}
      </RoundedBox>

      {/* Info screen - CYAN glow */}
      <mesh
        ref={infoScreenRef}
        position={[0, BASE_H + LOWER_H * 0.6, DEPTH / 2 + 0.02]}
      >
        <planeGeometry args={[WIDTH * 0.7, LOWER_H * 0.4]} />
        <meshStandardMaterial
          color="#001a20"
          emissive={CYAN}
          emissiveIntensity={1.5}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* === MIDDLE SECTION (5-Reel Display) === */}
      <RoundedBox
        args={[WIDTH, MID_H, DEPTH]}
        radius={0.02}
        position={[0, BASE_H + LOWER_H + MID_H / 2, 0]}
      >
        {bodyMaterial}
      </RoundedBox>

      {/* Reel frame - chrome */}
      <RoundedBox
        args={[WIDTH * 0.9, MID_H * 0.75, 0.06]}
        radius={0.02}
        position={[0, BASE_H + LOWER_H + MID_H / 2, DEPTH / 2 + 0.01]}
      >
        {chromeMaterial}
      </RoundedBox>

      {/* Reel screen - bright */}
      <mesh
        ref={reelScreenRef}
        position={[0, BASE_H + LOWER_H + MID_H / 2, DEPTH / 2 + 0.05]}
      >
        <planeGeometry args={[WIDTH * 0.85, MID_H * 0.65]} />
        <meshStandardMaterial
          color="#101520"
          emissive="#aaccff"
          emissiveIntensity={1.2}
          metalness={0.3}
          roughness={0.3}
        />
      </mesh>

      {/* Reel dividers (5 reels = 4 dividers) */}
      {[1, 2, 3, 4].map(i => {
        const x = -WIDTH * 0.425 + i * (WIDTH * 0.85 / 5)
        return (
          <mesh key={i} position={[x, BASE_H + LOWER_H + MID_H / 2, DEPTH / 2 + 0.06]}>
            <boxGeometry args={[0.015, MID_H * 0.6, 0.02]} />
            {chromeMaterial}
          </mesh>
        )
      })}

      {/* Glass overlay */}
      <mesh position={[0, BASE_H + LOWER_H + MID_H / 2, DEPTH / 2 + 0.08]}>
        <planeGeometry args={[WIDTH * 0.83, MID_H * 0.63]} />
        <MeshTransmissionMaterial
          backside={false}
          samples={4}
          thickness={0.1}
          chromaticAberration={0.02}
          anisotropy={0.1}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          transmission={0.95}
          roughness={0.05}
          color="#0a1520"
        />
      </mesh>

      {/* === UPPER SECTION (Plasma Screen) === */}
      <RoundedBox
        args={[WIDTH + 0.1, UPPER_H, DEPTH * 0.75]}
        radius={0.02}
        position={[0, BASE_H + LOWER_H + MID_H + UPPER_H / 2, -DEPTH * 0.05]}
      >
        {bodyMaterial}
      </RoundedBox>

      {/* Purple accent top */}
      <mesh position={[0, BASE_H + LOWER_H + MID_H + UPPER_H - 0.03, -DEPTH * 0.05]}>
        <boxGeometry args={[WIDTH + 0.15, 0.06, DEPTH * 0.8]} />
        <meshStandardMaterial
          color="#2a0535"
          metalness={0.85}
          roughness={0.1}
          emissive="#8800aa"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Plasma screen frame */}
      <RoundedBox
        args={[WIDTH * 0.88, UPPER_H * 0.7, 0.05]}
        radius={0.02}
        position={[0, BASE_H + LOWER_H + MID_H + UPPER_H / 2, DEPTH * 0.32]}
      >
        {chromeMaterial}
      </RoundedBox>

      {/* Plasma screen - BLUE lightning */}
      <mesh
        ref={plasmaRef}
        position={[0, BASE_H + LOWER_H + MID_H + UPPER_H / 2, DEPTH * 0.35]}
      >
        <planeGeometry args={[WIDTH * 0.82, UPPER_H * 0.6]} />
        <meshStandardMaterial
          color="#001030"
          emissive={BLUE}
          emissiveIntensity={1.5}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* === NEON LED STRIPS === */}

      {/* Left magenta strip */}
      <group ref={ledLeftRef} position={[-WIDTH / 2 - 0.04, 0, DEPTH / 2 - 0.05]}>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[0, BASE_H + 0.15 + i * 0.22, 0]}>
            <capsuleGeometry args={[0.018, 0.08, 4, 8]} />
            <meshStandardMaterial
              color={MAGENTA}
              emissive={MAGENTA}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Right magenta strip */}
      <group ref={ledRightRef} position={[WIDTH / 2 + 0.04, 0, DEPTH / 2 - 0.05]}>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[0, BASE_H + 0.15 + i * 0.22, 0]}>
            <capsuleGeometry args={[0.018, 0.08, 4, 8]} />
            <meshStandardMaterial
              color={MAGENTA}
              emissive={MAGENTA}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Inner cyan LEDs around reel area */}
      {[-1, 1].map(side => (
        <group key={side} position={[side * (WIDTH / 2 - 0.06), 0, DEPTH / 2 + 0.02]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[0, BASE_H + LOWER_H + 0.1 + i * 0.12, 0]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial
                color={CYAN}
                emissive={CYAN}
                emissiveIntensity={isActive ? 3 : 1.5}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Top blue accent LEDs */}
      <group position={[0, BASE_H + LOWER_H + MID_H + UPPER_H + 0.02, DEPTH * 0.25]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[(i - 3.5) * 0.15, 0, 0]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial
              color={BLUE}
              emissive={BLUE}
              emissiveIntensity={isActive ? 4 : 2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* === LEVER (Right side) === */}
      <group position={[WIDTH / 2 + 0.12, BASE_H + LOWER_H + MID_H / 2, 0]}>
        {/* Mount */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
          {chromeMaterial}
        </mesh>

        {/* Shaft */}
        <mesh position={[0.04, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 12]} />
          {silverMaterial}
        </mesh>

        {/* Ball - glowing */}
        <mesh position={[0.04, 0.62, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#1a2040"
            metalness={0.6}
            roughness={0.2}
            emissive={BLUE}
            emissiveIntensity={isActive ? 1.5 : 0.5}
          />
        </mesh>
      </group>

      {/* === FLOATING LABEL === */}
      <group ref={labelRef} position={[0, HEIGHT + 0.4, 0]}>
        {/* Background glow */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[label.length * 0.18 + 1.0, 0.6]} />
          <meshStandardMaterial
            color={isActive ? '#0a0820' : '#050510'}
            emissive={isActive ? CYAN : '#FFD700'}
            emissiveIntensity={isActive ? 0.8 : 0.4}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Border */}
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[label.length * 0.18 + 1.1, 0.7]} />
          <meshBasicMaterial
            color={isActive ? CYAN : '#FFD700'}
            transparent
            opacity={isActive ? 0.9 : 0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Text */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.28}
          color={isActive ? CYAN : '#FFD700'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
          font="/fonts/Inter-Bold.ttf"
        >
          {label.toUpperCase()}
          <meshBasicMaterial
            color={isActive ? CYAN : '#FFD700'}
            toneMapped={false}
          />
        </Text>

        {/* Glow light */}
        {isActive && (
          <pointLight
            position={[0, 0, 0.5]}
            color={CYAN}
            intensity={5}
            distance={6}
            decay={2}
          />
        )}
      </group>

      {/* === ACCENT LIGHTS === */}

      {/* Main front light - magenta tint */}
      <pointLight
        position={[0, BASE_H + LOWER_H + MID_H / 2, DEPTH / 2 + 1.5]}
        color={isActive ? MAGENTA : '#ff6688'}
        intensity={isActive ? 15 : 6}
        distance={10}
        decay={2}
      />

      {/* Plasma screen light - cyan */}
      <pointLight
        position={[0, BASE_H + LOWER_H + MID_H + UPPER_H / 2, DEPTH * 0.6]}
        color={CYAN}
        intensity={isActive ? 10 : 4}
        distance={8}
        decay={2}
      />

      {/* Underglow - cyan */}
      <pointLight
        position={[0, 0.1, DEPTH / 2 + 0.4]}
        color={CYAN}
        intensity={isActive ? 8 : 3}
        distance={6}
        decay={2}
      />

      {/* Side magenta lights */}
      {[-1, 1].map(side => (
        <pointLight
          key={side}
          position={[side * (WIDTH / 2 + 0.3), BASE_H + LOWER_H + MID_H / 2, DEPTH / 2 + 0.3]}
          color={MAGENTA}
          intensity={isActive ? 6 : 2}
          distance={5}
          decay={2}
        />
      ))}
    </group>
  )
}
