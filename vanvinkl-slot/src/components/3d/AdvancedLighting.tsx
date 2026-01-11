'use client'

import { RenderingConfig } from '@/config/rendering'

interface AdvancedLightingProps {
  machinePositions: Array<{ id: string; pos: [number, number, number] }>
  nearMachine?: string | null
  config: RenderingConfig
}

/**
 * Casino Lighting - Brighter for better visibility
 *
 * PERFORMANCE: 7 lights total for 60fps
 * - 1 ambient (free) - INCREASED
 * - 1 hemisphere (ambient + ground bounce) - INCREASED
 * - 3 spotlights (key + fill + front) - INCREASED
 * - 2 directional (rim + floor)
 */
export function AdvancedLighting({ machinePositions, nearMachine, config }: AdvancedLightingProps) {
  return (
    <group>
      {/* AMBIENT — Base illumination - BRIGHTER */}
      <ambientLight intensity={2.5} color="#8a7a6a" />

      {/* HEMISPHERE — Sky + ground bounce - BRIGHTER warm tones */}
      <hemisphereLight
        intensity={2.0}
        color="#FFFAF0"
        groundColor="#6a5040"
      />

      {/* KEY LIGHT — Main golden chandelier glow - MUCH BRIGHTER */}
      <spotLight
        position={[0, 15, 0]}
        angle={Math.PI / 1.2}
        penumbra={0.8}
        intensity={15}
        color="#FFE4B5"
        castShadow={false}
      />

      {/* FILL LIGHT — Front player illumination - BRIGHTER */}
      <spotLight
        position={[0, 8, 12]}
        angle={Math.PI / 1.5}
        penumbra={0.9}
        intensity={8}
        color="#FFFAF0"
        castShadow={false}
      />

      {/* FRONT SPOTLIGHT — Illuminate player area */}
      <spotLight
        position={[0, 10, 8]}
        angle={Math.PI / 2}
        penumbra={1}
        intensity={6}
        color="#FFFFFF"
        castShadow={false}
      />

      {/* RIM LIGHT — Back separation - BRIGHTER */}
      <directionalLight
        position={[0, 10, -15]}
        intensity={4}
        color="#FFD700"
      />

      {/* FLOOR BOUNCE — Uplighting for objects */}
      <directionalLight
        position={[0, -5, 0]}
        intensity={1.5}
        color="#FFEEDD"
      />
    </group>
  )
}
