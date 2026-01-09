'use client'

import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  useGLTF,
  Text3D,
  Center,
  Float,
  MeshDistortMaterial,
  Sparkles,
  Effects
} from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Detect mobile device
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// Neon light component
function NeonLight({ position, color, intensity = 2 }: {
  position: [number, number, number]
  color: string
  intensity?: number
}) {
  return (
    <>
      <pointLight position={position} color={color} intensity={intensity} distance={20} decay={2} />
      <mesh position={position}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  )
}

// Floor with casino pattern
function CasinoFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        color="#1a0a0a"
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  )
}

// Slot machine 3D model (simplified)
function SlotMachine3D({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  return (
    <group ref={meshRef} position={position}>
      {/* Cabinet */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 3, 1]} />
        <meshStandardMaterial
          color="#8B0000"
          roughness={0.2}
          metalness={0.8}
          emissive="#ff0000"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 0.5, 0.51]}>
        <boxGeometry args={[1.2, 1.5, 0.1]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#4a9eff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Top light */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.5, 32]} />
          <MeshDistortMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={1}
            distort={0.3}
            speed={2}
          />
        </mesh>
      </Float>

      <pointLight position={[0, 2, 0]} color="#FFD700" intensity={2} distance={5} />
    </group>
  )
}

// Roulette table
function RouletteTable({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.children[1].rotation.y += 0.02
    }
  })

  return (
    <group ref={meshRef} position={position}>
      {/* Table */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[2, 2, 0.2, 32]} />
        <meshStandardMaterial
          color="#0a5f0a"
          roughness={0.8}
        />
      </mesh>

      {/* Wheel */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.3, 32]} />
        <meshStandardMaterial
          color="#8B0000"
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Center */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
    </group>
  )
}

// Poker table
function PokerTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[4, 0.2, 2.5]} />
        <meshStandardMaterial
          color="#0a5f0a"
          roughness={0.8}
        />
      </mesh>

      {/* Table edge */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[4.2, 0.1, 2.7]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
    </group>
  )
}

// Bar counter
function BarCounter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[6, 0.3, 1.5]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Shelves */}
      {[0, 0.5, 1].map((y, i) => (
        <mesh key={i} position={[0, 2 + y, -0.6]}>
          <boxGeometry args={[5.8, 0.1, 0.3]} />
          <meshStandardMaterial color="#8B4513" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// Chandelier
function Chandelier({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        {/* Center */}
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.5}
            metalness={1}
            roughness={0}
          />
        </mesh>

        {/* Arms */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x = Math.cos(angle) * 1
          const z = Math.sin(angle) * 1

          return (
            <group key={i} position={[x, -0.5, z]}>
              <mesh>
                <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
              </mesh>

              <mesh position={[0, -0.3, 0]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#fff8dc" />
              </mesh>

              <pointLight position={[0, -0.3, 0]} color="#fff8dc" intensity={1} distance={5} />
            </group>
          )
        })}
      </Float>

      <Sparkles
        count={50}
        scale={3}
        size={2}
        speed={0.3}
        color="#FFD700"
      />
    </group>
  )
}

// Main scene
function Scene() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={60} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={30}
        target={[0, 2, 0]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <Environment preset="night" />

      {/* Neon lights */}
      <NeonLight position={[-8, 3, -8]} color="#ff0040" intensity={3} />
      <NeonLight position={[8, 3, -8]} color="#4a9eff" intensity={3} />
      <NeonLight position={[-8, 3, 8]} color="#40ff90" intensity={3} />
      <NeonLight position={[8, 3, 8]} color="#ff9040" intensity={3} />

      {/* Chandeliers */}
      <Chandelier position={[0, 6, 0]} />
      <Chandelier position={[-6, 6, -6]} />
      <Chandelier position={[6, 6, -6]} />

      {/* Floor */}
      <CasinoFloor />

      {/* Slot machines - row */}
      <SlotMachine3D position={[-6, 0, -5]} />
      <SlotMachine3D position={[-3, 0, -5]} />
      <SlotMachine3D position={[0, 0, -5]} />
      <SlotMachine3D position={[3, 0, -5]} />
      <SlotMachine3D position={[6, 0, -5]} />

      {/* Roulette tables */}
      <RouletteTable position={[-5, 0, 3]} />
      <RouletteTable position={[5, 0, 3]} />

      {/* Poker tables */}
      <PokerTable position={[-5, 0, 8]} />
      <PokerTable position={[5, 0, 8]} />

      {/* Bar */}
      <BarCounter position={[0, 0, -10]} />

      {/* 3D Text */}
      <Center position={[0, 4, -9.5]}>
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
          <Text3D
            font="/fonts/helvetiker_bold.typeface.json"
            size={0.5}
            height={0.2}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.02}
            bevelSize={0.01}
            bevelOffset={0}
            bevelSegments={5}
          >
            VANVINKL CASINO
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={0.5}
              metalness={1}
              roughness={0}
            />
          </Text3D>
        </Float>
      </Center>

      {/* Contact shadows */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.8}
        scale={50}
        blur={1.5}
        far={10}
      />

      {/* Post-processing - optimized for mobile */}
      {isMobile ? (
        <EffectComposer>
          <Bloom
            intensity={0.3}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur={false}
          />
          <Vignette
            offset={0.3}
            darkness={0.5}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      ) : (
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0005, 0.0005] as [number, number]}
          />
          <DepthOfField
            focusDistance={0.02}
            focalLength={0.05}
            bokehScale={3}
          />
          <Vignette
            offset={0.3}
            darkness={0.5}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      )}
    </>
  )
}

// Loading fallback
function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-center">
        <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-[#FFD700] border-r-transparent"></div>
        <p className="mt-4 text-[#FFD700] font-bold text-xl">Loading Casino...</p>
      </div>
    </div>
  )
}

// Main component
export default function CasinoLounge3D() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        shadows={!isMobile}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: isMobile ? 'low-power' : 'high-performance'
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
