/**
 * VanVinkl Casino - Cyberpunk Lounge
 *
 * Clean cyberpunk aesthetic:
 * - Neon accent lighting (magenta/cyan/purple)
 * - VIP lounge areas with modern couches
 * - Sleek architecture
 * - NO particles - clean look
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { CyberpunkSlotMachine } from './CyberpunkSlotMachine'
import { Avatar } from './Avatar'
import { ProximityIndicator } from './ProximityFeedback'
import { WinCelebrationGPU } from './GPUParticles'
import { DustParticles } from './DustParticles'
import { PostProcessing } from './PostProcessing'
import { ContextHandler } from './WebGLErrorBoundary'
import { useAudio, playFootstep, playReelStop } from '../audio'
import { COLORS as THEME_COLORS, SLOT_CONFIG, TIMING, DISTANCES } from '../store'

// ============================================
// SHARED MATERIALS - Created ONCE, reused everywhere
// This eliminates per-component material creation
// ============================================
const SHARED_MATERIALS = {
  // Floor
  floor: new THREE.MeshStandardMaterial({ color: '#1a1520', metalness: 0.4, roughness: 0.7 }),
  // Walls
  wall: new THREE.MeshStandardMaterial({ color: '#1a1420', metalness: 0.6, roughness: 0.4 }),
  // Ceiling
  ceiling: new THREE.MeshStandardMaterial({ color: '#151218', metalness: 0.7, roughness: 0.3 }),
  ceilingPanel: new THREE.MeshStandardMaterial({ color: '#201828', metalness: 0.8, roughness: 0.2 }),
  // Furniture
  velvetPurple: new THREE.MeshStandardMaterial({ color: '#6b2d7b', metalness: 0.05, roughness: 0.9 }),
  velvetTeal: new THREE.MeshStandardMaterial({ color: '#1a5c6b', metalness: 0.05, roughness: 0.9 }),
  velvetWine: new THREE.MeshStandardMaterial({ color: '#7b2d4a', metalness: 0.05, roughness: 0.9 }),
  goldChrome: new THREE.MeshStandardMaterial({ color: '#c9a227', metalness: 1, roughness: 0.15 }),
  chrome: new THREE.MeshStandardMaterial({ color: '#666', metalness: 1, roughness: 0.1 }),
  glass: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.25 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: '#0a0a12', metalness: 0.7, roughness: 0.3 }),
  // Bar
  barTop: new THREE.MeshStandardMaterial({ color: '#1a1a28', metalness: 0.8, roughness: 0.2 }),
  barBody: new THREE.MeshStandardMaterial({ color: '#080810', metalness: 0.6, roughness: 0.4 }),
  barShelf: new THREE.MeshStandardMaterial({ color: '#0a0a14', metalness: 0.5, roughness: 0.5 }),
  // Rope
  velvetRope: new THREE.MeshStandardMaterial({ color: '#8B0020', metalness: 0.2, roughness: 0.8 })
}

const COLORS = {
  magenta: '#ff00aa',
  cyan: '#00ffff',
  purple: '#8844ff',
  gold: '#ffd700',
  blue: '#4466ff',
  deepPurple: '#2a0040',
  black: '#050508'
}

const MACHINES = [
  { id: 'skills', label: 'SKILLS', x: -15 },
  { id: 'services', label: 'SERVICES', x: -9 },
  { id: 'about', label: 'ABOUT', x: -3 },
  { id: 'projects', label: 'PROJECTS', x: 3 },
  { id: 'experience', label: 'EXPERIENCE', x: 9 },
  { id: 'contact', label: 'CONTACT', x: 15 }
]

const MACHINE_Z = -3

// GPU-animated neon strip - shader does ALL work, zero JS per-frame
function NeonStrip({ color, position, size, pulse = false }: {
  color: string, position: [number, number, number], size: [number, number, number], intensity?: number, pulse?: boolean
}) {
  const mat = useMemo(() => {
    if (!pulse) {
      return new THREE.MeshBasicMaterial({ color, toneMapped: false })
    }
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        void main() {
          float pulse = 0.7 + 0.3 * sin(time * 3.0 + vUv.x * 10.0);
          gl_FragColor = vec4(color * pulse * 1.5, 1.0);
        }
      `,
      toneMapped: false
    })
  }, [color, pulse])

  // Only update time uniform if pulsing - still minimal overhead
  useFrame((state) => {
    if (pulse && mat instanceof THREE.ShaderMaterial) {
      mat.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={position} material={mat}>
      <boxGeometry args={size} />
    </mesh>
  )
}

// VIP Lounge Couch - Using SHARED materials
function VIPCouch({ position, rotation = 0, material }: {
  position: [number, number, number], rotation?: number, material: THREE.Material
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main seat - plush velvet */}
      <mesh position={[0, 0.35, 0]} material={material}>
        <boxGeometry args={[2.8, 0.45, 1.0]} />
      </mesh>

      {/* Back rest */}
      <mesh position={[0, 0.75, -0.4]} material={material}>
        <boxGeometry args={[2.8, 0.65, 0.25]} />
      </mesh>

      {/* Arm rests */}
      <mesh position={[-1.3, 0.55, 0]} material={material}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
      </mesh>
      <mesh position={[1.3, 0.55, 0]} material={material}>
        <boxGeometry args={[0.2, 0.5, 0.9]} />
      </mesh>

      {/* Gold chrome legs - SHARED material */}
      {[[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.35], [1.2, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} material={SHARED_MATERIALS.goldChrome}>
          <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
        </mesh>
      ))}

      {/* Neon accent under couch */}
      <NeonStrip
        color={COLORS.magenta}
        position={[0, 0.08, 0.4]}
        size={[2.4, 0.02, 0.02]}
        intensity={1.2}
      />
    </group>
  )
}

// Modern coffee table with glass top - SHARED materials
function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Glass top */}
      <mesh position={[0, 0.4, 0]} material={SHARED_MATERIALS.glass}>
        <boxGeometry args={[1.2, 0.03, 0.7]} />
      </mesh>

      {/* Chrome frame */}
      <mesh position={[0, 0.38, 0]} material={SHARED_MATERIALS.chrome}>
        <boxGeometry args={[1.25, 0.015, 0.75]} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.2, 0]} material={SHARED_MATERIALS.darkMetal}>
        <boxGeometry args={[0.8, 0.38, 0.5]} />
      </mesh>

      {/* Neon ring */}
      <NeonStrip
        color={COLORS.cyan}
        position={[0, 0.01, 0]}
        size={[0.9, 0.01, 0.6]}
        intensity={0.8}
      />
    </group>
  )
}

// Machine positions for collision
const MACHINE_POSITIONS = MACHINES.map(m => ({ x: m.x, z: MACHINE_Z }))

// Couch positions for sitting (detection area + seat position + stand up position)
// VIPCouch je 2.8 sirine, seat je na sredini kauča
// standX/standZ = pozicija ISPRED kauča gde avatar stoji kada ustane
const COUCH_POSITIONS = [
  // Left lounge - couches face right (player sits facing right = rotation PI/2)
  { id: 'left-1', x: -26, z: 8, rotation: Math.PI / 2, seatX: -26, seatZ: 8, standX: -24, standZ: 8 },
  { id: 'left-2', x: -26, z: 12, rotation: Math.PI / 2, seatX: -26, seatZ: 12, standX: -24, standZ: 12 },
  // Right lounge - couches face left (player sits facing left = rotation -PI/2)
  { id: 'right-1', x: 26, z: 8, rotation: -Math.PI / 2, seatX: 26, seatZ: 8, standX: 24, standZ: 8 },
  { id: 'right-2', x: 26, z: 12, rotation: -Math.PI / 2, seatX: 26, seatZ: 12, standX: 24, standZ: 12 },
  // Center back lounge - couches face forward (player sits facing camera = rotation 0)
  { id: 'center-1', x: -4, z: -8, rotation: 0, seatX: -4, seatZ: -8, standX: -4, standZ: -6 },
  { id: 'center-2', x: 4, z: -8, rotation: 0, seatX: 4, seatZ: -8, standX: 4, standZ: -6 }
]

// Collision boxes for furniture (couches, tables, bar)
// VIPCouch is 2.8 wide x 1.0 deep - when rotated 90deg, width/depth swap
const COLLISION_BOXES = [
  // Left lounge couches - rotated 90deg, so 1.0 wide x 2.8 deep
  { x: -26, z: 8, width: 1.2, depth: 3.0 },
  { x: -26, z: 12, width: 1.2, depth: 3.0 },
  // Left lounge coffee table (at group [-26,0,8] + offset [1.5,0,2] = [-24.5, 0, 10])
  { x: -24.5, z: 10, width: 1.2, depth: 0.7 },

  // Right lounge couches - rotated -90deg, so 1.0 wide x 2.8 deep
  { x: 26, z: 8, width: 1.2, depth: 3.0 },
  { x: 26, z: 12, width: 1.2, depth: 3.0 },
  // Right lounge coffee table (at group [26,0,8] + offset [-1.5,0,2] = [24.5, 0, 10])
  { x: 24.5, z: 10, width: 1.2, depth: 0.7 },

  // Center back lounge couches - NOT rotated, so 2.8 wide x 1.0 deep
  // (at group [0,0,-8] + offset [-4,0,0] = [-4, 0, -8])
  { x: -4, z: -8, width: 3.0, depth: 1.2 },
  { x: 4, z: -8, width: 3.0, depth: 1.2 },
  // Center coffee table (at group [0,0,-8] + offset [0,0,1.5] = [0, 0, -6.5])
  { x: 0, z: -6.5, width: 1.2, depth: 0.7 },

  // Bar counter
  { x: 0, z: -10, width: 20, depth: 1.5 }
]

// Info modal content for each slot
const SLOT_INFO: Record<string, { title: string; content: string[] }> = {
  skills: {
    title: 'SKILLS',
    content: [
      '🎮 Game Development - Unity, Unreal, Godot',
      '🌐 Web Dev - React, Three.js, TypeScript',
      '🎨 3D Art - Blender, Maya, Substance',
      '🔊 Audio - FMOD, Wwise, Sound Design',
      '💻 Programming - C#, C++, Rust, Python'
    ]
  },
  services: {
    title: 'SERVICES',
    content: [
      '🎰 Casino Game Development',
      '🎮 Slot Machine Design & Animation',
      '🌐 Interactive Web Experiences',
      '🔧 Custom Software Solutions',
      '📱 Cross-platform Development'
    ]
  },
  about: {
    title: 'ABOUT ME',
    content: [
      '👨‍💻 10+ Years Game Development',
      '🎯 Specializing in Casino & iGaming',
      '🏆 AAA Quality Standards',
      '🌍 Remote Work Available',
      '💬 English & Serbian Speaker'
    ]
  },
  projects: {
    title: 'PROJECTS',
    content: [
      '🎰 50+ Slot Machines Developed',
      '🃏 Casino Table Games',
      '🎮 Interactive 3D Experiences',
      '📊 Real-time Data Visualizations',
      '🔧 Custom Game Engines'
    ]
  },
  experience: {
    title: 'EXPERIENCE',
    content: [
      '🏢 Senior Game Developer @ Major Studios',
      '🎰 Lead Slot Developer @ iGaming Company',
      '🌐 Freelance Interactive Developer',
      '🎓 Computer Science Background',
      '📜 Multiple Certifications'
    ]
  },
  contact: {
    title: 'CONTACT',
    content: [
      '📧 email@vanvinkl.com',
      '💼 LinkedIn: /in/vanvinkl',
      '🐙 GitHub: /vanvinkl',
      '🌐 vanvinkl.com',
      '📱 Available for projects!'
    ]
  }
}

interface CasinoSceneProps {
  onShowModal?: (machineId: string) => void
  onSlotSpin?: (machineId: string) => void
  introActive?: boolean
  slotOpen?: boolean // When true, avatar input is disabled
}

export function CasinoScene({ onShowModal, onSlotSpin, introActive = false, slotOpen = false }: CasinoSceneProps) {
  const { camera } = useThree()
  const avatarPos = useRef(new THREE.Vector3(0, 0, 10))
  const avatarRotation = useRef(0)
  const isMovingRef = useRef(false)

  // Audio system
  const audio = useAudio()
  const lastFootstepTime = useRef(0)
  const audioInitialized = useRef(false)

  // ALL state as refs to avoid re-renders - ZERO LAG
  const nearMachineRef = useRef<string | null>(null)
  const spinningMachineRef = useRef<string | null>(null)
  const winMachineRef = useRef<string | null>(null)
  const isJackpotRef = useRef(false)
  const nearCouchRef = useRef<typeof COUCH_POSITIONS[0] | null>(null)
  const isSittingRef = useRef(false)
  const sittingRotationRef = useRef(0)
  const currentCouch = useRef<typeof COUCH_POSITIONS[0] | null>(null)

  // Force update for UI only when needed (modal, etc)
  const [, forceUpdate] = useState(0)

  // Orbital camera state for sitting
  const orbitAngle = useRef(0) // Horizontal angle around avatar
  const orbitPitch = useRef(0.3) // Vertical angle (0 = level, positive = looking down)
  const orbitDistance = useRef(6) // Distance from avatar

  // Arrow key state for orbital camera
  const orbitKeys = useRef({ left: false, right: false, up: false, down: false })

  // Keyboard handlers for orbital camera when sitting
  useEffect(() => {
    // Note: Using refs now, this effect just sets up listeners

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle orbit keys when sitting
      if (!isSittingRef.current) return

      switch (e.code) {
        case 'ArrowLeft':
          orbitKeys.current.left = true
          e.preventDefault()
          break
        case 'ArrowRight':
          orbitKeys.current.right = true
          e.preventDefault()
          break
        case 'ArrowUp':
          orbitKeys.current.up = true
          e.preventDefault()
          break
        case 'ArrowDown':
          orbitKeys.current.down = true
          e.preventDefault()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
          orbitKeys.current.left = false
          break
        case 'ArrowRight':
          orbitKeys.current.right = false
          break
        case 'ArrowUp':
          orbitKeys.current.up = false
          break
        case 'ArrowDown':
          orbitKeys.current.down = false
          break
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isSittingRef.current) return
      // Zoom in/out
      orbitDistance.current = Math.max(3, Math.min(12, orbitDistance.current + e.deltaY * 0.01))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('wheel', handleWheel)
    }
  }, []) // Empty deps - never re-create listeners

  // Initialize spatial audio when intro ends
  useEffect(() => {
    if (!introActive && !audioInitialized.current) {
      audioInitialized.current = true

      // Background ambient sounds DISABLED per user request
      // audio.playSpatial('casino-ambient', 'casinoHum', [0, 3, 0], {
      //   volume: 0.3,
      //   loop: true,
      //   refDistance: 20,
      //   maxDistance: 100,
      //   rolloffFactor: 0.5
      // })

      // Neon buzzes DISABLED per user request
      // const neonPositions: [number, number, number][] = [
      //   [-15, 4, -10],  // Back left
      //   [15, 4, -10],   // Back right
      //   [-25, 3, 8],    // Left lounge
      //   [25, 3, 8],     // Right lounge
      //   [0, 4, -10]     // Bar
      // ]
      //
      // neonPositions.forEach((pos, i) => {
      //   audio.playSpatial(`neon-${i}`, 'neonBuzz', pos, {
      //     volume: 0.15,
      //     loop: true,
      //     refDistance: 3,
      //     maxDistance: 15,
      //     rolloffFactor: 1.5
      //   })
      // })
    }
  }, [introActive, audio])

  // Handle SPACE key for spinning OR sitting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()

        // If sitting, stand up - move avatar to stand position (in front of couch)
        if (isSittingRef.current && currentCouch.current) {
          avatarPos.current.x = currentCouch.current.standX
          avatarPos.current.z = currentCouch.current.standZ
          // Reset orbit
          orbitAngle.current = 0
          orbitPitch.current = 0.3
          orbitDistance.current = 6
          orbitKeys.current = { left: false, right: false, up: false, down: false }
          currentCouch.current = null
          isSittingRef.current = false
          return
        }

        // Slot machine interaction - FAST animation (2.5s total)
        if (nearMachineRef.current && !spinningMachineRef.current) {
          spinningMachineRef.current = nearMachineRef.current
          forceUpdate(n => n + 1) // Update slot machines

          const machineId = nearMachineRef.current

          // Play spin sound
          audio.play('spinLoop', { volume: 0.6 })

          // Trigger slot transition overlay
          onSlotSpin?.(machineId)

          // Play reel stop sounds staggered
          setTimeout(() => playReelStop(0), 600)
          setTimeout(() => playReelStop(1), 800)
          setTimeout(() => playReelStop(2), 1000)
          setTimeout(() => playReelStop(3), 1200)
          setTimeout(() => playReelStop(4), 1400)

          // After spin completes (1.5s), trigger WIN CELEBRATION
          setTimeout(() => {
            // Random jackpot chance (20%)
            isJackpotRef.current = Math.random() < 0.2
            winMachineRef.current = machineId
            forceUpdate(n => n + 1)

            // Play win sound
            if (isJackpotRef.current) {
              audio.play('jackpot', { volume: 0.8 })
            } else {
              audio.play('winBig', { volume: 0.7 })
            }

            // Win celebration is SHORTER (1.0s), then show modal
            setTimeout(() => {
              if (onShowModal) {
                audio.play('modalOpen', { volume: 0.5 })
                onShowModal(machineId)
              }
              winMachineRef.current = null
              spinningMachineRef.current = null
              isJackpotRef.current = false
              forceUpdate(n => n + 1)
            }, 1000)
          }, 1500)
          return
        }

        // Couch sitting interaction
        if (nearCouchRef.current && !isSittingRef.current) {
          audio.play('sit', { volume: 0.5 })
          isSittingRef.current = true
          sittingRotationRef.current = nearCouchRef.current.rotation
          currentCouch.current = nearCouchRef.current
          // Move avatar to seat position
          avatarPos.current.x = nearCouchRef.current.seatX
          avatarPos.current.z = nearCouchRef.current.seatZ
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onShowModal, onSlotSpin, audio]) // Include audio

  useFrame((state) => {
    // Skip camera control during intro
    if (introActive) return

    // Update audio listener position (follows camera)
    const camPos = camera.position
    const camDir = new THREE.Vector3()
    camera.getWorldDirection(camDir)
    audio.updateListener(
      [camPos.x, camPos.y, camPos.z],
      [camDir.x, camDir.y, camDir.z]
    )

    // Footstep sounds when moving
    if (isMovingRef.current && !isSittingRef.current) {
      const now = state.clock.elapsedTime
      if (now - lastFootstepTime.current > 0.35) { // ~2.8 steps per second
        playFootstep(0.4)
        lastFootstepTime.current = now
      }
    }

    if (isSittingRef.current) {
      // ZERO LAG orbit - direct set, no lerp
      const rotSpeed = 5.0
      const pitchSpeed = 3.0
      const dt = 1/60 // Fixed step for consistent speed
      if (orbitKeys.current.left) orbitAngle.current += rotSpeed * dt
      if (orbitKeys.current.right) orbitAngle.current -= rotSpeed * dt
      if (orbitKeys.current.up) orbitPitch.current = Math.min(0.8, orbitPitch.current + pitchSpeed * dt)
      if (orbitKeys.current.down) orbitPitch.current = Math.max(0.1, orbitPitch.current - pitchSpeed * dt)

      const avatarX = avatarPos.current.x
      const avatarZ = avatarPos.current.z
      const avatarY = 1.0

      const dist = orbitDistance.current
      const pitch = orbitPitch.current
      const angle = orbitAngle.current

      // DIRECT SET - ZERO lerp
      camera.position.x = avatarX + Math.sin(angle) * Math.cos(pitch) * dist
      camera.position.y = avatarY + Math.sin(pitch) * dist + 1.5
      camera.position.z = avatarZ + Math.cos(angle) * Math.cos(pitch) * dist
      camera.lookAt(avatarX, avatarY + 0.5, avatarZ)
    } else {
      // FOLLOW CAMERA - DIRECT SET, ZERO lerp
      camera.position.x = avatarPos.current.x
      camera.position.y = avatarPos.current.y + 4
      camera.position.z = avatarPos.current.z + 10
      camera.lookAt(avatarPos.current.x, 1.5, avatarPos.current.z - 3)
    }

    // Proximity check - EVERY FRAME, NO setState (uses refs)
    // Using distance² to avoid sqrt - compare with threshold²
    if (!isSittingRef.current) {
      // Check slot machines (threshold: 4, so 4² = 16)
      let closestMachine: string | null = null
      let minDistSqMachine = 16 // 4²
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

      // Check couches (threshold: 3, so 3² = 9)
      let closestCouch: typeof COUCH_POSITIONS[0] | null = null
      let minDistSqCouch = 9 // 3²
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
    }
  })

  return (
    <>
      {/* ===== LIGHTING - MINIMAL ===== */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={0.6} color="#ffffff" />

      {/* Only 2 accent lights */}
      <pointLight position={[0, 6, 0]} color={COLORS.purple} intensity={4} distance={40} />
      <pointLight position={[0, 4, 10]} color={COLORS.cyan} intensity={2} distance={30} />

      {/* Environment removed for performance */}

      {/* ===== FLOOR - SHARED material ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 5]} material={SHARED_MATERIALS.floor}>
        <planeGeometry args={[70, 55]} />
      </mesh>

      {/* Floor neon grid lines */}
      {[-20, -10, 0, 10, 20].map(x => (
        <NeonStrip key={`fx${x}`} color={COLORS.purple} position={[x, 0.01, 5]} size={[0.02, 0.01, 50]} intensity={0.4} />
      ))}
      {[-10, 0, 10, 20].map(z => (
        <NeonStrip key={`fz${z}`} color={COLORS.cyan} position={[0, 0.01, z]} size={[60, 0.01, 0.02]} intensity={0.3} />
      ))}

      {/* ===== WALLS - SHARED material ===== */}
      {/* Back wall */}
      <mesh position={[0, 4.5, -12]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[70, 11, 0.3]} />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 4.5, 32]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[70, 11, 0.3]} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-34, 4.5, 10]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[0.3, 11, 60]} />
      </mesh>
      <mesh position={[34, 4.5, 10]} material={SHARED_MATERIALS.wall}>
        <boxGeometry args={[0.3, 11, 60]} />
      </mesh>

      {/* Wall neon accents - PULSING */}
      <NeonStrip color={COLORS.magenta} position={[0, 1, -11.7]} size={[65, 0.06, 0.06]} pulse />
      <NeonStrip color={COLORS.cyan} position={[0, 8.5, -11.7]} size={[65, 0.06, 0.06]} pulse />
      <NeonStrip color={COLORS.purple} position={[-33.7, 4.5, 10]} size={[0.06, 8, 0.06]} />
      <NeonStrip color={COLORS.purple} position={[33.7, 4.5, 10]} size={[0.06, 8, 0.06]} />

      {/* ===== CEILING - SHARED material ===== */}
      <mesh position={[0, 9.5, 10]} material={SHARED_MATERIALS.ceiling}>
        <boxGeometry args={[70, 0.2, 60]} />
      </mesh>

      {/* Ceiling neon grid - PULSING */}
      <NeonStrip color={COLORS.magenta} position={[-15, 9.3, 10]} size={[0.04, 0.04, 55]} pulse />
      <NeonStrip color={COLORS.cyan} position={[15, 9.3, 10]} size={[0.04, 0.04, 55]} pulse />
      <NeonStrip color={COLORS.purple} position={[0, 9.3, -5]} size={[65, 0.04, 0.04]} pulse />
      <NeonStrip color={COLORS.purple} position={[0, 9.3, 15]} size={[65, 0.04, 0.04]} pulse />

      {/* Ceiling panels - SHARED material */}
      {[-22, -11, 0, 11, 22].map(x => (
        [-4, 6, 16].map(z => (
          <mesh key={`cp-${x}-${z}`} position={[x, 9.35, z]} material={SHARED_MATERIALS.ceilingPanel}>
            <boxGeometry args={[9, 0.08, 8]} />
          </mesh>
        ))
      ))}

      {/* ===== VIP LOUNGE AREAS - SHARED materials ===== */}

      {/* Left lounge - Royal Purple velvet */}
      <group position={[-26, 0, 8]}>
        <VIPCouch position={[0, 0, 0]} rotation={Math.PI / 2} material={SHARED_MATERIALS.velvetPurple} />
        <VIPCouch position={[0, 0, 4]} rotation={Math.PI / 2} material={SHARED_MATERIALS.velvetPurple} />
        <CoffeeTable position={[1.5, 0, 2]} />
        <pointLight position={[0, 2.5, 2]} color={COLORS.magenta} intensity={1.5} distance={8} />
      </group>

      {/* Right lounge - Deep Teal velvet */}
      <group position={[26, 0, 8]}>
        <VIPCouch position={[0, 0, 0]} rotation={-Math.PI / 2} material={SHARED_MATERIALS.velvetTeal} />
        <VIPCouch position={[0, 0, 4]} rotation={-Math.PI / 2} material={SHARED_MATERIALS.velvetTeal} />
        <CoffeeTable position={[-1.5, 0, 2]} />
        <pointLight position={[0, 2.5, 2]} color={COLORS.cyan} intensity={1.5} distance={8} />
      </group>

      {/* Center back lounge - Wine Red velvet */}
      <group position={[0, 0, -8]}>
        <VIPCouch position={[-4, 0, 0]} rotation={0} material={SHARED_MATERIALS.velvetWine} />
        <VIPCouch position={[4, 0, 0]} rotation={0} material={SHARED_MATERIALS.velvetWine} />
        <CoffeeTable position={[0, 0, 1.5]} />
        <pointLight position={[0, 2.5, 0]} color={COLORS.purple} intensity={1.5} distance={8} />
      </group>

      {/* ===== BAR AREA - SHARED materials ===== */}
      <group position={[0, 0, -10]}>
        {/* Bar counter */}
        <mesh position={[0, 0.95, 0]} material={SHARED_MATERIALS.barTop}>
          <boxGeometry args={[20, 0.08, 1.2]} />
        </mesh>
        <mesh position={[0, 0.48, 0]} material={SHARED_MATERIALS.barBody}>
          <boxGeometry args={[19.5, 0.9, 1.0]} />
        </mesh>

        {/* Bar back shelves */}
        <mesh position={[0, 2.5, -1]} material={SHARED_MATERIALS.barShelf}>
          <boxGeometry args={[18, 4, 0.3]} />
        </mesh>

        {/* Bar neon accents */}
        <NeonStrip color={COLORS.gold} position={[0, 1.5, -0.8]} size={[17, 0.03, 0.03]} intensity={1.3} />
        <NeonStrip color={COLORS.cyan} position={[0, 0.05, 0.5]} size={[18, 0.02, 0.02]} intensity={1.0} />

      </group>

      {/* ===== VIP ROPE BARRIERS - SHARED materials ===== */}
      {[-20, 20].map((x, i) => (
        <group key={`rope-${i}`}>
          {/* Pole 1 */}
          <mesh position={[x, 0.5, 2]} material={SHARED_MATERIALS.goldChrome}>
            <cylinderGeometry args={[0.04, 0.05, 1, 8]} />
          </mesh>
          <mesh position={[x, 1.02, 2]} material={SHARED_MATERIALS.goldChrome}>
            <sphereGeometry args={[0.06, 12, 12]} />
          </mesh>

          {/* Pole 2 */}
          <mesh position={[x, 0.5, 5]} material={SHARED_MATERIALS.goldChrome}>
            <cylinderGeometry args={[0.04, 0.05, 1, 8]} />
          </mesh>
          <mesh position={[x, 1.02, 5]} material={SHARED_MATERIALS.goldChrome}>
            <sphereGeometry args={[0.06, 12, 12]} />
          </mesh>

          {/* Velvet rope */}
          <mesh position={[x, 0.9, 3.5]} material={SHARED_MATERIALS.velvetRope}>
            <cylinderGeometry args={[0.025, 0.025, 3, 8]} />
          </mesh>
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
        inputDisabled={slotOpen}
      />

      {/* AVATAR EFFECTS REMOVED FOR PERFORMANCE */}

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

      {/* ===== SLOT MACHINES with GPU WIN CELEBRATION ===== */}
      {MACHINES.map((m) => (
        <group key={m.id}>
          <CyberpunkSlotMachine
            position={[m.x, 0, MACHINE_Z]}
            label={m.label}
            nearMachineRef={nearMachineRef}
            spinningMachineRef={spinningMachineRef}
            machineId={m.id}
          />
          {/* GPU Win Celebration - shader-driven particles */}
          <WinCelebrationGPU
            position={[m.x, 3, MACHINE_Z + 1]}
            active={winMachineRef.current === m.id}
            isJackpot={isJackpotRef.current && winMachineRef.current === m.id}
          />
        </group>
      ))}

      {/* ===== AMBIENT DUST PARTICLES ===== */}
      <DustParticles
        count={300}
        area={[60, 9, 50]}
        color="#8866ff"
        opacity={0.25}
        size={0.04}
      />

      {/* ===== FOG ===== */}
      <fog attach="fog" args={['#080412', 18, 55]} />

      {/* ===== POST-PROCESSING - GPU-driven effects ===== */}
      <PostProcessing
        quality="medium"
        enableSSAO={false}  // Heavy, disabled for performance
        enableBloom={true}
        enableChromatic={true}
        enableVignette={true}
        enableNoise={false}
      />

      {/* WebGL context loss handler */}
      <ContextHandler />
    </>
  )
}
