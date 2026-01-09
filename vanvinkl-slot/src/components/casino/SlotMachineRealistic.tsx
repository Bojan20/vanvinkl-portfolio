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
      {/* Main Cabinet - optimized rounded box */}
      <RoundedBox
        args={[1.4, 2.6, 1]}
        radius={0.08}
        smoothness={2}
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        {cabinetMaterial}
      </RoundedBox>

      {/* Screen */}
      <RoundedBox
        args={[1.1, 1.5, 0.1]}
        radius={0.04}
        position={[0, 0.4, 0.51]}
      >
        {screenMaterial}
      </RoundedBox>

      {/* Reels */}
      <group position={[0, 0.4, 0.52]}>
        {createReel(reel1Ref, -0.35)}
        {createReel(reel2Ref, 0)}
        {createReel(reel3Ref, 0.35)}
      </group>

      {/* Control Panel */}
      <RoundedBox
        args={[1.2, 0.6, 0.3]}
        radius={0.04}
        position={[0, -0.7, 0.4]}
        rotation={[-Math.PI / 8, 0, 0]}
      >
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </RoundedBox>

      {/* Spin Button */}
      <mesh
        position={[0, -0.7, 0.6]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <cylinderGeometry args={[0.2, 0.2, 0.12, 32]} />
        <meshStandardMaterial
          color={isHovered ? "#ff4444" : "#cc0000"}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Top Sign */}
      <group position={[0, 1.5, 0]}>
        <RoundedBox args={[1.3, 0.5, 0.15]} radius={0.04}>
          {goldMaterial}
        </RoundedBox>

        <Text
          position={[0, 0, 0.1]}
          fontSize={0.15}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          {label.toUpperCase()}
        </Text>
      </group>

      {/* Base */}
      <RoundedBox
        args={[1.5, 0.25, 1.1]}
        radius={0.04}
        position={[0, -1.4, 0]}
      >
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.4} />
      </RoundedBox>

      {/* Hover prompt */}
      {isHovered && (
        <Text
          position={[0, 2.2, 0]}
          fontSize={0.12}
          color="#40ff90"
          anchorX="center"
          anchorY="middle"
        >
          CLICK TO EXPLORE
        </Text>
      )}

      {/* Point light */}
      <pointLight
        position={[0, 0.4, 0.8]}
        color={isActive ? "#4a9eff" : "#2a2a4f"}
        intensity={isActive ? 1.5 : 0.3}
        distance={2.5}
        decay={2}
      />
    </group>
  )
}
