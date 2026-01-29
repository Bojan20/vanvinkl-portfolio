/**
 * TrophyRoom - Displays achievements as 3D trophies
 */

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from './sharedMaterials'
import { NeonStrip } from './NeonStrip'
import { achievementStore, type Achievement } from '../../store/achievements'

// Trophy Display - Individual 3D trophy
function Trophy({ achievement, index }: { achievement: Achievement, index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isUnlocked = achievement.unlocked

  useFrame((state) => {
    if (meshRef.current && isUnlocked) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + index * 0.5
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05
    }
  })

  const color = isUnlocked ? COLORS.gold : '#333333'
  const emissive = isUnlocked ? COLORS.gold : '#000000'

  return (
    <group>
      {/* Trophy pedestal */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 8]} />
        <meshStandardMaterial
          color={isUnlocked ? '#1a1a2a' : '#0a0a0f'}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Trophy body */}
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={color}
          metalness={isUnlocked ? 0.9 : 0.2}
          roughness={isUnlocked ? 0.1 : 0.8}
          emissive={emissive}
          emissiveIntensity={isUnlocked ? 0.3 : 0}
        />
      </mesh>

      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <pointLight
          position={[0, 0.5, 0]}
          color={COLORS.gold}
          intensity={0.5}
          distance={1.5}
        />
      )}
    </group>
  )
}

interface TrophyRoomProps {
  position: [number, number, number]
}

export function TrophyRoom({ position }: TrophyRoomProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    const loadAchievements = () => {
      const all = achievementStore.getVisible()
      setAchievements(all.slice(0, 10))
    }
    loadAchievements()

    const interval = setInterval(loadAchievements, 10000)
    return () => clearInterval(interval)
  }, [])

  const cols = 5
  const spacing = 0.7

  return (
    <group position={position}>
      {/* Display case back */}
      <mesh position={[0, 1.2, -0.3]}>
        <boxGeometry args={[4, 2.5, 0.1]} />
        <meshStandardMaterial
          color="#0a0a14"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Glass shelves */}
      {[0.6, 1.5].map((y, shelfIdx) => (
        <mesh key={shelfIdx} position={[0, y, 0]}>
          <boxGeometry args={[3.8, 0.03, 0.5]} />
          <meshStandardMaterial
            color="#88ccff"
            transparent
            opacity={0.15}
            metalness={1}
            roughness={0}
          />
        </mesh>
      ))}

      {/* Trophies */}
      {achievements.map((ach, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = (col - (cols - 1) / 2) * spacing
        const y = row === 0 ? 0.6 : 1.5

        return (
          <group key={ach.id} position={[x, y, 0]}>
            <Trophy achievement={ach} index={i} />
          </group>
        )
      })}

      {/* Neon frame */}
      <NeonStrip color={COLORS.gold} position={[0, 0.1, 0.2]} size={[3.6, 0.02, 0.02]} audioReactive />
      <NeonStrip color={COLORS.gold} position={[0, 2.3, 0.2]} size={[3.6, 0.02, 0.02]} audioReactive />
      <NeonStrip color={COLORS.gold} position={[-1.85, 1.2, 0.2]} size={[0.02, 2.2, 0.02]} audioReactive />
      <NeonStrip color={COLORS.gold} position={[1.85, 1.2, 0.2]} size={[0.02, 2.2, 0.02]} audioReactive />

      {/* Title */}
      <mesh position={[0, 2.6, 0]}>
        <planeGeometry args={[2, 0.3]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.1} />
      </mesh>
    </group>
  )
}
