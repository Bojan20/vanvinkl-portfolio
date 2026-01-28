/**
 * Casino Architecture - Walls, Ceiling, Pillars, Carpet
 *
 * AAA Quality cyberpunk casino environment
 * Performance: Instanced meshes, shared geometries, geometry merging
 *
 * NOTE: No pillars near avatar spawn (z=10-15 area)
 *
 * OPTIMIZATIONS:
 * - Walls: 4 draw calls → 1 (geometry merging)
 * - Ceiling panels: 15 draw calls → 1 (geometry merging)
 * - Neon strips: 11 draw calls → 2 (instancing: 7 ceiling + 4 wall)
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

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
  neonTube: new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
  // Neon strip geometries for instancing
  neonStripBox: new THREE.BoxGeometry(1, 0.06, 0.06) // Unit box, scaled per instance
}

// ============== MERGED GEOMETRIES (Performance Optimization) ==============
// Merge all static walls into single geometry - 4 draw calls → 1
const mergedWalls = (() => {
  const geometries: THREE.BoxGeometry[] = []

  // Back wall
  const backWall = new THREE.BoxGeometry(60, 10, 0.5)
  backWall.translate(0, 4, -10)
  geometries.push(backWall)

  // Front wall
  const frontWall = new THREE.BoxGeometry(60, 10, 0.5)
  frontWall.translate(0, 4, 25)
  geometries.push(frontWall)

  // Left wall
  const leftWall = new THREE.BoxGeometry(0.5, 10, 50)
  leftWall.translate(-30, 4, 7)
  geometries.push(leftWall)

  // Right wall
  const rightWall = new THREE.BoxGeometry(0.5, 10, 50)
  rightWall.translate(30, 4, 7)
  geometries.push(rightWall)

  return mergeGeometries(geometries)
})()

// Merge ceiling panels into single geometry - 15 draw calls → 1
const mergedCeilingPanels = (() => {
  const geometries: THREE.BoxGeometry[] = []

  for (const x of [-20, -10, 0, 10, 20]) {
    for (const z of [-3, 5, 13]) {
      const panel = new THREE.BoxGeometry(8, 0.1, 6)
      panel.translate(x, 7.7, z)
      geometries.push(panel)
    }
  }

  return mergeGeometries(geometries)
})()

// Shared materials (created once, reused)
const wallMaterial = new THREE.MeshStandardMaterial({
  color: COLORS.wall,
  metalness: 0.7,
  roughness: 0.3
})

const ceilingPanelMaterial = new THREE.MeshStandardMaterial({
  color: '#0a0a14',
  metalness: 0.9,
  roughness: 0.1
})

// Neon materials (for instancing)
const neonMagentaMaterial = new THREE.MeshBasicMaterial({
  color: COLORS.magenta,
  toneMapped: false
})

const neonCyanMaterial = new THREE.MeshBasicMaterial({
  color: COLORS.cyan,
  toneMapped: false
})

const neonPurpleMaterial = new THREE.MeshBasicMaterial({
  color: COLORS.neonPurple,
  toneMapped: false
})

export function CasinoArchitecture() {
  const timeRef = useRef(0)

  // InstancedMesh refs for neon animation
  const ceilingNeonsRef = useRef<THREE.InstancedMesh>(null)
  const wallNeonsRef = useRef<THREE.InstancedMesh>(null)

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

  // Ceiling neon strip data (for instancing)
  const { ceilingNeonData, wallNeonData } = useMemo(() => {
    const ceiling: { pos: [number, number, number], rot: number, scale: [number, number, number], colorIndex: number }[] = []
    const wall: { pos: [number, number, number], rot: number, scale: [number, number, number], colorIndex: number }[] = []

    // CEILING STRIPS (7 instances)
    // Longitudinal strips (along Z) - magenta
    for (let x = -15; x <= 15; x += 10) {
      ceiling.push({
        pos: [x, 7.9, 5],
        rot: Math.PI / 2,
        scale: [40, 1, 1], // len=40
        colorIndex: 0 // magenta
      })
    }

    // Cross strips (along X) - cyan
    for (let z = -5; z <= 15; z += 10) {
      ceiling.push({
        pos: [0, 7.9, z],
        rot: 0,
        scale: [40, 1, 1], // len=40
        colorIndex: 1 // cyan
      })
    }

    // WALL NEONS (4 instances)
    // Back wall horizontal - magenta
    wall.push({
      pos: [0, 1, -9.7],
      rot: 0,
      scale: [55, 0.08 / 0.06, 0.08 / 0.06], // original: 55 x 0.08 x 0.08, base geometry: 1 x 0.06 x 0.06
      colorIndex: 0 // magenta
    })

    // Back wall horizontal - cyan
    wall.push({
      pos: [0, 7, -9.7],
      rot: 0,
      scale: [55, 0.08 / 0.06, 0.08 / 0.06],
      colorIndex: 1 // cyan
    })

    // Side wall vertical - purple (left)
    wall.push({
      pos: [-29.7, 4, 5],
      rot: 0,
      scale: [0.08 / 0.06, 6 / 0.06, 0.08 / 0.06], // original: 0.08 x 6 x 0.08
      colorIndex: 2 // purple
    })

    // Side wall vertical - purple (right)
    wall.push({
      pos: [29.7, 4, 5],
      rot: 0,
      scale: [0.08 / 0.06, 6 / 0.06, 0.08 / 0.06],
      colorIndex: 2 // purple
    })

    return { ceilingNeonData: ceiling, wallNeonData: wall }
  }, [])

  // Setup instanced meshes on mount
  useMemo(() => {
    const dummy = new THREE.Object3D()

    // Ceiling neons (7 instances)
    if (ceilingNeonsRef.current) {
      ceilingNeonData.forEach((data, i) => {
        dummy.position.set(...data.pos)
        dummy.rotation.set(0, data.rot, 0)
        dummy.scale.set(...data.scale)
        dummy.updateMatrix()
        ceilingNeonsRef.current!.setMatrixAt(i, dummy.matrix)
      })
      ceilingNeonsRef.current.instanceMatrix.needsUpdate = true
    }

    // Wall neons (4 instances)
    if (wallNeonsRef.current) {
      wallNeonData.forEach((data, i) => {
        dummy.position.set(...data.pos)
        dummy.rotation.set(0, data.rot, 0)
        dummy.scale.set(...data.scale)
        dummy.updateMatrix()
        wallNeonsRef.current!.setMatrixAt(i, dummy.matrix)
      })
      wallNeonsRef.current.instanceMatrix.needsUpdate = true
    }
  }, [ceilingNeonData, wallNeonData])

  // Animate neon (pulsing effect via color intensity)
  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    // Ceiling neons
    if (ceilingNeonsRef.current) {
      for (let i = 0; i < ceilingNeonData.length; i++) {
        const phase = i * 0.5
        const pulse = 0.7 + Math.sin(t * 3 + phase) * 0.3
        const colorIndex = ceilingNeonData[i].colorIndex
        const baseColor = new THREE.Color(colorIndex === 0 ? COLORS.magenta : COLORS.cyan)
        const color = baseColor.clone().multiplyScalar(pulse)
        ceilingNeonsRef.current.setColorAt(i, color)
      }
      ceilingNeonsRef.current.instanceColor!.needsUpdate = true
    }

    // Wall neons
    if (wallNeonsRef.current) {
      for (let i = 0; i < wallNeonData.length; i++) {
        const phase = i * 0.5
        const pulse = 0.7 + Math.sin(t * 3 + phase) * 0.3
        const colorIndex = wallNeonData[i].colorIndex
        const baseColor = new THREE.Color(
          colorIndex === 0 ? COLORS.magenta :
          colorIndex === 1 ? COLORS.cyan : COLORS.neonPurple
        )
        const color = baseColor.clone().multiplyScalar(pulse)
        wallNeonsRef.current.setColorAt(i, color)
      }
      wallNeonsRef.current.instanceColor!.needsUpdate = true
    }
  })

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

      {/* ===== WALLS (MERGED - 4 draw calls → 1) ===== */}
      <mesh geometry={mergedWalls} material={wallMaterial} />

      {/* ===== NEON STRIPS (INSTANCED - 11 draw calls → 2) ===== */}
      {/* Ceiling neons: 7 instances → 1 draw call */}
      <instancedMesh
        ref={ceilingNeonsRef}
        args={[sharedGeometries.neonStripBox, neonMagentaMaterial, ceilingNeonData.length]}
      />

      {/* Wall neons: 4 instances → 1 draw call */}
      <instancedMesh
        ref={wallNeonsRef}
        args={[sharedGeometries.neonStripBox, neonPurpleMaterial, wallNeonData.length]}
      />

      {/* ===== CEILING ===== */}
      <mesh position={[0, 8, 7]}>
        <boxGeometry args={[60, 0.5, 50]} />
        <meshStandardMaterial
          color={COLORS.ceiling}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Ceiling panels (MERGED - 15 draw calls → 1) */}
      <mesh geometry={mergedCeilingPanels} material={ceilingPanelMaterial} />

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
