/**
 * VanVinkl Casino - Cyberpunk Lounge
 *
 * Clean cyberpunk aesthetic with neon accent lighting
 */

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, FXAA, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

import { CyberpunkSlotMachine } from './CyberpunkSlotMachine'
import { Avatar } from './Avatar'
import { AvatarEffects } from './AvatarEffects'
import { ProximityIndicator } from './ProximityFeedback'
import { WinCelebrationGPU } from './GPUParticles'
import { DustParticles } from './DustParticles'
import { PostProcessing } from './PostProcessing'
import { ContextHandler } from './WebGLErrorBoundary'

// Scene components (extracted for maintainability)
import {
  SHARED_MATERIALS,
  COLORS,
  NeonStrip,
  GodRaySource,
  VIPCouch,
  CoffeeTable,
  TrophyRoom,
  FloatingSitSign,
  LogoWall,
  LogoHint,
  FloatingLetters
} from './scene'

import { uaPlay, uaPlaySynth } from '../audio'
import { getEffectiveQuality } from '../store/quality'

// ============================================
// SCENE CONFIGURATION
// ============================================

const MACHINES = [
  { id: 'skills', label: 'SKILLS', x: -15 },
  { id: 'services', label: 'SERVICES', x: -9 },
  { id: 'about', label: 'ABOUT', x: -3 },
  { id: 'projects', label: 'PROJECTS', x: 3 },
  { id: 'experience', label: 'EXPERIENCE', x: 9 },
  { id: 'contact', label: 'CONTACT', x: 15 }
]

const MACHINE_Z = -3
const MACHINE_POSITIONS = MACHINES.map(m => ({ x: m.x, z: MACHINE_Z }))

const COUCH_POSITIONS = [
  { id: 'left-1', x: -26, z: 8, rotation: Math.PI / 2, seatX: -26, seatZ: 8, standX: -24, standZ: 8 },
  { id: 'left-2', x: -26, z: 12, rotation: Math.PI / 2, seatX: -26, seatZ: 12, standX: -24, standZ: 12 },
  { id: 'right-1', x: 26, z: 8, rotation: -Math.PI / 2, seatX: 26, seatZ: 8, standX: 24, standZ: 8 },
  { id: 'right-2', x: 26, z: 12, rotation: -Math.PI / 2, seatX: 26, seatZ: 12, standX: 24, standZ: 12 },
  { id: 'center-1', x: -4, z: -8, rotation: 0, seatX: -4, seatZ: -8, standX: -4, standZ: -6 },
  { id: 'center-2', x: 4, z: -8, rotation: 0, seatX: 4, seatZ: -8, standX: 4, standZ: -6 }
]

const COLLISION_BOXES = [
  { x: -26, z: 8, width: 1.2, depth: 3.0 },
  { x: -26, z: 12, width: 1.2, depth: 3.0 },
  { x: -24.5, z: 10, width: 1.2, depth: 0.7 },
  { x: 26, z: 8, width: 1.2, depth: 3.0 },
  { x: 26, z: 12, width: 1.2, depth: 3.0 },
  { x: 24.5, z: 10, width: 1.2, depth: 0.7 },
  { x: -4, z: -8, width: 3.0, depth: 1.2 },
  { x: 4, z: -8, width: 3.0, depth: 1.2 },
  { x: 0, z: -6.5, width: 1.2, depth: 0.7 },
  { x: 0, z: -10, width: 20, depth: 1.5 }
]

// ============================================
// CASINO SCENE COMPONENT
// ============================================

interface CasinoSceneProps {
  onShowModal?: (machineId: string) => void
  onSlotSpin?: (machineId: string) => void
  onSitChange?: (isSitting: boolean) => void
  introActive?: boolean
  slotOpen?: boolean
  audioSettingsOpen?: boolean
  mobileMovementRef?: React.MutableRefObject<{ x: number; y: number }>
}

export function CasinoScene({ onSlotSpin, onSitChange, introActive = false, slotOpen = false, audioSettingsOpen = false, mobileMovementRef }: CasinoSceneProps) {
  const { camera } = useThree()
  const avatarPos = useRef(new THREE.Vector3(0, 0, 10))
  const avatarRotation = useRef(0)
  const isMovingRef = useRef(false)
  const lastFootstepTime = useRef(0)
  const footstepFoot = useRef(0) // 0 = left, 1 = right (alternating)

  // State refs (avoid re-renders)
  const nearMachineRef = useRef<string | null>(null)
  const spinningMachineRef = useRef<string | null>(null)
  const winMachineRef = useRef<string | null>(null)
  const isJackpotRef = useRef(false)
  const nearCouchRef = useRef<typeof COUCH_POSITIONS[0] | null>(null)
  const [nearLogo, setNearLogo] = useState(false)
  const isSittingRef = useRef(false)
  const sittingRotationRef = useRef(0)
  const currentCouch = useRef<typeof COUCH_POSITIONS[0] | null>(null)

  const [, forceUpdate] = useState(0)

  // Orbital camera state
  const orbitAngle = useRef(0)
  const orbitPitch = useRef(0.3)
  const orbitDistance = useRef(6)
  const orbitKeys = useRef({ left: false, right: false, up: false, down: false })

  // Keyboard handlers for orbital camera when sitting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSittingRef.current) return
      switch (e.code) {
        case 'ArrowLeft': orbitKeys.current.left = true; e.preventDefault(); break
        case 'ArrowRight': orbitKeys.current.right = true; e.preventDefault(); break
        case 'ArrowUp': orbitKeys.current.up = true; e.preventDefault(); break
        case 'ArrowDown': orbitKeys.current.down = true; e.preventDefault(); break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft': orbitKeys.current.left = false; break
        case 'ArrowRight': orbitKeys.current.right = false; break
        case 'ArrowUp': orbitKeys.current.up = false; break
        case 'ArrowDown': orbitKeys.current.down = false; break
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isSittingRef.current) return
      orbitDistance.current = Math.max(3, Math.min(12, orbitDistance.current + e.deltaY * 0.01))
    }

    // Two-finger touch for camera control
    const lastTouchPos = { x: 0, y: 0 }
    let twoFingerActive = false

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        twoFingerActive = true
        lastTouchPos.x = e.touches[1].clientX
        lastTouchPos.y = e.touches[1].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && twoFingerActive) {
        e.preventDefault()
        const deltaX = e.touches[1].clientX - lastTouchPos.x
        const deltaY = e.touches[1].clientY - lastTouchPos.y
        orbitAngle.current -= deltaX * 0.005
        orbitPitch.current = Math.max(0.1, Math.min(1.2, orbitPitch.current - deltaY * 0.003))
        lastTouchPos.x = e.touches[1].clientX
        lastTouchPos.y = e.touches[1].clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) twoFingerActive = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('wheel', handleWheel)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Handle SPACE key for spinning OR sitting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()

        if (isSittingRef.current && currentCouch.current) {
          avatarPos.current.x = currentCouch.current.standX
          avatarPos.current.z = currentCouch.current.standZ
          orbitAngle.current = 0
          orbitPitch.current = 0.3
          orbitDistance.current = 6
          orbitKeys.current = { left: false, right: false, up: false, down: false }
          currentCouch.current = null
          isSittingRef.current = false
          onSitChange?.(false)
          return
        }

        if (nearMachineRef.current && !spinningMachineRef.current) {
          spinningMachineRef.current = nearMachineRef.current
          forceUpdate(n => n + 1)
          onSlotSpin?.(nearMachineRef.current)
          setTimeout(() => {
            spinningMachineRef.current = null
            forceUpdate(n => n + 1)
          }, 500)
          return
        }

        if (nearCouchRef.current && !isSittingRef.current) {
          uaPlaySynth('uiOpen', 0.5)
          isSittingRef.current = true
          sittingRotationRef.current = nearCouchRef.current.rotation
          currentCouch.current = nearCouchRef.current
          avatarPos.current.x = nearCouchRef.current.seatX
          avatarPos.current.z = nearCouchRef.current.seatZ
          onSitChange?.(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSlotSpin, onSitChange])

  useFrame((state) => {
    if (introActive) return

    // Footstep sounds - alternate between feet for realism
    if (isMovingRef.current && !isSittingRef.current && !introActive) {
      const now = state.clock.elapsedTime
      if (now - lastFootstepTime.current > 0.4) {
        // Alternate between footstep1 and footstep2 (left/right foot)
        const step = footstepFoot.current === 0 ? 'footstep1' : 'footstep2'
        uaPlay(step)
        footstepFoot.current = footstepFoot.current === 0 ? 1 : 0
        lastFootstepTime.current = now
      }
    }

    // Camera control
    if (isSittingRef.current) {
      const rotSpeed = 5.0
      const pitchSpeed = 3.0
      const dt = 1/60
      if (orbitKeys.current.left) orbitAngle.current += rotSpeed * dt
      if (orbitKeys.current.right) orbitAngle.current -= rotSpeed * dt
      if (orbitKeys.current.up) orbitPitch.current = Math.min(0.8, orbitPitch.current + pitchSpeed * dt)
      if (orbitKeys.current.down) orbitPitch.current = Math.max(0.1, orbitPitch.current - pitchSpeed * dt)

      if (mobileMovementRef && (mobileMovementRef.current.x !== 0 || mobileMovementRef.current.y !== 0)) {
        orbitAngle.current -= mobileMovementRef.current.x * 0.02
        orbitPitch.current = Math.max(0.1, Math.min(0.8, orbitPitch.current - mobileMovementRef.current.y * 0.015))
      }

      const { x: avatarX, z: avatarZ } = avatarPos.current
      const avatarY = 1.0
      const dist = orbitDistance.current
      const pitch = orbitPitch.current
      const angle = orbitAngle.current

      camera.position.x = avatarX + Math.sin(angle) * Math.cos(pitch) * dist
      camera.position.y = avatarY + Math.sin(pitch) * dist + 1.5
      camera.position.z = avatarZ + Math.cos(angle) * Math.cos(pitch) * dist
      camera.lookAt(avatarX, avatarY + 0.5, avatarZ)
    } else {
      camera.position.x = avatarPos.current.x
      camera.position.y = avatarPos.current.y + 4
      camera.position.z = avatarPos.current.z + 10
      camera.lookAt(avatarPos.current.x, 1.5, avatarPos.current.z - 3)
    }

    // Proximity checks
    if (!isSittingRef.current) {
      let closestMachine: string | null = null
      let minDistSqMachine = 16
      for (const m of MACHINES) {
        const dx = avatarPos.current.x - m.x
        const dz = avatarPos.current.z - MACHINE_Z
        const distSq = dx * dx + dz * dz
        if (distSq < minDistSqMachine) {
          minDistSqMachine = distSq
          closestMachine = m.id
        }
      }
      nearMachineRef.current = closestMachine

      let closestCouch: typeof COUCH_POSITIONS[0] | null = null
      let minDistSqCouch = 9
      for (const couch of COUCH_POSITIONS) {
        const dx = avatarPos.current.x - couch.x
        const dz = avatarPos.current.z - couch.z
        const distSq = dx * dx + dz * dz
        if (distSq < minDistSqCouch) {
          minDistSqCouch = distSq
          closestCouch = couch
        }
      }
      nearCouchRef.current = closestCouch

      const logoX = 25, logoZ = -11.5
      const dxLogo = avatarPos.current.x - logoX
      const dzLogo = avatarPos.current.z - logoZ
      const distSqLogo = dxLogo * dxLogo + dzLogo * dzLogo
      const isNearLogo = distSqLogo < 64
      if (isNearLogo !== nearLogo) {
        if (isNearLogo) uaPlaySynth('uiOpen', 0.5)
        else uaPlaySynth('uiClose', 0.4)
        setNearLogo(isNearLogo)
      }
    }
  })

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  return (
    <>
      {/* ===== LIGHTING ===== */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={0.6} color="#ffffff" />
      <pointLight position={[0, 6, 0]} color={COLORS.purple} intensity={4} distance={40} />
      <pointLight position={[0, 4, 10]} color={COLORS.cyan} intensity={2} distance={30} />

      {/* ===== FLOOR ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
        <planeGeometry args={[70, 55]} />
        <MeshReflectorMaterial
          blur={[100, 40]}
          resolution={128}
          mixBlur={1}
          mixStrength={0.3}
          roughness={0.9}
          depthScale={0.8}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.2}
          color="#1a1520"
          metalness={0.3}
          mirror={0.15}
        />
      </mesh>

      {/* ===== CONTACT SHADOWS ===== */}
      <ContactShadows position={[0, 0.01, 5]} opacity={0.25} scale={80} blur={1.5} far={12} resolution={64} color="#000000" frames={1} />

      {/* Floor neon grid */}
      {[-20, -10, 0, 10, 20].map(x => (
        <NeonStrip key={`fx${x}`} color={COLORS.purple} position={[x, 0.01, 5]} size={[0.02, 0.01, 50]} />
      ))}
      {[-10, 0, 10, 20].map(z => (
        <NeonStrip key={`fz${z}`} color={COLORS.cyan} position={[0, 0.01, z]} size={[60, 0.01, 0.02]} />
      ))}

      {/* ===== WALLS ===== */}
      <mesh position={[0, 4.5, -12]} material={SHARED_MATERIALS.wall}><boxGeometry args={[70, 11, 0.3]} /></mesh>
      <mesh position={[0, 4.5, 32]} material={SHARED_MATERIALS.wall}><boxGeometry args={[70, 11, 0.3]} /></mesh>
      <mesh position={[-34, 4.5, 10]} material={SHARED_MATERIALS.wall}><boxGeometry args={[0.3, 11, 60]} /></mesh>
      <mesh position={[34, 4.5, 10]} material={SHARED_MATERIALS.wall}><boxGeometry args={[0.3, 11, 60]} /></mesh>

      {/* Wall neon accents */}
      <NeonStrip color={COLORS.magenta} position={[0, 1, -11.7]} size={[65, 0.06, 0.06]} holographic />
      <NeonStrip color={COLORS.cyan} position={[0, 8.5, -11.7]} size={[65, 0.06, 0.06]} holographic />
      <NeonStrip color={COLORS.purple} position={[-33.7, 4.5, 10]} size={[0.06, 8, 0.06]} audioReactive />
      <NeonStrip color={COLORS.purple} position={[33.7, 4.5, 10]} size={[0.06, 8, 0.06]} audioReactive />

      {/* God Ray sources */}
      <GodRaySource position={[0, 9, -10]} color={COLORS.purple} intensity={3} />
      <GodRaySource position={[-15, 9, 0]} color={COLORS.magenta} intensity={2} />
      <GodRaySource position={[15, 9, 0]} color={COLORS.cyan} intensity={2} />

      {/* ===== CEILING ===== */}
      <mesh position={[0, 9.5, 10]} material={SHARED_MATERIALS.ceiling}><boxGeometry args={[70, 0.2, 60]} /></mesh>
      <NeonStrip color={COLORS.magenta} position={[-15, 9.3, 10]} size={[0.04, 0.04, 55]} holographic />
      <NeonStrip color={COLORS.cyan} position={[15, 9.3, 10]} size={[0.04, 0.04, 55]} holographic />
      <NeonStrip color={COLORS.purple} position={[0, 9.3, -5]} size={[65, 0.04, 0.04]} audioReactive />
      <NeonStrip color={COLORS.purple} position={[0, 9.3, 15]} size={[65, 0.04, 0.04]} audioReactive />

      {/* Ceiling panels */}
      {[-22, -11, 0, 11, 22].map(x => (
        [-4, 6, 16].map(z => (
          <mesh key={`cp-${x}-${z}`} position={[x, 9.35, z]} material={SHARED_MATERIALS.ceilingPanel}>
            <boxGeometry args={[9, 0.08, 8]} />
          </mesh>
        ))
      ))}

      {/* ===== VIP LOUNGE AREAS ===== */}
      <group position={[-26, 0, 8]}>
        <VIPCouch position={[0, 0, 0]} rotation={Math.PI / 2} material={SHARED_MATERIALS.velvetPurple} />
        <VIPCouch position={[0, 0, 4]} rotation={Math.PI / 2} material={SHARED_MATERIALS.velvetPurple} />
        <CoffeeTable position={[1.5, 0, 2]} />
        <pointLight position={[0, 2.5, 2]} color={COLORS.magenta} intensity={1.5} distance={8} />
        <FloatingSitSign position={[0, 2.8, 2]} color={COLORS.magenta} />
      </group>

      <group position={[26, 0, 8]}>
        <VIPCouch position={[0, 0, 0]} rotation={-Math.PI / 2} material={SHARED_MATERIALS.velvetTeal} />
        <VIPCouch position={[0, 0, 4]} rotation={-Math.PI / 2} material={SHARED_MATERIALS.velvetTeal} />
        <CoffeeTable position={[-1.5, 0, 2]} />
        <pointLight position={[0, 2.5, 2]} color={COLORS.cyan} intensity={1.5} distance={8} />
        <FloatingSitSign position={[0, 2.8, 2]} color={COLORS.cyan} />
      </group>

      <group position={[0, 0, -8]}>
        <VIPCouch position={[-4, 0, 0]} rotation={0} material={SHARED_MATERIALS.velvetWine} />
        <VIPCouch position={[4, 0, 0]} rotation={0} material={SHARED_MATERIALS.velvetWine} />
        <CoffeeTable position={[0, 0, 1.5]} />
        <pointLight position={[0, 2.5, 0]} color={COLORS.purple} intensity={1.5} distance={8} />
        <FloatingSitSign position={[0, 2.8, 0]} color={COLORS.purple} />
      </group>

      {/* ===== BAR AREA ===== */}
      <group position={[0, 0, -10]}>
        <mesh position={[0, 0.95, 0]} material={SHARED_MATERIALS.barTop}><boxGeometry args={[20, 0.08, 1.2]} /></mesh>
        <mesh position={[0, 0.48, 0]} material={SHARED_MATERIALS.barBody}><boxGeometry args={[19.5, 0.9, 1.0]} /></mesh>
        <mesh position={[0, 2.5, -1]} material={SHARED_MATERIALS.barShelf}><boxGeometry args={[18, 4, 0.3]} /></mesh>
        <NeonStrip color={COLORS.gold} position={[0, 1.5, -0.8]} size={[17, 0.03, 0.03]} />
        <NeonStrip color={COLORS.cyan} position={[0, 0.05, 0.5]} size={[18, 0.02, 0.02]} />
      </group>

      {/* ===== TROPHY ROOM ===== */}
      <TrophyRoom position={[-28, 0, -8]} />

      {/* ===== LOGO ===== */}
      <LogoWall position={[25, 5, -11.5]} scale={1.5} />
      <LogoHint active={nearLogo} position={[25, 1.5, -10]} />

      {/* ===== FLOATING LETTERS ===== */}
      <FloatingLetters />

      {/* ===== VIP ROPE BARRIERS ===== */}
      {[-20, 20].map((x, i) => (
        <group key={`rope-${i}`}>
          <mesh position={[x, 0.5, 2]} material={SHARED_MATERIALS.goldChrome}><cylinderGeometry args={[0.04, 0.05, 1, 8]} /></mesh>
          <mesh position={[x, 1.02, 2]} material={SHARED_MATERIALS.goldChrome}><sphereGeometry args={[0.06, 12, 12]} /></mesh>
          <mesh position={[x, 0.5, 5]} material={SHARED_MATERIALS.goldChrome}><cylinderGeometry args={[0.04, 0.05, 1, 8]} /></mesh>
          <mesh position={[x, 1.02, 5]} material={SHARED_MATERIALS.goldChrome}><sphereGeometry args={[0.06, 12, 12]} /></mesh>
          <mesh position={[x, 0.9, 3.5]} material={SHARED_MATERIALS.velvetRope}><cylinderGeometry args={[0.025, 0.025, 3, 8]} /></mesh>
        </group>
      ))}

      {/* ===== AVATAR ===== */}
      <Avatar
        positionRef={avatarPos}
        rotationRef={avatarRotation}
        isMovingRef={isMovingRef}
        machinePositions={MACHINE_POSITIONS}
        collisionBoxes={COLLISION_BOXES}
        isSittingRef={isSittingRef}
        sittingRotationRef={sittingRotationRef}
        inputDisabled={slotOpen || audioSettingsOpen}
        mobileMovementRef={mobileMovementRef}
      />

      {/* ===== AVATAR EFFECTS ===== */}
      <AvatarEffects positionRef={avatarPos} isMovingRef={isMovingRef} />

      {/* ===== PROXIMITY FEEDBACK ===== */}
      {!introActive && (
        <ProximityIndicator
          avatarPosition={avatarPos.current}
          nearMachine={nearMachineRef.current}
          nearCouch={nearCouchRef.current}
          machinePositions={MACHINES.map(m => ({ id: m.id, x: m.x, z: MACHINE_Z }))}
          couchPositions={COUCH_POSITIONS.map(c => ({ id: c.id, x: c.x, z: c.z }))}
        />
      )}

      {/* ===== SLOT MACHINES ===== */}
      {MACHINES.map((m) => (
        <group key={m.id}>
          <CyberpunkSlotMachine
            position={[m.x, 0, MACHINE_Z]}
            label={m.label}
            nearMachineRef={nearMachineRef}
            spinningMachineRef={spinningMachineRef}
            machineId={m.id}
          />
          <WinCelebrationGPU
            position={[m.x, 3, MACHINE_Z + 1]}
            active={winMachineRef.current === m.id}
            isJackpot={isJackpotRef.current && winMachineRef.current === m.id}
          />
        </group>
      ))}

      {/* ===== AMBIENT DUST ===== */}
      <DustParticles count={isMobile ? 10 : 30} area={[60, 9, 50]} color="#8866ff" opacity={0.25} size={0.04} />

      {/* ===== FOG ===== */}
      <fog attach="fog" args={['#080412', 18, isMobile ? 40 : 55]} />

      {/* ===== POST-PROCESSING ===== */}
      {isMobile ? (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.9} levels={2} />
          <Vignette offset={0.3} darkness={0.5} />
        </EffectComposer>
      ) : (
        <PostProcessing
          quality={getEffectiveQuality()}
          enableSSAO={false}
          enableBloom={true}
          enableChromatic={true}
          enableVignette={true}
          enableNoise={false}
        />
      )}

      <ContextHandler />
    </>
  )
}
