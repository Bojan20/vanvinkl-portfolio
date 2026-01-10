'use client'

import { RenderingConfig } from '@/config/rendering'

interface AdvancedLightingProps {
  machinePositions: Array<{ id: string; pos: [number, number, number] }>
  nearMachine?: string | null
  config: RenderingConfig
}

/**
 * Ultra-Optimized Casino Lighting
 *
 * PERFORMANCE: Only 5 lights total for 60fps
 * - 1 ambient (free)
 * - 1 hemisphere (ambient + ground bounce)
 * - 2 spotlights (key + fill)
 * - 1 directional (rim)
 *
 * Removed: per-machine lights, volumetric, GSAP animations
 * Environment lightformers handle reflections without real-time cost
 */
export function AdvancedLighting({ machinePositions, nearMachine, config }: AdvancedLightingProps) {
  return (
    <group>
      {/* AMBIENT — Base illumination (virtually free) */}
      <ambientLight intensity={1.0} color="#5a4a3a" />

      {/* HEMISPHERE — Sky + ground bounce (single light, two colors) */}
      <hemisphereLight
        intensity={1.2}
        color="#FFF8E7"
        groundColor="#4a3020"
      />

      {/* KEY LIGHT — Main golden chandelier glow */}
      <spotLight
        position={[0, 15, 0]}
        angle={Math.PI / 1.2}
        penumbra={0.8}
        intensity={8}
        color="#FFE4B5"
        castShadow={false}
      />

      {/* FILL LIGHT — Front player illumination */}
      <spotLight
        position={[0, 8, 12]}
        angle={Math.PI / 1.5}
        penumbra={0.9}
        intensity={4}
        color="#FFFAF0"
        castShadow={false}
      />

      {/* RIM LIGHT — Back separation */}
      <directionalLight
        position={[0, 10, -15]}
        intensity={2}
        color="#FFD700"
      />
    </group>
  )
}
