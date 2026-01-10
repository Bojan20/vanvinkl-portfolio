/**
 * Las Vegas Casino Architecture - Ultra Realistic
 *
 * Inspired by Bellagio, Venetian, Wynn casino floors:
 * - Ornate ceiling with coffered panels
 * - Crystal chandeliers
 * - Marble pillars with gold accents
 * - Rich carpet patterns
 * - Ambient Vegas atmosphere
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Vegas luxury color palette
const COLORS = {
  // Walls & Ceiling
  wallCream: '#f5e6d3',
  wallGold: '#d4af37',
  ceilingWhite: '#faf8f5',
  ceilingGold: '#c9a227',
  molding: '#e8d5b5',

  // Floor
  carpetRed: '#8b1a1a',
  carpetGold: '#c4a535',
  carpetPattern: '#6a1010',
  marbleWhite: '#f0ebe3',
  marbleGray: '#d8d0c8',

  // Accents
  brass: '#b5a642',
  chrome: '#c8ccd0',
  velvetRed: '#6b0f1a',
  velvetBlue: '#0a1a3a',

  // Lighting
  warmWhite: '#fff5e6',
  chandelier: '#fffaf0',
  neonRed: '#ff2020',
  neonGold: '#ffd700'
}

export function VegasCasinoArchitecture() {
  const chandelierRefs = useRef<THREE.Group[]>([])
  const timeRef = useRef(0)

  // Pillar positions
  const pillarPositions = useMemo(() => {
    const positions: [number, number, number][] = []
    // Main floor pillars
    for (let x = -24; x <= 24; x += 8) {
      positions.push([x, 0, -6])
      positions.push([x, 0, 16])
    }
    // Side pillars
    for (let z = 0; z <= 10; z += 10) {
      positions.push([-28, 0, z])
      positions.push([28, 0, z])
    }
    return positions
  }, [])

  // Chandelier positions
  const chandelierPositions = useMemo(() => [
    [-12, 6.5, 2],
    [0, 6.5, 2],
    [12, 6.5, 2],
    [-12, 6.5, 10],
    [0, 6.5, 10],
    [12, 6.5, 10]
  ], [])

  // Animate chandeliers
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    chandelierRefs.current.forEach((chandelier, i) => {
      if (!chandelier) return
      // Gentle sway
      chandelier.rotation.y = Math.sin(t * 0.3 + i) * 0.02
      chandelier.position.y = 6.5 + Math.sin(t * 0.5 + i * 0.5) * 0.01
    })
  })

  return (
    <group>

      {/* ============================================ */}
      {/* ===== FLOOR ===== */}
      {/* ============================================ */}

      {/* Main carpet - deep red with pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]}>
        <planeGeometry args={[60, 35]} />
        <meshStandardMaterial
          color={COLORS.carpetRed}
          metalness={0.05}
          roughness={0.95}
        />
      </mesh>

      {/* Carpet gold trim border */}
      {[-28, 28].map(x => (
        <mesh key={`trim-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 5]}>
          <planeGeometry args={[1, 35]} />
          <meshStandardMaterial
            color={COLORS.carpetGold}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
      ))}

      {/* Marble walkway (center) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 5]}>
        <planeGeometry args={[4, 35]} />
        <meshStandardMaterial
          color={COLORS.marbleWhite}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Marble pattern lines */}
      {[-1.5, -0.5, 0.5, 1.5].map(x => (
        <mesh key={`marble-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, 5]}>
          <planeGeometry args={[0.05, 35]} />
          <meshStandardMaterial color={COLORS.marbleGray} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}

      {/* ============================================ */}
      {/* ===== WALLS ===== */}
      {/* ============================================ */}

      {/* Back wall */}
      <mesh position={[0, 4, -8]}>
        <boxGeometry args={[60, 10, 0.4]} />
        <meshStandardMaterial
          color={COLORS.wallCream}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 4, 20]}>
        <boxGeometry args={[60, 10, 0.4]} />
        <meshStandardMaterial
          color={COLORS.wallCream}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Side walls */}
      <mesh position={[-30, 4, 6]}>
        <boxGeometry args={[0.4, 10, 30]} />
        <meshStandardMaterial color={COLORS.wallCream} metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh position={[30, 4, 6]}>
        <boxGeometry args={[0.4, 10, 30]} />
        <meshStandardMaterial color={COLORS.wallCream} metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Wall gold trim (chair rail) */}
      {[[-30, 1.2, 6], [30, 1.2, 6], [0, 1.2, -7.8], [0, 1.2, 19.8]].map((pos, i) => (
        <mesh key={`rail-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[i < 2 ? 0.5 : 60, 0.12, i < 2 ? 30 : 0.5]} />
          <meshStandardMaterial
            color={COLORS.wallGold}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Wall crown molding */}
      {[[-30, 7.5, 6], [30, 7.5, 6], [0, 7.5, -7.8], [0, 7.5, 19.8]].map((pos, i) => (
        <mesh key={`crown-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[i < 2 ? 0.6 : 60, 0.25, i < 2 ? 30 : 0.6]} />
          <meshStandardMaterial
            color={COLORS.molding}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* ============================================ */}
      {/* ===== CEILING ===== */}
      {/* ============================================ */}

      {/* Main ceiling */}
      <mesh position={[0, 8, 6]}>
        <boxGeometry args={[60, 0.3, 30]} />
        <meshStandardMaterial
          color={COLORS.ceilingWhite}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Coffered ceiling panels */}
      {[-20, -10, 0, 10, 20].map(x => (
        [-2, 6, 14].map(z => (
          <group key={`coffer-${x}-${z}`} position={[x, 7.8, z]}>
            {/* Recessed panel */}
            <mesh>
              <boxGeometry args={[8, 0.15, 6]} />
              <meshStandardMaterial color="#f8f5f0" metalness={0.05} roughness={0.9} />
            </mesh>
            {/* Gold border */}
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[8.2, 0.02, 6.2]} />
              <meshStandardMaterial color={COLORS.ceilingGold} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        ))
      ))}

      {/* ============================================ */}
      {/* ===== PILLARS ===== */}
      {/* ============================================ */}

      {pillarPositions.map((pos, i) => (
        <group key={`pillar-${i}`} position={pos}>
          {/* Base (marble) */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.9, 0.6, 0.9]} />
            <meshStandardMaterial
              color={COLORS.marbleWhite}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>

          {/* Gold base trim */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.85, 0.08, 0.85]} />
            <meshStandardMaterial color={COLORS.wallGold} metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Main shaft (fluted) */}
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.35, 0.38, 6.5, 12]} />
            <meshStandardMaterial
              color={COLORS.marbleWhite}
              metalness={0.25}
              roughness={0.45}
            />
          </mesh>

          {/* Gold ring */}
          <mesh position={[0, 3.5, 0]}>
            <torusGeometry args={[0.38, 0.04, 8, 24]} />
            <meshStandardMaterial color={COLORS.wallGold} metalness={0.85} roughness={0.15} />
          </mesh>

          {/* Capital (ornate top) */}
          <mesh position={[0, 7.4, 0]}>
            <boxGeometry args={[0.8, 0.4, 0.8]} />
            <meshStandardMaterial color={COLORS.molding} metalness={0.2} roughness={0.5} />
          </mesh>

          {/* Capital gold trim */}
          <mesh position={[0, 7.65, 0]}>
            <boxGeometry args={[0.85, 0.1, 0.85]} />
            <meshStandardMaterial color={COLORS.wallGold} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ============================================ */}
      {/* ===== CHANDELIERS ===== */}
      {/* ============================================ */}

      {chandelierPositions.map((pos, i) => (
        <group
          key={`chandelier-${i}`}
          ref={el => { if (el) chandelierRefs.current[i] = el }}
          position={pos as [number, number, number]}
        >
          {/* Chain */}
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Main body */}
          <mesh>
            <cylinderGeometry args={[0.8, 0.4, 0.5, 12]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.85} roughness={0.15} />
          </mesh>

          {/* Crystal tiers */}
          {[0, -0.4, -0.8].map((y, tier) => (
            <group key={`tier-${tier}`} position={[0, y, 0]}>
              {Array.from({ length: 12 }).map((_, j) => {
                const angle = (j / 12) * Math.PI * 2
                const radius = 0.6 - tier * 0.15
                return (
                  <mesh
                    key={`crystal-${tier}-${j}`}
                    position={[
                      Math.cos(angle) * radius,
                      -0.15,
                      Math.sin(angle) * radius
                    ]}
                  >
                    <octahedronGeometry args={[0.08, 0]} />
                    <meshStandardMaterial
                      color="#ffffff"
                      metalness={0.1}
                      roughness={0.1}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                )
              })}
            </group>
          ))}

          {/* Light source */}
          <pointLight
            position={[0, -0.3, 0]}
            color={COLORS.warmWhite}
            intensity={8}
            distance={12}
            decay={2}
          />
        </group>
      ))}

      {/* ============================================ */}
      {/* ===== DECORATIVE ELEMENTS ===== */}
      {/* ============================================ */}

      {/* VIP rope barriers */}
      {[[-26, 6], [26, 6]].map(([x, z], i) => (
        <group key={`rope-${i}`} position={[x, 0, z]}>
          {/* Post */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 1, 12]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Top ball */}
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Base */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.15, 0.18, 0.1, 12]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Wall sconces */}
      {[-20, -10, 0, 10, 20].map(x => (
        <group key={`sconce-${x}`} position={[x, 3, -7.6]}>
          {/* Bracket */}
          <mesh>
            <boxGeometry args={[0.15, 0.2, 0.15]} />
            <meshStandardMaterial color={COLORS.brass} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Shade */}
          <mesh position={[0, 0, 0.15]}>
            <coneGeometry args={[0.12, 0.2, 8, 1, true]} />
            <meshStandardMaterial
              color="#fff8e8"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Light */}
          <pointLight
            position={[0, 0, 0.2]}
            color={COLORS.warmWhite}
            intensity={1.5}
            distance={4}
            decay={2}
          />
        </group>
      ))}

      {/* ============================================ */}
      {/* ===== SIGNAGE ===== */}
      {/* ============================================ */}

      {/* "HIGH LIMIT" sign */}
      <group position={[0, 6, -7.5]}>
        <mesh>
          <boxGeometry args={[4, 0.8, 0.1]} />
          <meshStandardMaterial color="#1a0a0a" metalness={0.5} roughness={0.5} />
        </mesh>
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.4}
          color={COLORS.neonGold}
          anchorX="center"
          anchorY="middle"
        >
          HIGH LIMIT
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </group>

      {/* ============================================ */}
      {/* ===== AMBIENT LIGHTING ===== */}
      {/* ============================================ */}

      {/* General fill lights */}
      {[-15, 0, 15].map(x => (
        [-2, 6, 14].map(z => (
          <pointLight
            key={`fill-${x}-${z}`}
            position={[x, 7, z]}
            color={COLORS.warmWhite}
            intensity={0.4}
            distance={15}
            decay={2}
          />
        ))
      ))}

      {/* Colored accent spotlights */}
      <spotLight
        position={[-20, 7, 5]}
        angle={0.4}
        penumbra={0.5}
        color="#ffd4a8"
        intensity={3}
        distance={12}
        decay={2}
      />
      <spotLight
        position={[20, 7, 5]}
        angle={0.4}
        penumbra={0.5}
        color="#ffd4a8"
        intensity={3}
        distance={12}
        decay={2}
      />

    </group>
  )
}
