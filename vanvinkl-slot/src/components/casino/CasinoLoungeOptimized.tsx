'use client'

import { Suspense, useState, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  Stars,
  Lightformer,
  PointerLockControls
} from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette
} from '@react-three/postprocessing'
import { SlotMachine3DSimple } from './SlotMachine3DSimple'
import { CasinoEntrance } from './CasinoEntrance'
import * as THREE from 'three'
import { useEffect } from 'react'

interface CasinoLoungeOptimizedProps {
  onMachineInteract?: (machineId: string) => void
}

// Simple FPS controller (optimized)
function OptimizedFPSController() {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': keys.current.forward = true; break
        case 'KeyS': keys.current.backward = true; break
        case 'KeyA': keys.current.left = true; break
        case 'KeyD': keys.current.right = true; break
        case 'ShiftLeft': keys.current.sprint = true; break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': keys.current.forward = false; break
        case 'KeyS': keys.current.backward = false; break
        case 'KeyA': keys.current.left = false; break
        case 'KeyD': keys.current.right = false; break
        case 'ShiftLeft': keys.current.sprint = false; break
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: true })
    window.addEventListener('keyup', handleKeyUp, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    const speed = keys.current.sprint ? 10 : 5

    camera.getWorldDirection(direction.current)
    direction.current.y = 0
    direction.current.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(direction.current, new THREE.Vector3(0, 1, 0)).normalize()

    velocity.current.set(0, 0, 0)

    if (keys.current.forward) velocity.current.add(direction.current)
    if (keys.current.backward) velocity.current.sub(direction.current)
    if (keys.current.right) velocity.current.add(right)
    if (keys.current.left) velocity.current.sub(right)

    velocity.current.normalize().multiplyScalar(speed * delta)
    camera.position.add(velocity.current)

    // Constraints
    camera.position.y = 1.7
    camera.position.x = Math.max(-14, Math.min(14, camera.position.x))
    camera.position.z = Math.max(-14, Math.min(9, camera.position.z))
  })

  return <PointerLockControls />
}

// Instructions overlay
function Instructions() {
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(!!document.pointerLockElement)
    }

    document.addEventListener('pointerlockchange', handleLockChange, { passive: true })
    return () => document.removeEventListener('pointerlockchange', handleLockChange)
  }, [])

  if (isLocked) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 pointer-events-none">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md text-center">
        <h2 className="text-2xl font-black text-white mb-4">
          🎰 Casino Lounge
        </h2>
        <p className="text-white/70 mb-6">
          Click anywhere to start
        </p>
        <div className="space-y-2 text-sm text-white/60">
          <div className="flex justify-between">
            <span>Move</span>
            <span className="font-mono">W A S D</span>
          </div>
          <div className="flex justify-between">
            <span>Look</span>
            <span className="font-mono">MOUSE</span>
          </div>
          <div className="flex justify-between">
            <span>Sprint</span>
            <span className="font-mono">SHIFT</span>
          </div>
          <div className="flex justify-between">
            <span>Interact</span>
            <span className="font-mono">CLICK</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoized slot machine positions
const slotPositions = [
  // Front row
  { pos: [-8, 0, -5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-01' },
  { pos: [-4, 0, -5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-02' },
  { pos: [0, 0, -5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-03' },
  { pos: [4, 0, -5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-04' },
  { pos: [8, 0, -5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-05' },
  // Back row
  { pos: [-8, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-06' },
  { pos: [-4, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-07' },
  { pos: [0, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-08' },
  { pos: [4, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-09' },
  { pos: [8, 0, -10] as [number, number, number], rot: [0, 0, 0] as [number, number, number], id: 'slot-10' },
  // Sides
  { pos: [-12, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], id: 'slot-11' },
  { pos: [12, 0, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], id: 'slot-12' }
]

export function CasinoLoungeOptimized({ onMachineInteract }: CasinoLoungeOptimizedProps) {
  const [showEntrance, setShowEntrance] = useState(true)
  const [isEntered, setIsEntered] = useState(false)

  const handleEntranceComplete = () => {
    setShowEntrance(false)
    setIsEntered(true)
  }

  // Memoized materials
  const floorMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#2a0a0a"
      metalness={0.8}
      roughness={0.2}
    />
  ), [])

  const wallMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#1a1a1a"
      metalness={0.3}
      roughness={0.7}
    />
  ), [])

  return (
    <div className="w-full h-screen bg-black relative">
      {isEntered && <Instructions />}

      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false
        }}
        camera={{
          fov: 75,
          near: 0.1,
          far: 100,
          position: [0, 1.7, 5]
        }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          {isEntered && <OptimizedFPSController />}

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            {floorMaterial}
          </mesh>

          {/* Walls */}
          {[
            { pos: [0, 3, -15], size: [50, 6, 0.5] },
            { pos: [-15, 3, 0], size: [0.5, 6, 50] },
            { pos: [15, 3, 0], size: [0.5, 6, 50] }
          ].map((wall, i) => (
            <mesh key={i} position={wall.pos as [number, number, number]}>
              <boxGeometry args={wall.size as [number, number, number]} />
              {wallMaterial}
            </mesh>
          ))}

          {/* Slot Machines */}
          {slotPositions.map((slot) => (
            <SlotMachine3DSimple
              key={slot.id}
              position={slot.pos}
              rotation={slot.rot}
              machineId={slot.id}
              isActive
              onInteract={onMachineInteract}
            />
          ))}

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <Environment preset="night" />

          <Stars
            radius={50}
            depth={25}
            count={1000}
            factor={2}
            fade
            speed={0.5}
          />

          <fog attach="fog" args={['#0a0510', 8, 35]} />

          <spotLight
            position={[0, 10, 0]}
            angle={Math.PI / 4}
            penumbra={0.5}
            intensity={1.5}
            castShadow={false}
          />

          <Lightformer
            position={[0, 5, -10]}
            scale={[20, 2, 1]}
            intensity={1.5}
            color="#ff7a3b"
          />

          {/* Optimized post-processing (no SSAO) */}
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.4}
              luminanceThreshold={0.5}
              luminanceSmoothing={0.9}
              mipmapBlur={false}
            />
            <Vignette
              offset={0.3}
              darkness={0.5}
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
