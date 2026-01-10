'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AnimatedChandelierProps {
  position: [number, number, number]
  swayAmount?: number
  swaySpeed?: number
}

/**
 * Animated Crystal Chandelier with gentle sway
 *
 * Features:
 * - Subtle pendulum sway motion
 * - Offset phases for natural look
 * - 60fps optimized (no per-frame allocations)
 */
export function AnimatedChandelier({
  position,
  swayAmount = 0.02,
  swaySpeed = 0.5
}: AnimatedChandelierProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  // Memoized materials
  const materials = useMemo(() => ({
    brassTrim: (
      <meshStandardMaterial
        color="#B5A642"
        metalness={0.8}
        roughness={0.3}
      />
    ),
    goldTrim: (
      <meshStandardMaterial
        color="#D4AF37"
        metalness={0.85}
        roughness={0.25}
        emissive="#D4AF37"
        emissiveIntensity={0.1}
      />
    ),
    warmGlow: (
      <meshStandardMaterial
        color="#FFF8E7"
        emissive="#FFF8E7"
        emissiveIntensity={2}
        metalness={0}
        roughness={0.2}
      />
    ),
    crystal: (
      <meshStandardMaterial
        color="#ffffff"
        metalness={0.9}
        roughness={0.1}
        emissive="#ffffff"
        emissiveIntensity={0.2}
      />
    )
  }), [])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime

    // Gentle pendulum sway
    const swayX = Math.sin(time * swaySpeed + phaseOffset) * swayAmount
    const swayZ = Math.cos(time * swaySpeed * 0.7 + phaseOffset) * swayAmount * 0.7

    groupRef.current.rotation.x = swayX
    groupRef.current.rotation.z = swayZ
  })

  return (
    <group position={position}>
      {/* Ceiling mount - FIXED (doesn't sway) */}
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 0.2, 16]} />
        {materials.brassTrim}
      </mesh>

      {/* Swaying part starts here */}
      <group ref={groupRef}>
        {/* Chain from ceiling to chandelier body */}
        <mesh position={[0, 10.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
          {materials.goldTrim}
        </mesh>

        {/* Main chandelier body - 3 tiers of lights */}
        {[9, 8.5, 8.0].map((yPos, tier) => (
          <group key={tier} position={[0, yPos, 0]}>
            {/* Tier frame (gold ring) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.6 + tier * 0.2, 0.05, 8, 24]} />
              {materials.goldTrim}
            </mesh>

            {/* Candle-style lights around ring (4 per tier) */}
            {Array.from({ length: 4 }).map((_, j) => {
              const angle = (j / 4) * Math.PI * 2
              const radius = 0.6 + tier * 0.2
              const lx = Math.cos(angle) * radius
              const lz = Math.sin(angle) * radius

              return (
                <group key={j} position={[lx, 0, lz]}>
                  {/* Glowing flame/bulb */}
                  <mesh position={[0, 0.12, 0]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    {materials.warmGlow}
                  </mesh>
                </group>
              )
            })}

            {/* Crystal drops hanging from ring (8 per tier) */}
            {Array.from({ length: 8 }).map((_, j) => {
              const angle = (j / 8) * Math.PI * 2
              const radius = 0.65 + tier * 0.2
              const cx = Math.cos(angle) * radius
              const cz = Math.sin(angle) * radius

              return (
                <mesh key={`crystal-${j}`} position={[cx, -0.2, cz]}>
                  <coneGeometry args={[0.04, 0.2, 4]} />
                  {materials.crystal}
                </mesh>
              )
            })}
          </group>
        ))}

        {/* Central hanging crystal at bottom */}
        <mesh position={[0, 7.2, 0]}>
          <coneGeometry args={[0.15, 0.5, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.1}
            emissive="#ffffff"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </group>
  )
}
