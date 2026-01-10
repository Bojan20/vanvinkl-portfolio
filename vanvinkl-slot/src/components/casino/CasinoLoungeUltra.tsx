'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars, Environment } from '@react-three/drei'
import { CyberpunkSlotMachine } from '../3d/CyberpunkSlotMachine'
import { ThirdPersonAvatar, ThirdPersonInstructions } from './ThirdPersonAvatar'
import { CasinoEntrance } from './CasinoEntrance'
import { SlotMachineDetailView } from './SlotMachineDetailView'
import { CameraRig } from '../3d/CameraRig'
import { AdvancedLighting } from '../3d/AdvancedLighting'
import { AdvancedPostProcessing } from '../3d/AdvancedPostProcessing'
import { CasinoArchitecture } from './CasinoArchitecture'
import { AvatarFollowLight } from './AvatarFollowLight'
import { SpatialAudioSystem } from '../3d/SpatialAudioSystem'
import { OnboardingFlow, isFirstVisit } from './OnboardingFlow'
import { MobileControls } from './MobileControls'
import { AnimatePresence, motion } from 'framer-motion'
import { useRenderingConfig } from '@/contexts/RenderingContext'
import * as THREE from 'three'

interface CasinoLoungeUltraProps {
  onMachineInteract?: (machineId: string) => void
}

// Portfolio sections - STRAIGHT LINE (6 cyberpunk machines)
const PORTFOLIO_MACHINES = (() => {
  const machines = [
    { id: 'skills', label: 'Skills' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About Me' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' }
  ]

  const spacing = 5.5 // Wider for cyberpunk machines
  const totalWidth = (machines.length - 1) * spacing
  const startX = -totalWidth / 2

  return machines.map((m, i) => {
    const x = startX + i * spacing
    const z = -6 // Slightly back
    return {
      ...m,
      pos: [x, 0, z] as [number, number, number],
      rot: [0, 0, 0] as [number, number, number]
    }
  })
})()

export function CasinoLoungeUltra({ onMachineInteract }: CasinoLoungeUltraProps) {
  const { config } = useRenderingConfig()

  const [showEntrance, setShowEntrance] = useState(true)
  const [isEntered, setIsEntered] = useState(false)
  const [canvasFadeIn, setCanvasFadeIn] = useState(false)
  const [showAvatar, setShowAvatar] = useState(true)
  const [cameraMode, setCameraMode] = useState<'cinematic' | 'follow' | 'fixed'>('fixed')
  const [nearMachine, setNearMachine] = useState<string | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [hasMovedOnce, setHasMovedOnce] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  // Check for first-time visitor on mount
  useEffect(() => {
    if (isFirstVisit()) {
      setShowOnboarding(true)
      setOnboardingComplete(false)
    } else {
      setOnboardingComplete(true)
    }
  }, [])

  // Mobile controls state
  const [mobileInput, setMobileInput] = useState<{ x: number; y: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const avatarPositionRef = useRef(new THREE.Vector3(0, 0.5, 10))
  const avatarRotationRef = useRef(0)

  const [canvasReady, setCanvasReady] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window ||
                           navigator.maxTouchPoints > 0 ||
                           window.innerWidth < 1024
      setIsMobile(isTouchDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setCanvasReady(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showEntrance) {
      const timer = setTimeout(() => setCanvasFadeIn(true), 1100)
      return () => clearTimeout(timer)
    }
  }, [showEntrance])

  const handleEntranceComplete = () => {
    setShowEntrance(false)
    setIsEntered(true)
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setOnboardingComplete(true)
    setShowAvatar(true)
    setIsEntered(true)
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
      setCameraMode('follow')
    }
  }

  const handleMachineSelect = useCallback((machineId: string) => {
    setSelectedMachine(machineId)
    onMachineInteract?.(machineId)
  }, [onMachineInteract])

  const handleCloseDetail = () => {
    setSelectedMachine(null)
  }

  // Mobile joystick handler
  const handleMobileMove = useCallback((direction: { x: number; y: number } | null) => {
    setMobileInput(direction)
  }, [])

  // Mobile interact handler
  const handleMobileInteract = useCallback(() => {
    if (nearMachine && !selectedMachine) {
      handleMachineSelect(nearMachine)
    }
  }, [nearMachine, selectedMachine, handleMachineSelect])

  // SPACE to interact (keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && nearMachine && !selectedMachine) {
        e.preventDefault()
        handleMachineSelect(nearMachine)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nearMachine, selectedMachine, handleMachineSelect])

  const selectedMachineData = PORTFOLIO_MACHINES.find(m => m.id === selectedMachine)

  return (
    <div className="w-full h-screen bg-black relative">
      {/* Onboarding flow - shows after entrance for first-time visitors */}
      {!showEntrance && showOnboarding && !onboardingComplete && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {/* Instructions (hidden on mobile) */}
      {isEntered && <ThirdPersonInstructions nearMachine={nearMachine} isMobile={isMobile} />}

      {/* Mobile controls */}
      {isEntered && !selectedMachine && (
        <MobileControls
          onMove={handleMobileMove}
          onInteract={handleMobileInteract}
          showInteract={!!nearMachine}
        />
      )}

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

      {/* Canvas */}
      <motion.div
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: canvasFadeIn ? 1 : 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        {canvasReady && <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false
          }}
          camera={{
            fov: 75,
            near: 0.1,
            far: 80,
            position: [0, 1.7, 5]
          }}
          performance={{ min: 0.5, max: 1, debounce: 200 }}
          frameloop="always"
        >
        <Suspense fallback={null}>
          <CameraRig
            mode={cameraMode}
            target={showAvatar ? avatarPositionRef.current : undefined}
            avatarRotation={avatarRotationRef.current}
            followOffset={[0, 6, 12]}
            cinematicSequence={undefined}
            onSequenceComplete={handleCinematicComplete}
          />

          {showAvatar && !selectedMachine && (
            <>
              <ThirdPersonAvatar
                onProximityChange={handleProximityChange}
                machinePositions={PORTFOLIO_MACHINES}
                positionRef={avatarPositionRef}
                rotationRef={avatarRotationRef}
                onMove={handleAvatarMoved}
                nearMachine={nearMachine}
                mobileInput={mobileInput}
              />

              <SpatialAudioSystem
                machinePositions={PORTFOLIO_MACHINES}
                nearMachine={nearMachine}
              />
            </>
          )}

          <CasinoArchitecture animateEntrance={isEntered} />

          {/* Environment for realistic reflections - warm casino */}
          <Environment preset="sunset" environmentIntensity={0.6} />

          {/* ContactShadows removed for performance */}

          {PORTFOLIO_MACHINES.map((machine) => (
            <CyberpunkSlotMachine
              key={machine.id}
              position={machine.pos}
              rotation={machine.rot}
              machineId={machine.id}
              label={machine.label}
              isActive={nearMachine === machine.id}
              onInteract={() => handleMachineSelect(machine.id)}
            />
          ))}

          <AdvancedLighting
            machinePositions={PORTFOLIO_MACHINES}
            nearMachine={nearMachine}
            config={config}
          />

          {showAvatar && <AvatarFollowLight avatarPositionRef={avatarPositionRef} />}

          <Stars
            radius={50}
            depth={30}
            count={150}
            factor={3}
            fade
            speed={0.3}
          />

          <fog attach="fog" args={['#1a1510', 40, 100]} />

          
          <AdvancedPostProcessing
            enableSSAO={config.enableSSAO}
            enableDOF={config.enableDOF}
            quality={isMobile ? 'medium' : 'high'}
          />
        </Suspense>
        </Canvas>}
      </motion.div>

      {showEntrance && (
        <CasinoEntrance onComplete={handleEntranceComplete} />
      )}
    </div>
  )
}
