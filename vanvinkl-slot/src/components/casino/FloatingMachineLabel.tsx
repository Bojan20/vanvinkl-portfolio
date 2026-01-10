'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface FloatingMachineLabelProps {
  label: string
  position: [number, number, number]
  isNear: boolean
  isActive?: boolean
}

/**
 * Large, cartoon-style floating labels above slot machines
 *
 * Features:
 * - Idle: Gentle float animation
 * - Near: Scale up + glow + bounce
 * - Active: Pulse animation
 */
export function FloatingMachineLabel({
  label,
  position,
  isNear,
  isActive = false
}: FloatingMachineLabelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const textRef = useRef<any>(null!)
  const timeRef = useRef(0)

  // Colors
  const idleColor = useMemo(() => new THREE.Color('#FFD700'), []) // Gold
  const nearColor = useMemo(() => new THREE.Color('#00FF88'), []) // Bright cyan
  const activeColor = useMemo(() => new THREE.Color('#FF6B00'), []) // Orange

  useFrame((state, delta) => {
    if (!groupRef.current) return

    timeRef.current += delta

    if (isNear) {
      // PROXIMITY: Scale up + bounce
      const bounce = Math.sin(timeRef.current * 8) * 0.1
      groupRef.current.scale.setScalar(1.5 + bounce)
      groupRef.current.position.y = position[1] + 3.5 + bounce * 0.5
    } else {
      // IDLE: Gentle float
      const float = Math.sin(timeRef.current * 2) * 0.2
      groupRef.current.scale.setScalar(1.0)
      groupRef.current.position.y = position[1] + 3 + float
    }

    // Always face camera
    groupRef.current.lookAt(state.camera.position)
  })

  const currentColor = isNear ? nearColor : isActive ? activeColor : idleColor
  const emissiveIntensity = isNear ? 2.0 : isActive ? 1.5 : 0.8

  return (
    <group ref={groupRef} position={[position[0], position[1] + 8, position[2]]}>
      {/* Background card (cartoon style) - LARGER */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[label.length * 0.5 + 2, 1.8]} />
        <meshStandardMaterial
          color={isNear ? '#2a1a3e' : '#0f0f18'}
          metalness={0.3}
          roughness={0.7}
          emissive={currentColor}
          emissiveIntensity={isNear ? 0.5 : 0.2}
        />
      </mesh>

      {/* Border glow - STRONGER */}
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[label.length * 0.5 + 2.2, 2.0]} />
        <meshBasicMaterial
          color={currentColor}
          transparent
          opacity={isNear ? 0.8 : 0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Text (MUCH LARGER, high contrast) */}
      <Text
        ref={textRef}
        position={[0, 0, 0]}
        fontSize={1.0}
        color={currentColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="#000000"
      >
        {label.toUpperCase()}
        <meshStandardMaterial
          color={currentColor}
          emissive={currentColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0}
          roughness={0.3}
        />
      </Text>

      {/* Point light when near */}
      {isNear && (
        <pointLight
          position={[0, 0, 0.5]}
          color={nearColor}
          intensity={3}
          distance={8}
          decay={2}
        />
      )}
    </group>
  )
}
