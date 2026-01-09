'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface SlotMachineRealisticProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  machineId: string
  label: string
  isActive?: boolean
  onInteract?: (machineId: string) => void
}

// Realistic reel symbols
const SYMBOLS = ['🍒', '💎', '⭐', '🍋', '7️⃣', '🔔', '💰', '🍇']

export function SlotMachineRealistic({
  position,
  rotation = [0, 0, 0],
  machineId,
  label,
  isActive = false,
  onInteract
}: SlotMachineRealisticProps) {
  const groupRef = useRef<THREE.Group>(null)
  const reel1Ref = useRef<THREE.Group>(null)
  const reel2Ref = useRef<THREE.Group>(null)
  const reel3Ref = useRef<THREE.Group>(null)

  const [isSpinning, setIsSpinning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const spinSpeed = useRef([0, 0, 0])
  const targetRotation = useRef([0, 0, 0])

  useFrame((state, delta) => {
    // Idle float animation
    if (groupRef.current && isActive && !isSpinning) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.03
    }

    // Reel spinning physics
    if (isSpinning) {
      const refs = [reel1Ref, reel2Ref, reel3Ref]
      refs.forEach((ref, i) => {
        if (ref.current) {
          // Deceleration curve
          spinSpeed.current[i] *= 0.97
          ref.current.rotation.x += spinSpeed.current[i] * delta

          // Stop when slow enough
          if (spinSpeed.current[i] < 0.5 && i === 2) {
            setIsSpinning(false)
            spinSpeed.current = [0, 0, 0]
          }
        }
      })
    }
  })

  // Memoized materials
  const cabinetMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#a00000"
      metalness={0.85}
      roughness={0.15}
    />
  ), [])

  const screenMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#000000"
      emissive={isActive ? "#2a4a7f" : "#0a0a0a"}
      emissiveIntensity={isActive ? 0.5 : 0.1}
      metalness={0.2}
      roughness={0.1}
    />
  ), [isActive])

  const goldMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#d4af37"
      metalness={0.95}
      roughness={0.1}
    />
  ), [])

  const reelMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#e8e8e8"
      metalness={0.1}
      roughness={0.6}
    />
  ), [])

  const handleClick = () => {
    if (isSpinning) return
    setIsSpinning(true)
    spinSpeed.current = [25 + Math.random() * 5, 27 + Math.random() * 5, 29 + Math.random() * 5]
    onInteract?.(machineId)
  }

  // Create reel with symbols
  const createReel = (ref: React.RefObject<THREE.Group | null>, offset: number) => (
    <group ref={ref} position={[offset, 0, 0]}>
      {/* Reel cylinder */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 1.4, 32]} />
        {reelMaterial}
      </mesh>

      {/* Symbols around cylinder */}
      {SYMBOLS.map((symbol, i) => {
        const angle = (i / SYMBOLS.length) * Math.PI * 2
        const radius = 0.19
        return (
          <Text
            key={i}
            position={[
              Math.sin(angle) * radius,
              0,
              Math.cos(angle) * radius
            ]}
            rotation={[0, -angle, 0]}
            fontSize={0.22}
            anchorX="center"
            anchorY="middle"
          >
            {symbol}
          </Text>
        )
      })}
    </group>
  )

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main Cabinet - Premium Design */}
      <RoundedBox
        args={[1.5, 2.8, 1.1]}
        radius={0.1}
        smoothness={4}
      >
        <meshStandardMaterial
          color="#8a0000"
          metalness={0.92}
          roughness={0.12}
          envMapIntensity={1.5}
        />
      </RoundedBox>

      {/* Chrome Side Accents */}
      <RoundedBox
        args={[0.08, 2.6, 1.05]}
        radius={0.04}
        position={[-0.72, 0, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.98}
          roughness={0.05}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.08, 2.6, 1.05]}
        radius={0.04}
        position={[0.72, 0, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.98}
          roughness={0.05}
        />
      </RoundedBox>

      {/* Glass Screen Bezel */}
      <RoundedBox
        args={[1.15, 1.55, 0.08]}
        radius={0.05}
        position={[0, 0.45, 0.52]}
      >
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.95}
          roughness={0.08}
        />
      </RoundedBox>

      {/* Screen with Glow */}
      <RoundedBox
        args={[1.05, 1.45, 0.06]}
        radius={0.03}
        position={[0, 0.45, 0.56]}
      >
        <meshStandardMaterial
          color="#000000"
          emissive={isActive ? "#2a5a8f" : "#0a0a0a"}
          emissiveIntensity={isActive ? 0.8 : 0.15}
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.95}
        />
      </RoundedBox>

      {/* LED Strip Top */}
      <RoundedBox
        args={[1.4, 0.05, 0.15]}
        radius={0.02}
        position={[0, 1.35, 0.5]}
      >
        <meshStandardMaterial
          color={isActive ? "#40c8ff" : "#1a3a4f"}
          emissive={isActive ? "#40c8ff" : "#0a1a2f"}
          emissiveIntensity={isActive ? 1.2 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </RoundedBox>

      {/* LED Strip Bottom */}
      <RoundedBox
        args={[1.4, 0.05, 0.15]}
        radius={0.02}
        position={[0, -0.45, 0.5]}
      >
        <meshStandardMaterial
          color={isActive ? "#ff9040" : "#4f3a1a"}
          emissive={isActive ? "#ff9040" : "#2f1a0a"}
          emissiveIntensity={isActive ? 1.2 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </RoundedBox>

      {/* Reels Container */}
      <group position={[0, 0.45, 0.58]}>
        {createReel(reel1Ref, -0.38)}
        {createReel(reel2Ref, 0)}
        {createReel(reel3Ref, 0.38)}
      </group>

      {/* Premium Control Panel */}
      <RoundedBox
        args={[1.35, 0.65, 0.35]}
        radius={0.06}
        position={[0, -0.75, 0.45]}
        rotation={[-Math.PI / 7, 0, 0]}
      >
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.85}
          roughness={0.25}
        />
      </RoundedBox>

      {/* Gold Trim on Control Panel */}
      <mesh
        position={[0, -0.75, 0.65]}
        rotation={[-Math.PI / 7, 0, 0]}
      >
        <torusGeometry args={[0.28, 0.015, 16, 32]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.98}
          roughness={0.08}
        />
      </mesh>

      {/* Premium Spin Button */}
      <group position={[0, -0.75, 0.68]} rotation={[-Math.PI / 7, 0, 0]}>
        {/* Button Base */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.15, 48]} />
          <meshStandardMaterial
            color={isActive ? "#ff5555" : "#dd0000"}
            metalness={0.6}
            roughness={0.15}
            emissive={isActive ? "#ff2222" : "#880000"}
            emissiveIntensity={isActive ? 0.5 : 0.2}
          />
        </mesh>
        {/* Button Chrome Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.025, 16, 48]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.98}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* Premium Top Sign with Neon Effect */}
      <group position={[0, 1.95, 0]}>
        {/* Sign Base */}
        <RoundedBox args={[1.7, 0.75, 0.22]} radius={0.06}>
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.9}
            roughness={0.2}
          />
        </RoundedBox>

        {/* Gold Inlay */}
        <RoundedBox args={[1.62, 0.68, 0.18]} radius={0.05} position={[0, 0, 0.02]}>
          {goldMaterial}
        </RoundedBox>

        {/* Text with Glow */}
        <Text
          position={[0, 0, 0.14]}
          fontSize={0.24}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
        >
          {label.toUpperCase()}
        </Text>

        {/* Neon Glow Effect */}
        {isActive && (
          <pointLight
            position={[0, 0, 0.3]}
            color="#ffd700"
            intensity={0.8}
            distance={1.5}
          />
        )}
      </group>

      {/* Floating Label Above Machine - Premium */}
      <group position={[0, 3.0, 0]}>
        <Text
          fontSize={0.38}
          color={isActive ? "#40ff90" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#000000"
          letterSpacing={0.05}
        >
          {label.toUpperCase()}
        </Text>
        {/* Glow behind text */}
        {isActive && (
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[3, 0.6]} />
            <meshBasicMaterial
              color="#40ff90"
              transparent
              opacity={0.15}
            />
          </mesh>
        )}
      </group>

      {/* Premium Base with LED Strip */}
      <RoundedBox
        args={[1.6, 0.28, 1.2]}
        radius={0.05}
        position={[0, -1.48, 0]}
      >
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.88}
          roughness={0.35}
        />
      </RoundedBox>

      {/* Base LED Ring */}
      <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.02, 16, 64]} />
        <meshStandardMaterial
          color={isActive ? "#4a9eff" : "#1a3a5f"}
          emissive={isActive ? "#4a9eff" : "#0a1a2f"}
          emissiveIntensity={isActive ? 1.5 : 0.4}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Proximity indicator - Premium */}
      {isActive && (
        <group position={[0, 3.55, 0]}>
          {/* Glow background */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[2, 0.4]} />
            <meshBasicMaterial
              color="#40ff90"
              transparent
              opacity={0.2}
            />
          </mesh>
          <Text
            fontSize={0.2}
            color="#40ff90"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.018}
            outlineColor="#000000"
            letterSpacing={0.1}
          >
            ⌨ PRESS SPACE ⌨
          </Text>
        </group>
      )}

      {/* Enhanced Point Lights */}
      <pointLight
        position={[0, 0.45, 1.2]}
        color={isActive ? "#4a9eff" : "#2a2a4f"}
        intensity={isActive ? 2.5 : 0.5}
        distance={3.5}
        decay={2}
      />

      <pointLight
        position={[0, -0.75, 1.0]}
        color={isActive ? "#ff9040" : "#4f3a1a"}
        intensity={isActive ? 1.8 : 0.4}
        distance={2.5}
        decay={2}
      />

      {/* Top rim light for dramatic effect */}
      {isActive && (
        <pointLight
          position={[0, 2.5, 0.5]}
          color="#ffd700"
          intensity={1.2}
          distance={2.0}
          decay={2}
        />
      )}
    </group>
  )
}
