'use client'

import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { RoundedBox, Cylinder, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'

export function LoungeEnvironment() {
  // PBR Materials - BRIGHTER for better visibility
  const floorMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#4a2020"
      metalness={0.6}
      roughness={0.3}
      envMapIntensity={1.5}
    />
  ), [])

  const wallMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#3a2020"
      metalness={0.3}
      roughness={0.6}
    />
  ), [])

  const ceilingMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#2a1a1a"
      metalness={0.4}
      roughness={0.5}
    />
  ), [])

  const carpetMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#A52020"
      metalness={0.1}
      roughness={0.8}
    />
  ), [])

  const goldMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#FFD700"
      metalness={1}
      roughness={0.1}
      emissive="#FFD700"
      emissiveIntensity={0.2}
    />
  ), [])

  return (
    <>
      {/* FLOOR */}
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          {floorMaterial}
        </mesh>
        <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.1, 0]} />
      </RigidBody>

      {/* Main carpet area (center) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        {carpetMaterial}
      </mesh>

      {/* Carpet border pattern (golden lines) */}
      {[
        // Top border
        { pos: [0, 0.02, -15], size: [24, 0.1, 0.1] },
        // Bottom border
        { pos: [0, 0.02, 5], size: [24, 0.1, 0.1] },
        // Left border
        { pos: [-12, 0.02, -5], size: [0.1, 0.1, 20] },
        // Right border
        { pos: [12, 0.02, -5], size: [0.1, 0.1, 20] }
      ].map((border, i) => (
        <mesh
          key={i}
          position={border.pos as [number, number, number]}
          receiveShadow
        >
          <boxGeometry args={border.size as [number, number, number]} />
          {goldMaterial}
        </mesh>
      ))}

      {/* WALLS */}
      {/* Back wall */}
      <RigidBody type="fixed" position={[0, 3, -15]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[50, 6, 0.5]} />
          {wallMaterial}
        </mesh>
        <CuboidCollider args={[25, 3, 0.25]} />
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed" position={[-15, 3, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 6, 50]} />
          {wallMaterial}
        </mesh>
        <CuboidCollider args={[0.25, 3, 25]} />
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" position={[15, 3, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 6, 50]} />
          {wallMaterial}
        </mesh>
        <CuboidCollider args={[0.25, 3, 25]} />
      </RigidBody>

      {/* Front wall (with entrance gap) */}
      {/* Left side of entrance */}
      <RigidBody type="fixed" position={[-10, 3, 10]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[10, 6, 0.5]} />
          {wallMaterial}
        </mesh>
        <CuboidCollider args={[5, 3, 0.25]} />
      </RigidBody>

      {/* Right side of entrance */}
      <RigidBody type="fixed" position={[10, 3, 10]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[10, 6, 0.5]} />
          {wallMaterial}
        </mesh>
        <CuboidCollider args={[5, 3, 0.25]} />
      </RigidBody>

      {/* Entrance arch */}
      <mesh position={[0, 4, 10]} castShadow>
        <boxGeometry args={[6, 2, 0.5]} />
        {goldMaterial}
      </mesh>

      {/* CEILING */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        {ceilingMaterial}
      </mesh>

      {/* Ceiling beams (golden accents) */}
      {[-10, -5, 0, 5, 10].map((z, i) => (
        <mesh key={i} position={[0, 5.9, z]} castShadow>
          <boxGeometry args={[50, 0.2, 0.5]} />
          {goldMaterial}
        </mesh>
      ))}

      {/* CHANDELIERS (5 units) */}
      {[
        [-8, 5, -8],
        [8, 5, -8],
        [0, 5, -5],
        [-8, 5, 0],
        [8, 5, 0]
      ].map((pos, i) => (
        <Chandelier key={i} position={pos as [number, number, number]} />
      ))}

      {/* WALL SCONCES (decorative lights on walls) */}
      {/* Back wall sconces */}
      {[-10, -5, 0, 5, 10].map((x, i) => (
        <WallSconce key={`back-${i}`} position={[x, 3, -14.5]} rotation={[0, 0, 0]} />
      ))}

      {/* Left wall sconces */}
      {[-10, -5, 0, 5].map((z, i) => (
        <WallSconce
          key={`left-${i}`}
          position={[-14.5, 3, z]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}

      {/* Right wall sconces */}
      {[-10, -5, 0, 5].map((z, i) => (
        <WallSconce
          key={`right-${i}`}
          position={[14.5, 3, z]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      ))}

      {/* COLUMNS (decorative support pillars) */}
      {[
        [-12, 0, -12],
        [12, 0, -12],
        [-12, 0, 0],
        [12, 0, 0]
      ].map((pos, i) => (
        <Column key={i} position={pos as [number, number, number]} />
      ))}

      {/* NEON SIGNS ON WALLS */}
      <NeonSign
        text="MEGA JACKPOT"
        position={[0, 4.5, -14.8]}
        rotation={[0, 0, 0]}
        color="#FFD700"
      />

      <NeonSign
        text="VIP SLOTS"
        position={[-14.8, 3.5, -5]}
        rotation={[0, Math.PI / 2, 0]}
        color="#ff0040"
        scale={0.7}
      />

      <NeonSign
        text="LUCKY 7"
        position={[14.8, 3.5, -5]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#40c8ff"
        scale={0.7}
      />
    </>
  )
}

// Chandelier component - BRIGHTER
function Chandelier({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Center sphere - brighter emissive */}
      <Sphere args={[0.3, 32, 32]} castShadow>
        <meshStandardMaterial
          color="#FFD700"
          metalness={1}
          roughness={0}
          emissive="#FFD700"
          emissiveIntensity={1.5}
        />
      </Sphere>

      {/* Hanging arms (8 directions) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const x = Math.cos(angle) * 1.2
        const z = Math.sin(angle) * 1.2

        return (
          <group key={i} position={[x, -0.6, z]}>
            {/* Arm */}
            <Cylinder args={[0.02, 0.02, 1.2, 8]} castShadow>
              <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
            </Cylinder>

            {/* Light bulb - brighter */}
            <Sphere args={[0.12, 16, 16]} position={[0, -0.4, 0]}>
              <meshBasicMaterial color="#fffef0" />
            </Sphere>

            {/* Point light - MUCH BRIGHTER */}
            <pointLight
              position={[0, -0.4, 0]}
              color="#fff8dc"
              intensity={5}
              distance={8}
              decay={2}
            />
          </group>
        )
      })}

      {/* Main chandelier light - MUCH BRIGHTER */}
      <pointLight
        position={[0, -0.5, 0]}
        color="#FFD700"
        intensity={8}
        distance={12}
        decay={2}
        castShadow
      />
    </group>
  )
}

// Wall sconce component - BRIGHTER
function WallSconce({
  position,
  rotation
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base plate */}
      <Cylinder args={[0.15, 0.15, 0.05, 16]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#8B4513" metalness={0.5} roughness={0.5} />
      </Cylinder>

      {/* Light bulb - brighter */}
      <Sphere args={[0.1, 16, 16]} position={[0, 0, 0.2]}>
        <meshBasicMaterial color="#fffef0" />
      </Sphere>

      {/* Point light - MUCH BRIGHTER */}
      <pointLight
        position={[0, 0, 0.3]}
        color="#fff8dc"
        intensity={4}
        distance={8}
        decay={2}
      />
    </group>
  )
}

// Decorative column
function Column({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main column shaft */}
      <Cylinder args={[0.3, 0.35, 5.5, 16]} position={[0, 2.75, 0]} castShadow>
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.8}
          roughness={0.3}
        />
      </Cylinder>

      {/* Base */}
      <Cylinder args={[0.5, 0.5, 0.3, 16]} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
      </Cylinder>

      {/* Capital (top) */}
      <Cylinder args={[0.5, 0.3, 0.4, 16]} position={[0, 5.6, 0]} castShadow>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
      </Cylinder>

      {/* Column collision */}
      <RigidBody type="fixed" position={[0, 2.75, 0]}>
        <CuboidCollider args={[0.3, 2.75, 0.3]} />
      </RigidBody>
    </group>
  )
}

// Neon sign on wall - BRIGHTER
function NeonSign({
  text,
  position,
  rotation,
  color = '#FFD700',
  scale = 1
}: {
  text: string
  position: [number, number, number]
  rotation: [number, number, number]
  color?: string
  scale?: number
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Backing board */}
      <RoundedBox args={[text.length * 0.4, 0.8, 0.1]} radius={0.05}>
        <meshStandardMaterial
          color="#000000"
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>

      {/* Neon glow - MUCH BRIGHTER */}
      <pointLight
        position={[0, 0, 0.5]}
        color={color}
        intensity={6}
        distance={10}
        decay={2}
      />

      {/* Text mesh - brighter emissive */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[text.length * 0.35, 0.5, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  )
}
