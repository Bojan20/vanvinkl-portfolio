'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AvatarFollowLightProps {
  avatarPositionRef: React.RefObject<THREE.Vector3>
}

/**
 * Dynamic spotlight that follows avatar position
 *
 * AAA Casino Lighting:
 * - Follows avatar from above and slightly behind
 * - Creates dramatic rim lighting
 * - Casts realistic shadows
 * - Warm amber color for luxury casino atmosphere
 */
export function AvatarFollowLight({ avatarPositionRef }: AvatarFollowLightProps) {
  const spotLightRef = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)

  useFrame(() => {
    if (!spotLightRef.current || !targetRef.current || !avatarPositionRef.current) return

    const avatarPos = avatarPositionRef.current

    // Position light above and slightly behind avatar
    spotLightRef.current.position.set(
      avatarPos.x,
      avatarPos.y + 4,  // 4 units above avatar
      avatarPos.z + 2   // 2 units behind (creates rim light)
    )

    // Target is slightly ahead of avatar (lights the path)
    targetRef.current.position.set(
      avatarPos.x,
      avatarPos.y,
      avatarPos.z - 2   // 2 units ahead
    )

    spotLightRef.current.target = targetRef.current
  })

  return (
    <group>
      {/* Main avatar follow spotlight */}
      <spotLight
        ref={spotLightRef}
        color="#FFF8E7"  // Warm white (chandelier color)
        intensity={2.5}
        angle={Math.PI / 3}  // 60 degree cone
        penumbra={0.5}
        distance={20}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
      />

      {/* Target helper object */}
      <primitive object={new THREE.Object3D()} ref={targetRef} />

      {/* Secondary fill light (softer, from front) */}
      <pointLight
        position={[0, 3, 8]}  // Fixed position near camera start
        color="#FF8C00"  // Warm amber
        intensity={1}
        distance={15}
        decay={2}
        castShadow={false}  // Only main spotlight casts shadows
      />
    </group>
  )
}
