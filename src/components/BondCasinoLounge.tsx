/**
 * James Bond Casino Lounge - Sophisticated & Slick
 *
 * Inspired by Casino Royale Montenegro scenes:
 * - Dark, moody atmosphere
 * - Elegant minimalist design
 * - Ambient blue/cyan accent lighting
 * - No clutter, pure sophistication
 *
 * Visual Design from CLAUDE.md:
 * - Backgrounds: #0a0a0c, #121216, #1a1a20, #242430
 * - Accents: #4a9eff (blue), #40c8ff (cyan), #ff9040 (orange)
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pro Audio Dark palette from CLAUDE.md
const COLORS = {
  deepest: '#0a0a0c',
  deep: '#121216',
  mid: '#1a1a20',
  surface: '#242430',

  // Accents
  blue: '#4a9eff',
  cyan: '#40c8ff',
  orange: '#ff9040',
  green: '#40ff90',

  // Materials
  leather: '#1a1418',
  chrome: '#b8bcc0',
  gold: '#c9a227',
  glass: '#1a2030'
}

export function BondCasinoLounge() {
  const ambientLightsRef = useRef<THREE.PointLight[]>([])
  const timeRef = useRef(0)

  // Subtle light animation
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    ambientLightsRef.current.forEach((light, i) => {
      if (!light) return
      const pulse = 0.9 + Math.sin(t * 0.5 + i * 0.5) * 0.1
      light.intensity = pulse * (i % 2 === 0 ? 2 : 1.5)
    })
  })

  const addLightRef = (light: THREE.PointLight | null, index: number) => {
    if (light) ambientLightsRef.current[index] = light
  }

  return (
    <group>

      {/* ============================================ */}
      {/* ===== FLOOR ===== */}
      {/* ============================================ */}

      {/* Main floor - dark polished */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
        <planeGeometry args={[80, 50]} />
        <meshStandardMaterial
          color={COLORS.deepest}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Subtle floor pattern - darker lines */}
      {[-30, -20, -10, 0, 10, 20, 30].map(x => (
        <mesh key={`line-x-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.001, 5]}>
          <planeGeometry args={[0.02, 50]} />
          <meshBasicMaterial color={COLORS.deep} />
        </mesh>
      ))}
      {[-15, -5, 5, 15, 25].map(z => (
        <mesh key={`line-z-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, z]}>
          <planeGeometry args={[80, 0.02]} />
          <meshBasicMaterial color={COLORS.deep} />
        </mesh>
      ))}

      {/* Floor accent strip (center walkway) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 5]}>
        <planeGeometry args={[1, 50]} />
        <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.08} />
      </mesh>

      {/* ============================================ */}
      {/* ===== WALLS ===== */}
      {/* ============================================ */}

      {/* Back wall */}
      <mesh position={[0, 5, -10]}>
        <boxGeometry args={[80, 12, 0.3]} />
        <meshStandardMaterial
          color={COLORS.deep}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 5, 28]}>
        <boxGeometry args={[80, 12, 0.3]} />
        <meshStandardMaterial color={COLORS.deep} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-40, 5, 9]}>
        <boxGeometry args={[0.3, 12, 40]} />
        <meshStandardMaterial color={COLORS.deep} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[40, 5, 9]}>
        <boxGeometry args={[0.3, 12, 40]} />
        <meshStandardMaterial color={COLORS.deep} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Wall accent panels (dark surface) */}
      {[-30, -15, 0, 15, 30].map(x => (
        <mesh key={`panel-${x}`} position={[x, 4, -9.7]}>
          <boxGeometry args={[8, 6, 0.1]} />
          <meshStandardMaterial
            color={COLORS.surface}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* ============================================ */}
      {/* ===== CEILING ===== */}
      {/* ============================================ */}

      {/* Main ceiling */}
      <mesh position={[0, 10, 9]}>
        <boxGeometry args={[80, 0.3, 40]} />
        <meshStandardMaterial
          color={COLORS.deepest}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Recessed ceiling panels with subtle glow */}
      {[-24, -12, 0, 12, 24].map(x => (
        [-2, 8, 18].map(z => (
          <group key={`recess-${x}-${z}`} position={[x, 9.8, z]}>
            <mesh>
              <boxGeometry args={[10, 0.1, 8]} />
              <meshStandardMaterial color={COLORS.mid} metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Ambient down light */}
            <pointLight
              ref={l => addLightRef(l, Math.abs(x) + z)}
              position={[0, -0.5, 0]}
              color={COLORS.cyan}
              intensity={1.5}
              distance={8}
              decay={2}
            />
          </group>
        ))
      ))}

      {/* ============================================ */}
      {/* ===== AMBIENT LIGHT STRIPS ===== */}
      {/* ============================================ */}

      {/* Wall base light strips */}
      <mesh position={[0, 0.05, -9.5]}>
        <boxGeometry args={[75, 0.05, 0.1]} />
        <meshBasicMaterial color={COLORS.cyan} toneMapped={false} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 27.5]}>
        <boxGeometry args={[75, 0.05, 0.1]} />
        <meshBasicMaterial color={COLORS.cyan} toneMapped={false} transparent opacity={0.6} />
      </mesh>

      {/* Side wall light strips */}
      <mesh position={[-39.5, 0.05, 9]}>
        <boxGeometry args={[0.1, 0.05, 35]} />
        <meshBasicMaterial color={COLORS.blue} toneMapped={false} transparent opacity={0.6} />
      </mesh>
      <mesh position={[39.5, 0.05, 9]}>
        <boxGeometry args={[0.1, 0.05, 35]} />
        <meshBasicMaterial color={COLORS.blue} toneMapped={false} transparent opacity={0.6} />
      </mesh>

      {/* Ceiling edge strips */}
      <mesh position={[0, 9.9, -9.5]}>
        <boxGeometry args={[75, 0.03, 0.08]} />
        <meshBasicMaterial color={COLORS.cyan} toneMapped={false} transparent opacity={0.4} />
      </mesh>

      {/* ============================================ */}
      {/* ===== LOUNGE SEATING (minimal) ===== */}
      {/* ============================================ */}

      {/* Left lounge area */}
      <group position={[-32, 0, 5]}>
        {/* Sofa */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[4, 0.8, 1.2]} />
          <meshStandardMaterial
            color={COLORS.leather}
            metalness={0.3}
            roughness={0.8}
          />
        </mesh>
        {/* Sofa back */}
        <mesh position={[0, 0.9, -0.5]}>
          <boxGeometry args={[4, 1, 0.3]} />
          <meshStandardMaterial color={COLORS.leather} metalness={0.3} roughness={0.8} />
        </mesh>
        {/* Coffee table */}
        <mesh position={[0, 0.35, 1.5]}>
          <boxGeometry args={[2, 0.05, 0.8]} />
          <meshStandardMaterial color={COLORS.chrome} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.18, 1.5]}>
          <boxGeometry args={[1.8, 0.35, 0.6]} />
          <meshStandardMaterial color={COLORS.deepest} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* Right lounge area */}
      <group position={[32, 0, 5]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[4, 0.8, 1.2]} />
          <meshStandardMaterial color={COLORS.leather} metalness={0.3} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.9, -0.5]}>
          <boxGeometry args={[4, 1, 0.3]} />
          <meshStandardMaterial color={COLORS.leather} metalness={0.3} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.35, 1.5]}>
          <boxGeometry args={[2, 0.05, 0.8]} />
          <meshStandardMaterial color={COLORS.chrome} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.18, 1.5]}>
          <boxGeometry args={[1.8, 0.35, 0.6]} />
          <meshStandardMaterial color={COLORS.deepest} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* ============================================ */}
      {/* ===== BAR AREA (back) ===== */}
      {/* ============================================ */}

      <group position={[0, 0, -7]}>
        {/* Bar counter */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[20, 0.1, 1.5]} />
          <meshStandardMaterial color={COLORS.surface} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[19.5, 1.1, 1.3]} />
          <meshStandardMaterial color={COLORS.deep} metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Bar back shelves */}
        <mesh position={[0, 2, -1.5]}>
          <boxGeometry args={[18, 3, 0.3]} />
          <meshStandardMaterial color={COLORS.mid} metalness={0.4} roughness={0.6} />
        </mesh>

        {/* Accent light behind bar */}
        <mesh position={[0, 1.5, -1.3]}>
          <boxGeometry args={[16, 0.05, 0.05]} />
          <meshBasicMaterial color={COLORS.orange} toneMapped={false} transparent opacity={0.8} />
        </mesh>

        {/* Bar stools */}
        {[-6, -3, 0, 3, 6].map(x => (
          <group key={`stool-${x}`} position={[x, 0, 1.2]}>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.8, 16]} />
              <meshStandardMaterial color={COLORS.chrome} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.1, 16]} />
              <meshStandardMaterial color={COLORS.leather} metalness={0.2} roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ============================================ */}
      {/* ===== AMBIENT LIGHTING ===== */}
      {/* ============================================ */}

      {/* Main ambient - very subtle */}
      <ambientLight intensity={0.05} color={COLORS.deep} />

      {/* Key lights - soft blue/cyan */}
      <pointLight position={[-20, 8, 5]} color={COLORS.blue} intensity={3} distance={25} decay={2} />
      <pointLight position={[20, 8, 5]} color={COLORS.blue} intensity={3} distance={25} decay={2} />
      <pointLight position={[0, 8, -5]} color={COLORS.cyan} intensity={4} distance={20} decay={2} />
      <pointLight position={[0, 8, 15]} color={COLORS.cyan} intensity={3} distance={20} decay={2} />

      {/* Bar accent light */}
      <pointLight position={[0, 3, -7]} color={COLORS.orange} intensity={2} distance={8} decay={2} />

      {/* Floor wash lights */}
      <spotLight
        position={[-25, 9, 5]}
        angle={0.6}
        penumbra={1}
        color={COLORS.blue}
        intensity={2}
        distance={15}
        decay={2}
        target-position={[-25, 0, 5]}
      />
      <spotLight
        position={[25, 9, 5]}
        angle={0.6}
        penumbra={1}
        color={COLORS.blue}
        intensity={2}
        distance={15}
        decay={2}
        target-position={[25, 0, 5]}
      />

    </group>
  )
}
