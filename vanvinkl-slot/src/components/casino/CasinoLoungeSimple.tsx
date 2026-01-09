'use client'

import { Suspense, useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  ContactShadows,
  Stars,
  Lightformer,
  PointerLockControls,
  OrbitControls
} from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  SSAO
} from '@react-three/postprocessing'
import { SlotMachine3DSimple } from './SlotMachine3DSimple'
import { CasinoEntrance } from './CasinoEntrance'
import * as THREE from 'three'
import { useEffect } from 'react'

interface CasinoLoungeSimpleProps {
  onMachineInteract?: (machineId: string) => void
}

// Simple FPS controller WITHOUT physics
function SimpleFPSController() {
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

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    const speed = keys.current.sprint ? 10 : 5

    // Get camera direction
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

    // Update camera position
    camera.position.add(velocity.current)

    // Keep camera above ground
    if (camera.position.y < 1.7) camera.position.y = 1.7
    if (camera.position.y > 1.7) camera.position.y = 1.7

    // Boundary limits
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

    document.addEventListener('pointerlockchange', handleLockChange)
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
          Click anywhere to start exploring
        </p>
        <div className="space-y-2 text-sm text-white/60">
          <div className="flex justify-between">
            <span>Move</span>
            <span className="font-mono">W A S D</span>
          </div>
          <div className="flex justify-between">
            <span>Look Around</span>
            <span className="font-mono">MOUSE</span>
          </div>
          <div className="flex justify-between">
            <span>Sprint</span>
            <span className="font-mono">SHIFT</span>
          </div>
          <div className="flex justify-between">
            <span>Interact</span>
            <span className="font-mono">CLICK MACHINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CasinoLoungeSimple({ onMachineInteract }: CasinoLoungeSimpleProps) {
  const [playerPosition, setPlayerPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 1.7, 5))
  const [showEntrance, setShowEntrance] = useState(true)
  const [isEntered, setIsEntered] = useState(false)

  const handleEntranceComplete = () => {
    setShowEntrance(false)
    setIsEntered(true)
  }

  return (
    <div className="w-full h-screen bg-black relative">
      {/* Instructions */}
      {isEntered && <Instructions />}

      {/* Three.js Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        dpr={[1, 2]}
        camera={{
          fov: 75,
          near: 0.1,
          far: 100,
          position: [0, 1.7, 5]
        }}
      >
        <Suspense fallback={null}>
          {/* FPS Controller (no physics) */}
          {isEntered && <SimpleFPSController />}

          {/* Simple Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial
              color="#2a0a0a"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Simple Walls */}
          {[
            { pos: [0, 3, -15], size: [50, 6, 0.5] },
            { pos: [-15, 3, 0], size: [0.5, 6, 50] },
            { pos: [15, 3, 0], size: [0.5, 6, 50] }
          ].map((wall, i) => (
            <mesh key={i} position={wall.pos as [number, number, number]} castShadow receiveShadow>
              <boxGeometry args={wall.size as [number, number, number]} />
              <meshStandardMaterial color="#1a0a0a" metalness={0.3} roughness={0.7} />
            </mesh>
          ))}

          {/* Slot Machines - Front Row */}
          <SlotMachine3DSimple
            position={[-8, 0, -5]}
            rotation={[0, 0, 0]}
            machineId="slot-01"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[-4, 0, -5]}
            rotation={[0, 0, 0]}
            machineId="slot-02"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[0, 0, -5]}
            rotation={[0, 0, 0]}
            machineId="slot-03"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[4, 0, -5]}
            rotation={[0, 0, 0]}
            machineId="slot-04"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[8, 0, -5]}
            rotation={[0, 0, 0]}
            machineId="slot-05"
            isActive
            onInteract={onMachineInteract}
          />

          {/* Slot Machines - Back Row */}
          <SlotMachine3DSimple
            position={[-8, 0, -10]}
            rotation={[0, 0, 0]}
            machineId="slot-06"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[-4, 0, -10]}
            rotation={[0, 0, 0]}
            machineId="slot-07"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[0, 0, -10]}
            rotation={[0, 0, 0]}
            machineId="slot-08"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[4, 0, -10]}
            rotation={[0, 0, 0]}
            machineId="slot-09"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[8, 0, -10]}
            rotation={[0, 0, 0]}
            machineId="slot-10"
            isActive
            onInteract={onMachineInteract}
          />

          {/* Side Machines */}
          <SlotMachine3DSimple
            position={[-12, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            machineId="slot-11"
            isActive
            onInteract={onMachineInteract}
          />

          <SlotMachine3DSimple
            position={[12, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            machineId="slot-12"
            isActive
            onInteract={onMachineInteract}
          />

          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <Environment preset="night" />

          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />

          <fog attach="fog" args={['#0a0510', 5, 40]} />

          <spotLight
            position={[0, 10, 0]}
            angle={Math.PI / 4}
            penumbra={0.5}
            intensity={2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />

          <Lightformer
            position={[0, 5, -10]}
            scale={[20, 2, 1]}
            intensity={2}
            color="#ff7a3b"
          />

          <Lightformer
            position={[-10, 3, 0]}
            scale={[2, 10, 1]}
            rotation={[0, Math.PI / 2, 0]}
            intensity={1.5}
            color="#40c8ff"
          />

          <Lightformer
            position={[10, 3, 0]}
            scale={[2, 10, 1]}
            rotation={[0, -Math.PI / 2, 0]}
            intensity={1.5}
            color="#40ff90"
          />

          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.5}
            scale={100}
            blur={2}
            far={20}
          />

          {/* Post-processing */}
          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <SSAO
              intensity={15}
              radius={5}
              luminanceInfluence={0.5}
            />
            <Vignette
              offset={0.3}
              darkness={0.6}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Entrance Animation */}
      {showEntrance && (
        <CasinoEntrance onComplete={handleEntranceComplete} />
      )}
    </div>
  )
}
