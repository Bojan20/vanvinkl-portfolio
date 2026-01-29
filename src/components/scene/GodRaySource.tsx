/**
 * GodRaySource - Emissive mesh for volumetric lighting
 */

interface GodRaySourceProps {
  position: [number, number, number]
  color?: string
  intensity?: number
}

export function GodRaySource({ position, color = '#ffffff' }: GodRaySourceProps) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}
