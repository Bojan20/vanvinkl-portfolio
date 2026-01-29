/**
 * VIPCouch - Using SHARED materials
 */

import * as THREE from 'three'
import { SHARED_MATERIALS, COLORS } from './sharedMaterials'
import { NeonStrip } from './NeonStrip'

interface VIPCouchProps {
  position: [number, number, number]
  rotation?: number
  material: THREE.Material
}

export function VIPCouch({ position, rotation = 0, material }: VIPCouchProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main seat - plush velvet */}
      <mesh position={[0, 0.35, 0]} material={material}>
        <boxGeometry args={[2.8, 0.45, 1.0]} />
      </mesh>

      {/* Back rest */}
      <mesh position={[0, 0.75, -0.4]} material={material}>
        <boxGeometry args={[2.8, 0.65, 0.25]} />
      </mesh>

      {/* Arm rests */}
      <mesh position={[-1.3, 0.55, 0]} material={material}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
      </mesh>
      <mesh position={[1.3, 0.55, 0]} material={material}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
      </mesh>

      {/* Gold chrome legs - SHARED material */}
      {[[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.35], [1.2, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} material={SHARED_MATERIALS.goldChrome}>
          <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
        </mesh>
      ))}

      {/* Neon accent under couch */}
      <NeonStrip
        color={COLORS.magenta}
        position={[0, 0.08, 0.4]}
        size={[2.4, 0.02, 0.02]}
      />
    </group>
  )
}
