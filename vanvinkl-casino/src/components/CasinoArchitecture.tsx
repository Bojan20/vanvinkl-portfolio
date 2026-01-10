/**
 * Casino Architecture - Walls, Ceiling, Pillars, Carpet
 *
 * AAA Quality cyberpunk casino environment
 * Performance: Instanced meshes, shared geometries
 *
 * NOTE: No pillars near avatar spawn (z=10-15 area)
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============== COLORS ==============
const COLORS = {
  wall: '#0a0814',
  ceiling: '#050510',
  pillar: '#1a1428',
  chrome: '#888888',
  gold: '#ffd700',
  magenta: '#ff00aa',
  cyan: '#00ffff',
  neonPurple: '#8844ff',
  carpet: '#120820'
}

// ============== SHARED GEOMETRIES ==============
const sharedGeometries = {
  pillarBase: new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8),
  pillarShaft: new THREE.CylinderGeometry(0.35, 0.35, 6, 8),
  pillarCap: new THREE.CylinderGeometry(0.5, 0.4, 0.3, 8),
  neonTube: new THREE.CylinderGeometry(0.03, 0.03, 1, 8)
}

export function CasinoArchitecture() {
  const neonRefs = useRef<THREE.Mesh[]>([])
  const timeRef = useRef(0)

  // Pillar positions - NO pillars near avatar spawn (z=10-15)
  const pillarPositions = useMemo(() => {
    const positions: [number, number, number][] = []
    // Front row (behind machines)
    for (let x = -18; x <= 18; x += 6) {
      positions.push([x, 0, -8])
    }
    // Back row (far from spawn)
    for (let x = -18; x <= 18; x += 6) {
      positions.push([x, 0, 22])
    }
    // Side rows - only at far ends, not near spawn
    positions.push([-25, 0, -4])
    positions.push([25, 0, -4])
    positions.push([-25, 0, 20])
    positions.push([25, 0, 20])
    return positions
  }, [])

  // Ceiling neon strip positions
  const neonStripPositions = useMemo(() => {
    const strips: { pos: [number, number, number], rot: number, len: number, color: string }[] = []

    // Longitudinal strips (along Z)
    for (let x = -15; x <= 15; x += 10) {
      strips.push({ pos: [x, 7.9, 5], rot: Math.PI / 2, len: 40, color: COLORS.magenta })
    }

    // Cross strips (along X)
    for (let z = -5; z <= 15; z += 10) {
      strips.push({ pos: [0, 7.9, z], rot: 0, len: 40, color: COLORS.cyan })
    }

    return strips
  }, [])

  // Animate neon
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    neonRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial
        const phase = i * 0.5
        const pulse = 0.7 + Math.sin(t * 3 + phase) * 0.3
        const baseColor = new THREE.Color(i % 2 === 0 ? COLORS.magenta : COLORS.cyan)
        mat.color.copy(baseColor).multiplyScalar(pulse)
      }
    })
  })

  const addNeonRef = (mesh: THREE.Mesh | null, index: number) => {
    if (mesh) neonRefs.current[index] = mesh
  }

  return (
    <group>
      {/* ===== FLOOR / CARPET ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 5]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial
          color={COLORS.carpet}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Carpet pattern overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial
          color="#1a0828"
          metalness={0.2}
          roughness={0.8}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* ===== WALLS ===== */}
      {/* Back wall */}
      <mesh position={[0, 4, -10]}>
        <boxGeometry args={[60, 10, 0.5]} />
        <meshStandardMaterial
          color={COLORS.wall}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Front wall (behind player spawn) */}
      <mesh position={[0, 4, 25]}>
        <boxGeometry args={[60, 10, 0.5]} />
        <meshStandardMaterial
          color={COLORS.wall}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Left wall */}
      <mesh position={[-30, 4, 7]}>
        <boxGeometry args={[0.5, 10, 50]} />
        <meshStandardMaterial
          color={COLORS.wall}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Right wall */}
      <mesh position={[30, 4, 7]}>
        <boxGeometry args={[0.5, 10, 50]} />
        <meshStandardMaterial
          color={COLORS.wall}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* ===== WALL NEON TRIM ===== */}
      {/* Back wall horizontal neon */}
      <mesh ref={m => addNeonRef(m, 100)} position={[0, 1, -9.7]}>
        <boxGeometry args={[55, 0.08, 0.08]} />
        <meshBasicMaterial color={COLORS.magenta} toneMapped={false} />
      </mesh>
      <mesh ref={m => addNeonRef(m, 101)} position={[0, 7, -9.7]}>
        <boxGeometry args={[55, 0.08, 0.08]} />
        <meshBasicMaterial color={COLORS.cyan} toneMapped={false} />
      </mesh>

      {/* Side wall vertical neons */}
      {[-29.7, 29.7].map((x, i) => (
        <mesh key={x} ref={m => addNeonRef(m, 102 + i)} position={[x, 4, 5]}>
          <boxGeometry args={[0.08, 6, 0.08]} />
          <meshBasicMaterial color={COLORS.neonPurple} toneMapped={false} />
        </mesh>
      ))}

      {/* ===== CEILING ===== */}
      <mesh position={[0, 8, 7]}>
        <boxGeometry args={[60, 0.5, 50]} />
        <meshStandardMaterial
          color={COLORS.ceiling}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Ceiling panels (decorative) */}
      {[-20, -10, 0, 10, 20].map(x => (
        [-3, 5, 13].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 7.7, z]}>
            <boxGeometry args={[8, 0.1, 6]} />
            <meshStandardMaterial
              color="#0a0a14"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        ))
      ))}

      {/* ===== CEILING NEON STRIPS ===== */}
      {neonStripPositions.map((strip, i) => (
        <mesh
          key={i}
          ref={m => addNeonRef(m, i)}
          position={strip.pos}
          rotation={[0, strip.rot, 0]}
        >
          <boxGeometry args={[strip.len, 0.06, 0.06]} />
          <meshBasicMaterial color={strip.color} toneMapped={false} />
        </mesh>
      ))}

      {/* ===== PILLARS (away from spawn) ===== */}
      {pillarPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Base */}
          <mesh geometry={sharedGeometries.pillarBase} position={[0, 0.15, 0]}>
            <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
          </mesh>

          {/* Shaft */}
          <mesh geometry={sharedGeometries.pillarShaft} position={[0, 3.3, 0]}>
            <meshStandardMaterial
              color={COLORS.pillar}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Neon ring at middle */}
          <mesh position={[0, 3, 0]}>
            <torusGeometry args={[0.38, 0.03, 8, 24]} />
            <meshBasicMaterial color={COLORS.magenta} toneMapped={false} />
          </mesh>

          {/* Cap */}
          <mesh geometry={sharedGeometries.pillarCap} position={[0, 6.45, 0]}>
            <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
          </mesh>

          {/* Spotlight from pillar */}
          <pointLight
            position={[0, 5, 0.5]}
            color={COLORS.cyan}
            intensity={1}
            distance={4}
            decay={2}
          />
        </group>
      ))}

      {/* ===== DECORATIVE ELEMENTS ===== */}

      {/* Gold accent strips on walls */}
      {[-29.6, 29.6].map(x => (
        <mesh key={x} position={[x, 4, 5]}>
          <boxGeometry args={[0.1, 0.15, 40]} />
          <meshStandardMaterial
            color={COLORS.gold}
            metalness={1}
            roughness={0.2}
            emissive={COLORS.gold}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* VIP rope barriers (decorative) - only at sides */}
      {[-25, 25].map(x => (
        <group key={x} position={[x, 0, -2]}>
          {/* Pole */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1, 12]} />
            <meshStandardMaterial color={COLORS.gold} metalness={1} roughness={0.15} />
          </mesh>
          {/* Top ball */}
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={COLORS.gold} metalness={1} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* ===== AMBIENT LIGHTING ===== */}
      {/* Main ceiling lights */}
      {[-15, 0, 15].map(x => (
        [-3, 5, 13].map(z => (
          <pointLight
            key={`light-${x}-${z}`}
            position={[x, 7.5, z]}
            color="#ffffff"
            intensity={0.5}
            distance={12}
            decay={2}
          />
        ))
      ))}

      {/* Colored accent lights */}
      <pointLight position={[-25, 3, 0]} color={COLORS.magenta} intensity={2} distance={8} decay={2} />
      <pointLight position={[25, 3, 0]} color={COLORS.cyan} intensity={2} distance={8} decay={2} />
      <pointLight position={[-25, 3, 10]} color={COLORS.neonPurple} intensity={2} distance={8} decay={2} />
      <pointLight position={[25, 3, 10]} color={COLORS.magenta} intensity={2} distance={8} decay={2} />
    </group>
  )
}
