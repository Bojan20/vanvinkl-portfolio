'use client'

import { Suspense, useState, useMemo, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { SlotMachineIGT } from '../3d/SlotMachineIGT'
import { ThirdPersonAvatar, ThirdPersonInstructions } from './ThirdPersonAvatar'
import { CasinoEntrance } from './CasinoEntrance'
import { SlotMachineDetailView } from './SlotMachineDetailView'
import { CameraRig } from '../3d/CameraRig'
import { AdvancedLighting } from '../3d/AdvancedLighting'
import { AdvancedPostProcessing } from '../3d/AdvancedPostProcessing'
import { CasinoArchitecture } from './CasinoArchitecture'
import { AvatarFollowLight } from './AvatarFollowLight'
import { AnimatePresence } from 'framer-motion'
import { useRenderingConfig } from '@/contexts/RenderingContext'
import * as THREE from 'three'

interface CasinoLoungeUltraProps {
  onMachineInteract?: (machineId: string) => void
}

// Portfolio sections - STRAIGHT LINE (original 6 machines)
const PORTFOLIO_MACHINES = (() => {
  const machines = [
    { id: 'skills', label: 'Skills' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About Me' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' }
  ]

  const spacing = 7 // Increased from 5 to prevent label overlap
  const totalWidth = (machines.length - 1) * spacing
  const startX = -totalWidth / 2

  return machines.map((m, i) => {
    const x = startX + i * spacing
    const z = -5
    return {
      ...m,
      pos: [x, 0, z] as [number, number, number],
      rot: [0, 0, 0] as [number, number, number]
    }
  })
})()

export function CasinoLoungeUltra({ onMachineInteract }: CasinoLoungeUltraProps) {
  // Rendering configuration
  const { config } = useRenderingConfig()

  const [showEntrance, setShowEntrance] = useState(true)
  const [isEntered, setIsEntered] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false) // Avatar visible after cinematic
  const [cameraMode, setCameraMode] = useState<'cinematic' | 'follow' | 'fixed'>('fixed')
  const [nearMachine, setNearMachine] = useState<string | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [hasMovedOnce, setHasMovedOnce] = useState(false)

  const avatarPositionRef = useRef(new THREE.Vector3(0, 0.5, 10))
  const avatarRotationRef = useRef(0) // Start facing forward toward slots (z=-5)

  const handleEntranceComplete = () => {
    setShowEntrance(false)
    setShowAvatar(true) // Show avatar immediately when entrance closes
    setIsEntered(true) // Enable input immediately
    // Keep camera in FIXED establishing shot mode initially
    // User can move to trigger follow mode
  }

  const handleCinematicComplete = () => {
    setIsEntered(true)
    setCameraMode('follow')
  }

  const handleProximityChange = (machineId: string | null) => {
    setNearMachine(machineId)
  }

  const handleAvatarMoved = () => {
    if (!hasMovedOnce && isEntered) {
      setHasMovedOnce(true)
      setCameraMode('follow') // Switch to follow mode on first movement
    }
  }

  const handleMachineSelect = (machineId: string) => {
    setSelectedMachine(machineId)
    onMachineInteract?.(machineId)
  }

  const handleCloseDetail = () => {
    setSelectedMachine(null)
  }

  // SPACE to interact
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && nearMachine && !selectedMachine) {
        e.preventDefault()
        handleMachineSelect(nearMachine)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nearMachine, selectedMachine])


  // Get selected machine label
  const selectedMachineData = PORTFOLIO_MACHINES.find(m => m.id === selectedMachine)

  return (
    <div className="w-full h-screen bg-black relative">
      {isEntered && <ThirdPersonInstructions nearMachine={nearMachine} />}

      {/* Detail view modal */}
      <AnimatePresence>
        {selectedMachine && selectedMachineData && (
          <SlotMachineDetailView
            key={selectedMachine}
            machineId={selectedMachine}
            label={selectedMachineData.label}
            onClose={handleCloseDetail}
          />
        )}
      </AnimatePresence>

      <Canvas
        shadows  // ENABLED — Real-time shadow system
        dpr={config.pixelRatio} // Quality-aware pixel ratio
        gl={{
          antialias: config.antialias, // Quality-aware antialiasing
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false
        }}
        camera={{
          fov: 75,
          near: 0.1,
          far: 100,
          position: [0, 1.7, 5]
        }}
        performance={{ min: 0.5 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          {/* AAA Cinematic Camera System */}
          <CameraRig
            mode={cameraMode}
            target={showAvatar ? avatarPositionRef.current : undefined}
            avatarRotation={avatarRotationRef.current}
            followOffset={[0, 6, 12]}
            cinematicSequence={undefined}
            onSequenceComplete={handleCinematicComplete}
          />

          {showAvatar && !selectedMachine && (
            <ThirdPersonAvatar
              onProximityChange={handleProximityChange}
              machinePositions={PORTFOLIO_MACHINES}
              positionRef={avatarPositionRef}
              rotationRef={avatarRotationRef}
              onMove={handleAvatarMoved}
            />
          )}

          {/* CASINO ARCHITECTURE (Vegas-style) - Fixed: removed ceiling, lightened fog */}
          <CasinoArchitecture animateEntrance={isEntered} />

          {/* Portfolio Slot Machines (6 total) */}
          {PORTFOLIO_MACHINES.map((machine) => (
            <SlotMachineIGT
              key={machine.id}
              position={machine.pos}
              rotation={machine.rot}
              machineId={machine.id}
              label={machine.label}
              isActive={nearMachine === machine.id}
              onInteract={() => handleMachineSelect(machine.id)}
            />
          ))}

          {/* AAA ADVANCED LIGHTING SYSTEM */}
          <AdvancedLighting
            machinePositions={PORTFOLIO_MACHINES}
            nearMachine={nearMachine}
            config={config}
          />

          {/* DYNAMIC AVATAR-FOLLOWING SPOTLIGHT WITH SHADOWS */}
          {showAvatar && <AvatarFollowLight avatarPositionRef={avatarPositionRef} />}

          {/* Stars for atmosphere (minimal for 60fps) */}
          <Stars
            radius={50}
            depth={30}
            count={150}
            factor={3}
            fade
            speed={0.3}
          />

          <fog attach="fog" args={['#050510', 25, 80]} />

          {/* AAA ADVANCED POST-PROCESSING STACK */}
          <AdvancedPostProcessing
            enableSSAO={config.enableSSAO}
            enableDOF={config.enableDOF}
          />
        </Suspense>
      </Canvas>

      {showEntrance && (
        <CasinoEntrance onComplete={handleEntranceComplete} />
      )}
    </div>
  )
}
