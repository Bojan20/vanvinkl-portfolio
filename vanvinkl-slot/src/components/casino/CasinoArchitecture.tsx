'use client'

import { useMemo } from 'react'
import { MeshReflectorMaterial, Text } from '@react-three/drei'
import { AnimatedChandelier } from '../3d/AnimatedChandelier'
import * as THREE from 'three'

interface CasinoArchitectureProps {
  animateEntrance?: boolean
}

/**
 * Performance-optimized Casino Architecture
 *
 * - Instanced geometry where possible
 * - Merged static meshes
 * - Simplified collision geometry
 * - Quality-aware detail levels
 */
export function CasinoArchitecture({ animateEntrance }: CasinoArchitectureProps) {

  // VEGAS COLOR PALETTE - Professional luxury (Bellagio/Wynn inspired)
  const COLORS = useMemo(() => ({
    // Primary carpet colors (rich jewel tones)
    burgundy: new THREE.Color('#4A0E0E'), // Deep burgundy (Bellagio signature)
    emerald: new THREE.Color('#0F4C3A'), // Rich emerald green accent

    // Metallics (warm, not bright)
    gold: new THREE.Color('#D4AF37'), // Antique gold (not bright)
    brass: new THREE.Color('#B5A642'), // Aged brass for accents

    // Neutrals (deep, sophisticated)
    charcoal: new THREE.Color('#1C1C1C'), // Charcoal marble
    mahogany: new THREE.Color('#2D1810'), // Rich mahogany wood
    espresso: new THREE.Color('#0A0606'), // Deep espresso floor

    // Accent lighting colors
    amber: new THREE.Color('#FF8C00'), // Warm amber sconces
    warmWhite: new THREE.Color('#FFF8E7') // Soft warm white for chandeliers
  }), [])

  // OPTIMIZED MATERIALS (memoized, reused) - Professional luxury finishes
  const materials = useMemo(() => ({
    // Charcoal marble floor with subtle sheen (Bellagio-style polished marble)
    marbleFloor: (
      <meshStandardMaterial
        color={COLORS.charcoal}
        metalness={0.3}
        roughness={0.15}
        envMapIntensity={0.8}
      />
    ),

    // Rich burgundy Italian textile carpet (Bellagio signature)
    carpet: (
      <meshStandardMaterial
        color={COLORS.burgundy}
        roughness={0.98}
        metalness={0.02}
      />
    ),

    // Emerald green accent pattern (luxury jewel tone)
    carpetPattern: (
      <meshStandardMaterial
        color={COLORS.emerald}
        roughness={0.98}
        metalness={0.02}
        opacity={0.7}
        transparent
      />
    ),

    // Antique gold trim (warm, not bright - Wynn style)
    goldTrim: (
      <meshStandardMaterial
        color={COLORS.gold}
        metalness={0.85}
        roughness={0.25}
        emissive={COLORS.gold}
        emissiveIntensity={0.1}
      />
    ),

    // Aged brass accents (understated elegance)
    brassTrim: (
      <meshStandardMaterial
        color={COLORS.brass}
        metalness={0.8}
        roughness={0.3}
      />
    ),

    // Rich mahogany wood walls (Italian sourced aesthetic)
    woodWall: (
      <meshStandardMaterial
        color={COLORS.mahogany}
        roughness={0.7}
        metalness={0.05}
      />
    )
  }), [COLORS])

  return (
    <group name="casino-architecture">
      {/* FLOOR SYSTEM */}
      <group name="floor-system">
        {/* Base marble floor (simple, no reflections for performance) */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[80, 80]} />
          {materials.marbleFloor}
        </mesh>

        {/* Main crimson carpet (darker, richer) - WIDER for 7-unit spacing */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, -5]}
          receiveShadow
        >
          <planeGeometry args={[38, 22]} />
          {materials.carpet}
        </mesh>

        {/* Carpet border pattern (geometric Vegas style) */}
        {[
          // Top border
          { pos: [0, 0.015, -16], size: [38, 1] },
          // Bottom border
          { pos: [0, 0.015, 6], size: [38, 1] },
          // Left border
          { pos: [-18.5, 0.015, -5], size: [1, 22] },
          // Right border
          { pos: [18.5, 0.015, -5], size: [1, 22] }
        ].map((border, i) => (
          <mesh
            key={`border-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={border.pos as [number, number, number]}
            receiveShadow
          >
            <planeGeometry args={border.size as [number, number]} />
            {materials.carpetPattern}
          </mesh>
        ))}

        {/* Diagonal accent lines (diamond pattern) */}
        {[-6, -2, 2, 6].map((z, i) => (
          <mesh
            key={`diamond-${i}`}
            rotation={[-Math.PI / 2, 0, Math.PI / 4]}
            position={[0, 0.016, z]}
            receiveShadow
          >
            <planeGeometry args={[1.5, 1.5]} />
            {materials.carpetPattern}
          </mesh>
        ))}
      </group>

      {/* WALL SYSTEM (merged geometry for performance) */}
      <group name="wall-system">
        {/* Back wall */}
        <mesh position={[0, 3, -15]} receiveShadow>
          <boxGeometry args={[80, 6, 0.5]} />
          {materials.woodWall}
        </mesh>

        {/* Left wall */}
        <mesh position={[-40, 3, 0]} receiveShadow>
          <boxGeometry args={[0.5, 6, 80]} />
          {materials.woodWall}
        </mesh>

        {/* Right wall */}
        <mesh position={[40, 3, 0]} receiveShadow>
          <boxGeometry args={[0.5, 6, 80]} />
          {materials.woodWall}
        </mesh>

        {/* Gold wainscoting trim (waist height) */}
        {[
          { pos: [0, 1.5, -15], size: [80, 0.1, 0.6] },
          { pos: [-40, 1.5, 0], size: [0.6, 0.1, 80] },
          { pos: [40, 1.5, 0], size: [0.6, 0.1, 80] }
        ].map((trim, i) => (
          <mesh
            key={i}
            position={trim.pos as [number, number, number]}
          >
            <boxGeometry args={trim.size as [number, number, number]} />
            {materials.goldTrim}
          </mesh>
        ))}

        {/* Gold crown molding (top) */}
        {[
          { pos: [0, 5.8, -15], size: [80, 0.2, 0.6] },
          { pos: [-40, 5.8, 0], size: [0.6, 0.2, 80] },
          { pos: [40, 5.8, 0], size: [0.6, 0.2, 80] }
        ].map((molding, i) => (
          <mesh
            key={`molding-${i}`}
            position={molding.pos as [number, number, number]}
          >
            <boxGeometry args={molding.size as [number, number, number]} />
            {materials.goldTrim}
          </mesh>
        ))}
      </group>

      {/* COFFERED CEILING SYSTEM - Elegant recessed panels */}
      <group name="ceiling-system">
        {/* Main ceiling plane (high up, dark to not obstruct view) */}
        <mesh position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[82, 40]} />
          <meshStandardMaterial
            color="#0a0808"
            roughness={0.9}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Coffered ceiling grid - 3x5 pattern of recessed panels */}
        {[-24, -12, 0, 12, 24].map((x, xi) =>
          [-8, 0, 8].map((z, zi) => (
            <group key={`coffer-${xi}-${zi}`} position={[x, 11.8, z]}>
              {/* Recessed panel */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 6]} />
                <meshStandardMaterial
                  color="#050404"
                  roughness={0.95}
                  metalness={0.05}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Gold frame around panel */}
              {[
                { pos: [5, 0, 0], size: [0.15, 0.3, 6] },
                { pos: [-5, 0, 0], size: [0.15, 0.3, 6] },
                { pos: [0, 0, 3], size: [10, 0.3, 0.15] },
                { pos: [0, 0, -3], size: [10, 0.3, 0.15] }
              ].map((frame, fi) => (
                <mesh
                  key={`frame-${fi}`}
                  position={frame.pos as [number, number, number]}
                >
                  <boxGeometry args={frame.size as [number, number, number]} />
                  {materials.brassTrim}
                </mesh>
              ))}
            </group>
          ))
        )}

        {/* Crown molding at ceiling perimeter */}
        {[
          { pos: [0, 11.5, -14.5], size: [82, 0.8, 0.8], rot: [0, 0, 0] },
          { pos: [0, 11.5, 14.5], size: [82, 0.8, 0.8], rot: [0, 0, 0] },
          { pos: [-40.5, 11.5, 0], size: [0.8, 0.8, 30], rot: [0, 0, 0] },
          { pos: [40.5, 11.5, 0], size: [0.8, 0.8, 30], rot: [0, 0, 0] }
        ].map((molding, i) => (
          <mesh
            key={`crown-${i}`}
            position={molding.pos as [number, number, number]}
          >
            <boxGeometry args={molding.size as [number, number, number]} />
            {materials.goldTrim}
          </mesh>
        ))}

        {/* Decorative ceiling beams (mahogany) */}
        {[-12, 0, 12].map((x, i) => (
          <mesh key={`beam-x-${i}`} position={[x, 11.6, 0]}>
            <boxGeometry args={[0.4, 0.5, 30]} />
            {materials.woodWall}
          </mesh>
        ))}
        {[-6, 6].map((z, i) => (
          <mesh key={`beam-z-${i}`} position={[0, 11.6, z]}>
            <boxGeometry args={[50, 0.5, 0.4]} />
            {materials.woodWall}
          </mesh>
        ))}
      </group>

      {/* ANIMATED CRYSTAL CHANDELIERS - Gentle sway motion */}
      <group name="chandeliers">
        {[-14, 0, 14].map((x, i) => (
          <AnimatedChandelier
            key={i}
            position={[x, 0, 0]}
            swayAmount={0.015}
            swaySpeed={0.4 + i * 0.1}
          />
        ))}
      </group>

      {/* SIDE TABLES (velvet rope posts) - WIDER for 7-unit spacing */}
      <group name="side-props">
        {/* Left side posts - only between camera (z=5) and machines (z=-5) */}
        {[-8, -4, 0, 3].map((z, i) => (
          <group key={`left-${i}`} position={[-22, 0, z]}>
            {/* Post */}
            <mesh position={[0, 0.75, 0]}>
              <cylinderGeometry args={[0.1, 0.15, 1.5, 16]} />
              {materials.goldTrim}
            </mesh>
            {/* Top sphere */}
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              {materials.goldTrim}
            </mesh>
          </group>
        ))}

        {/* Right side posts - only between camera (z=5) and machines (z=-5) */}
        {[-8, -4, 0, 3].map((z, i) => (
          <group key={`right-${i}`} position={[22, 0, z]}>
            {/* Post */}
            <mesh position={[0, 0.75, 0]}>
              <cylinderGeometry args={[0.1, 0.15, 1.5, 16]} />
              {materials.goldTrim}
            </mesh>
            {/* Top sphere */}
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              {materials.goldTrim}
            </mesh>
          </group>
        ))}
      </group>

      {/* EXTENDED CARPET (longer for depth) - WIDER for 7-unit spacing */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 5]}
        receiveShadow
      >
        <planeGeometry args={[45, 30]} />
        {materials.carpet}
      </mesh>

      {/* LUXURY MARBLE PANELS - Calacatta Gold inspired (Wynn/Bellagio style) */}
      <group name="marble-wainscoting">
        {/* Left wall panels - Cream marble with gold veining */}
        {[-8, -4, 0, 4].map((z, i) => (
          <group key={`left-panel-group-${i}`}>
            {/* Main marble panel - Cream/ivory base */}
            <mesh position={[-39.7, 2.5, z]}>
              <boxGeometry args={[0.4, 5, 3.2]} />
              <meshStandardMaterial
                color="#F5F3EE"
                metalness={0.15}
                roughness={0.08}
                envMapIntensity={1.2}
              />
            </mesh>

            {/* Gold frame border (top) */}
            <mesh position={[-39.5, 4.65, z]}>
              <boxGeometry args={[0.15, 0.12, 3.3]} />
              {materials.goldTrim}
            </mesh>

            {/* Gold frame border (bottom) */}
            <mesh position={[-39.5, 0.35, z]}>
              <boxGeometry args={[0.15, 0.12, 3.3]} />
              {materials.goldTrim}
            </mesh>
          </group>
        ))}

        {/* Right wall panels - Cream marble with gold veining */}
        {[-8, -4, 0, 4].map((z, i) => (
          <group key={`right-panel-group-${i}`}>
            {/* Main marble panel - Cream/ivory base */}
            <mesh position={[39.7, 2.5, z]}>
              <boxGeometry args={[0.4, 5, 3.2]} />
              <meshStandardMaterial
                color="#F5F3EE"
                metalness={0.15}
                roughness={0.08}
                envMapIntensity={1.2}
              />
            </mesh>

            {/* Gold frame border (top) */}
            <mesh position={[39.5, 4.65, z]}>
              <boxGeometry args={[0.15, 0.12, 3.3]} />
              {materials.goldTrim}
            </mesh>

            {/* Gold frame border (bottom) */}
            <mesh position={[39.5, 0.35, z]}>
              <boxGeometry args={[0.15, 0.12, 3.3]} />
              {materials.goldTrim}
            </mesh>
          </group>
        ))}

        {/* Text on LEFT marble panels - Professional portfolio copy */}
        {[
          { z: -8, text: 'CREATIVE\nVISION' },
          { z: -4, text: 'PRECISION\nCRAFT' },
          { z: 0, text: 'INNOVATIVE\nSOLUTIONS' },
          { z: 4, text: 'EXCELLENCE\nDELIVERED' }
        ].map((panel, i) => (
          <group key={`left-text-group-${i}`}>
            {/* Warm accent spotlight */}
            <spotLight
              position={[-38.5, 5, panel.z]}
              target-position={[-39.5, 2.5, panel.z]}
              angle={Math.PI / 5}
              penumbra={0.4}
              intensity={6}
              distance={10}
              decay={2}
              color="#FFF8E7"
            />

            <Text
              key={`left-text-${i}`}
              position={[-39.3, 2.5, panel.z]}
              rotation={[0, Math.PI / 2, 0]}
              fontSize={0.35}
              color="#2D1810"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#D4AF37"
              font="/fonts/Inter-Bold.ttf"
              letterSpacing={0.06}
              lineHeight={1.25}
              fillOpacity={1.0}
              outlineOpacity={0.8}
              maxWidth={2.6}
            >
              {panel.text}
              <meshStandardMaterial
                color="#2D1810"
                metalness={0.1}
                roughness={0.5}
                emissive="#1a0f08"
                emissiveIntensity={0.2}
              />
            </Text>
          </group>
        ))}

        {/* Text on RIGHT marble panels - Professional portfolio copy */}
        {[
          { z: -8, text: 'PREMIUM\nQUALITY' },
          { z: -4, text: 'ATTENTION\nTO DETAIL' },
          { z: 0, text: 'FLAWLESS\nEXECUTION' },
          { z: 4, text: 'BEYOND\nEXPECTATIONS' }
        ].map((panel, i) => (
          <group key={`right-text-group-${i}`}>
            {/* Warm accent spotlight */}
            <spotLight
              position={[38.5, 5, panel.z]}
              target-position={[39.5, 2.5, panel.z]}
              angle={Math.PI / 5}
              penumbra={0.4}
              intensity={6}
              distance={10}
              decay={2}
              color="#FFF8E7"
            />

            <Text
              key={`right-text-${i}`}
              position={[39.3, 2.5, panel.z]}
              rotation={[0, -Math.PI / 2, 0]}
              fontSize={0.35}
              color="#2D1810"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#D4AF37"
              font="/fonts/Inter-Bold.ttf"
              letterSpacing={0.06}
              lineHeight={1.25}
              fillOpacity={1.0}
              outlineOpacity={0.8}
              maxWidth={2.6}
            >
              {panel.text}
              <meshStandardMaterial
                color="#2D1810"
                metalness={0.1}
                roughness={0.5}
                emissive="#1a0f08"
                emissiveIntensity={0.2}
              />
            </Text>
          </group>
        ))}

        {/* Back wall accent panels - Larger cream marble */}
        {[-10, 0, 10].map((x, i) => (
          <group key={`back-panel-group-${i}`}>
            {/* Main marble panel */}
            <mesh position={[x, 2.5, -14.7]}>
              <boxGeometry args={[3.8, 5, 0.4]} />
              <meshStandardMaterial
                color="#F5F3EE"
                metalness={0.15}
                roughness={0.08}
                envMapIntensity={1.2}
              />
            </mesh>

            {/* Gold frame border (top) */}
            <mesh position={[x, 4.65, -14.5]}>
              <boxGeometry args={[3.9, 0.12, 0.15]} />
              {materials.goldTrim}
            </mesh>

            {/* Gold frame border (bottom) */}
            <mesh position={[x, 0.35, -14.5]}>
              <boxGeometry args={[3.9, 0.12, 0.15]} />
              {materials.goldTrim}
            </mesh>
          </group>
        ))}

        {/* Decorative mirrors between panels */}
        {[-5, 5].map((x, i) => (
          <group key={`mirror-${i}`} position={[x, 3, -14.6]}>
            {/* Mirror surface (dark reflective) */}
            <mesh>
              <planeGeometry args={[2.5, 4]} />
              <meshStandardMaterial
                color="#0a0a0a"
                metalness={0.98}
                roughness={0.02}
                envMapIntensity={3}
              />
            </mesh>
            {/* Gold ornate frame */}
            {[
              { pos: [0, 2.1, 0.02], size: [2.8, 0.15, 0.1] },
              { pos: [0, -2.1, 0.02], size: [2.8, 0.15, 0.1] },
              { pos: [-1.35, 0, 0.02], size: [0.15, 4.2, 0.1] },
              { pos: [1.35, 0, 0.02], size: [0.15, 4.2, 0.1] }
            ].map((frame, fi) => (
              <mesh key={`frame-${fi}`} position={frame.pos as [number, number, number]}>
                <boxGeometry args={frame.size as [number, number, number]} />
                {materials.goldTrim}
              </mesh>
            ))}
            {/* Corner accents */}
            {[
              [-1.2, 1.95],
              [1.2, 1.95],
              [-1.2, -1.95],
              [1.2, -1.95]
            ].map((corner, ci) => (
              <mesh key={`corner-${ci}`} position={[corner[0], corner[1], 0.05]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                {materials.goldTrim}
              </mesh>
            ))}
          </group>
        ))}

        {/* Text on back marble panels - Elegant engraved style */}
        {[
          { x: -10, text: 'PORTFOLIO\nSHOWCASE' },
          { x: 0, text: 'PROFESSIONAL\nWORK' },
          { x: 10, text: 'EXPLORE\nMY PROJECTS' }
        ].map((panel, i) => (
          <group key={`back-text-group-${i}`}>
            {/* Warm accent spotlight */}
            <spotLight
              position={[panel.x, 5, -13.5]}
              target-position={[panel.x, 2.5, -14.5]}
              angle={Math.PI / 5}
              penumbra={0.4}
              intensity={6}
              distance={10}
              decay={2}
              color="#FFF8E7"
            />

            <Text
              key={`panel-text-${i}`}
              position={[panel.x, 2.5, -14.3]}
              fontSize={0.35}
              color="#2D1810"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#D4AF37"
              font="/fonts/Inter-Bold.ttf"
              letterSpacing={0.06}
              lineHeight={1.25}
              fillOpacity={1.0}
              outlineOpacity={0.8}
              maxWidth={3.2}
            >
              {panel.text}
              <meshStandardMaterial
                color="#2D1810"
                metalness={0.1}
                roughness={0.5}
                emissive="#1a0f08"
                emissiveIntensity={0.2}
              />
            </Text>
          </group>
        ))}
      </group>

      {/* BRIGHT GLOWING SCONCES - Maximum visibility */}
      <group name="wall-sconces">
        {/* Large glowing sconces above each panel */}
        {[-12.5, -7.5, -2.5, 2.5, 7.5, 12.5].map((x, i) => (
          <group key={`sconce-${i}`} position={[x, 5, -13.8]}>
            {/* Large glowing amber sphere */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial
                color="#FF8C00"
                metalness={0}
                roughness={0.3}
                emissive="#FF8C00"
                emissiveIntensity={1.5}
              />
            </mesh>

            {/* Strong spotlight pointing down at machines */}
            <spotLight
              position={[0, 0, 0]}
              target-position={[x, 0, -5]}
              angle={Math.PI / 4}
              penumbra={0.5}
              intensity={2}
              distance={15}
              decay={1.5}
              color="#FF8C00"
            />
          </group>
        ))}
      </group>

      {/* FOG for depth - darker for moodier atmosphere */}
      <fog attach="fog" args={['#050505', 40, 100]} />
    </group>
  )
}
