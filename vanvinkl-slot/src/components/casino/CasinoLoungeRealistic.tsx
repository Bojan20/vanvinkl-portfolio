'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import {
  Environment,
  ContactShadows,
  Sky,
  Stars,
  Lightformer
} from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  SSAO,
  DepthOfField
} from '@react-three/postprocessing'
import { SlotMachine3DRealistic } from './SlotMachine3DRealistic'
import { FirstPersonController, FirstPersonInstructions } from './FirstPersonController'
import { LoungeEnvironment } from './LoungeEnvironment'
import { CasinoEntrance } from './CasinoEntrance'
import * as THREE from 'three'

interface CasinoLoungeRealisticProps {
  onMachineInteract?: (machineId: string) => void
}

export function CasinoLoungeRealistic({ onMachineInteract }: CasinoLoungeRealisticProps) {
  const [playerPosition, setPlayerPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 5))
  const [showEntrance, setShowEntrance] = useState(true)
  const [isEntered, setIsEntered] = useState(false)

  const handleEntranceComplete = () => {
    setShowEntrance(false)
    setIsEntered(true)
  }

  return (
    <div className="w-full h-screen bg-black relative">
      {/* First Person Instructions */}
      {isEntered && <FirstPersonInstructions />}

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
          {/* Physics World */}
          <Physics gravity={[0, -9.81, 0]}>
            {/* First Person Controller (player) */}
            {isEntered && (
              <FirstPersonController
                position={[0, 1.7, 5]}
                speed={5}
                sprintMultiplier={1.8}
                jumpForce={6}
                onPositionChange={setPlayerPosition}
              />
            )}

            {/* Lounge Environment (walls, floor, ceiling) */}
            <LoungeEnvironment />

            {/* Slot Machines - Front Row */}
            <SlotMachine3DRealistic
              position={[-8, 0, -5]}
              rotation={[0, 0, 0]}
              machineId="slot-01"
              isActive={playerPosition.distanceTo(new THREE.Vector3(-8, 0, -5)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[-4, 0, -5]}
              rotation={[0, 0, 0]}
              machineId="slot-02"
              isActive={playerPosition.distanceTo(new THREE.Vector3(-4, 0, -5)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[0, 0, -5]}
              rotation={[0, 0, 0]}
              machineId="slot-03"
              isActive={playerPosition.distanceTo(new THREE.Vector3(0, 0, -5)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[4, 0, -5]}
              rotation={[0, 0, 0]}
              machineId="slot-04"
              isActive={playerPosition.distanceTo(new THREE.Vector3(4, 0, -5)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[8, 0, -5]}
              rotation={[0, 0, 0]}
              machineId="slot-05"
              isActive={playerPosition.distanceTo(new THREE.Vector3(8, 0, -5)) < 3}
              onInteract={onMachineInteract}
            />

            {/* Slot Machines - Back Row */}
            <SlotMachine3DRealistic
              position={[-8, 0, -10]}
              rotation={[0, 0, 0]}
              machineId="slot-06"
              isActive={playerPosition.distanceTo(new THREE.Vector3(-8, 0, -10)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[-4, 0, -10]}
              rotation={[0, 0, 0]}
              machineId="slot-07"
              isActive={playerPosition.distanceTo(new THREE.Vector3(-4, 0, -10)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[0, 0, -10]}
              rotation={[0, 0, 0]}
              machineId="slot-08"
              isActive={playerPosition.distanceTo(new THREE.Vector3(0, 0, -10)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[4, 0, -10]}
              rotation={[0, 0, 0]}
              machineId="slot-09"
              isActive={playerPosition.distanceTo(new THREE.Vector3(4, 0, -10)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[8, 0, -10]}
              rotation={[0, 0, 0]}
              machineId="slot-10"
              isActive={playerPosition.distanceTo(new THREE.Vector3(8, 0, -10)) < 3}
              onInteract={onMachineInteract}
            />

            {/* Side Machines (facing inward) */}
            <SlotMachine3DRealistic
              position={[-12, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              machineId="slot-11"
              isActive={playerPosition.distanceTo(new THREE.Vector3(-12, 0, 0)) < 3}
              onInteract={onMachineInteract}
            />

            <SlotMachine3DRealistic
              position={[12, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              machineId="slot-12"
              isActive={playerPosition.distanceTo(new THREE.Vector3(12, 0, 0)) < 3}
              onInteract={onMachineInteract}
            />
          </Physics>

          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <Environment preset="night" />

          {/* Sky and stars */}
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />

          {/* Volumetric fog */}
          <fog attach="fog" args={['#0a0510', 5, 40]} />

          {/* Key lights for dramatic effect */}
          <spotLight
            position={[0, 10, 0]}
            angle={Math.PI / 4}
            penumbra={0.5}
            intensity={2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />

          {/* Area lights for ambient illumination */}
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

          {/* Contact shadows for grounding */}
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.5}
            scale={100}
            blur={2}
            far={20}
          />

          {/* Post-processing effects */}
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

      {/* Entrance Animation Overlay */}
      {showEntrance && (
        <CasinoEntrance onComplete={handleEntranceComplete} />
      )}
    </div>
  )
}
