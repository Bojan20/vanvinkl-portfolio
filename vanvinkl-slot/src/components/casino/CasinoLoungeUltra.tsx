'use client'

import { Suspense, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { SlotMachineRealistic } from './SlotMachineRealistic'
import { ThirdPersonAvatar, ThirdPersonInstructions } from './ThirdPersonAvatar'
import { CasinoEntrance } from './CasinoEntrance'
import * as THREE from 'three'

interface CasinoLoungeUltraProps {
  onMachineInteract?: (machineId: string) => void
}

// Portfolio sections mapped to slot machines
const PORTFOLIO_MACHINES = [
  { id: 'about', label: 'About Me', pos: [0, 0, -6] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { id: 'services', label: 'Services', pos: [-4.5, 0, -6] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { id: 'projects', label: 'Projects', pos: [4.5, 0, -6] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { id: 'skills', label: 'Skills', pos: [-4.5, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { id: 'experience', label: 'Experience', pos: [4.5, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
  { id: 'contact', label: 'Contact', pos: [0, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
]

export function CasinoLoungeUltra({ onMachineInteract }: CasinoLoungeUltraProps) {
  const [showEntrance, setShowEntrance] = useState(true)
  const [isEntered, setIsEntered] = useState(false)

  const handleEntranceComplete = () => {
    setShowEntrance(false)
    setIsEntered(true)
  }

  // Memoized materials for performance
  const floorMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#1a0505"
      metalness={0.9}
      roughness={0.1}
    />
  ), [])

  const wallMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#0a0a0a"
      metalness={0.4}
      roughness={0.6}
    />
  ), [])

  return (
    <div className="w-full h-screen bg-black relative">
      {isEntered && <ThirdPersonInstructions />}

      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        camera={{
          fov: 70,
          near: 0.1,
          far: 80,
          position: [0, 3, 10]
        }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          {isEntered && <ThirdPersonAvatar />}

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[40, 40]} />
            {floorMaterial}
          </mesh>

          {/* Walls */}
          {[
            { pos: [0, 2.5, -14], size: [40, 5, 0.5] },
            { pos: [-14, 2.5, 0], size: [0.5, 5, 40] },
            { pos: [14, 2.5, 0], size: [0.5, 5, 40] }
          ].map((wall, i) => (
            <mesh key={i} position={wall.pos as [number, number, number]}>
              <boxGeometry args={wall.size as [number, number, number]} />
              {wallMaterial}
            </mesh>
          ))}

          {/* Portfolio Slot Machines */}
          {PORTFOLIO_MACHINES.map((machine) => (
            <SlotMachineRealistic
              key={machine.id}
              position={machine.pos}
              rotation={machine.rot}
              machineId={machine.id}
              label={machine.label}
              isActive
              onInteract={onMachineInteract}
            />
          ))}

          {/* Lighting - optimized */}
          <ambientLight intensity={0.35} />
          <Environment preset="night" />

          <Stars
            radius={40}
            depth={20}
            count={800}
            factor={2}
            fade
            speed={0.3}
          />

          <fog attach="fog" args={['#050510', 10, 35]} />

          {/* Key lights */}
          <spotLight
            position={[0, 8, -4]}
            angle={Math.PI / 3}
            penumbra={0.6}
            intensity={1.2}
            castShadow={false}
          />

          <spotLight
            position={[0, 6, 0]}
            angle={Math.PI / 4}
            penumbra={0.5}
            intensity={0.8}
            castShadow={false}
          />

          {/* Accent rim light */}
          <directionalLight
            position={[-5, 3, 5]}
            intensity={0.4}
            color="#4a9eff"
          />

          {/* Post-processing - ultra optimized */}
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.35}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.8}
              mipmapBlur={false}
            />
            <Vignette
              offset={0.35}
              darkness={0.55}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {showEntrance && (
        <CasinoEntrance onComplete={handleEntranceComplete} />
      )}
    </div>
  )
}
