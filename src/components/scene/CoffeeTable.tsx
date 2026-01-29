/**
 * CoffeeTable - Modern coffee table with PREMIUM glass top
 */

import { MeshTransmissionMaterial } from '@react-three/drei'
import { SHARED_MATERIALS, COLORS } from './sharedMaterials'
import { NeonStrip } from './NeonStrip'

interface CoffeeTableProps {
  position: [number, number, number]
}

export function CoffeeTable({ position }: CoffeeTableProps) {
  return (
    <group position={position}>
      {/* Premium Glass top - real refraction */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.03, 0.7]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.1}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.05}
          iridescence={0.3}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 400]}
          transmission={1}
          roughness={0.05}
          color="#88ccff"
        />
      </mesh>

      {/* Chrome frame */}
      <mesh position={[0, 0.38, 0]} material={SHARED_MATERIALS.chrome}>
        <boxGeometry args={[1.25, 0.015, 0.75]} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.2, 0]} material={SHARED_MATERIALS.darkMetal}>
        <boxGeometry args={[0.8, 0.38, 0.5]} />
      </mesh>

      {/* Neon ring */}
      <NeonStrip
        color={COLORS.cyan}
        position={[0, 0.01, 0]}
        size={[0.9, 0.01, 0.6]}
      />
    </group>
  )
}
