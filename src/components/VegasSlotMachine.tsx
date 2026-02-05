/**
 * Vegas IGT S3000 Slot Machine - Ultra Realistic
 *
 * Based on real IGT cabinets found in Las Vegas casinos:
 * - Large curved displays (32" main + 23" topper)
 * - Chrome/stainless steel cabinet
 * - LED edge lighting
 * - Ergonomic button panel
 * - Bill acceptor and ticket printer
 * - Premium materials and finishes
 *
 * Scale: 1 unit = 1 meter (realistic proportions)
 * Machine dimensions: ~0.9m wide x 1.8m tall x 0.8m deep
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface VegasSlotMachineProps {
  position: [number, number, number]
  label: string
  isActive?: boolean
  onInteract?: () => void
}

// Vegas casino color palette
const COLORS = {
  // Cabinet
  cabinetBlack: '#0a0a0c',
  cabinetGray: '#1a1a1e',
  chrome: '#d4d4d8',
  stainless: '#a8a8b0',
  gold: '#d4af37',
  brass: '#b5a642',

  // Screens
  screenBlack: '#050508',
  screenGlow: '#1a2030',

  // Neon/LED
  red: '#ff2020',
  green: '#20ff40',
  blue: '#2080ff',
  purple: '#8040ff',
  orange: '#ff8020',
  yellow: '#ffdd00',
  white: '#ffffff',

  // Fabric
  velvet: '#2a0a1a',
  felt: '#0a3020'
}

// Reel symbols (Vegas classic + modern)
const SYMBOLS = ['7', '🍒', '💎', 'BAR', '⭐', '🔔', '🍀', '💰']

export function VegasSlotMachine({
  position,
  label,
  isActive = false,
  onInteract: _onInteract
}: VegasSlotMachineProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const ledStripRefs = useRef<THREE.Mesh[]>([])
  const screenRef = useRef<THREE.Mesh>(null!)
  const topperRef = useRef<THREE.Mesh>(null!)
  const reelsRef = useRef<THREE.Group>(null!)
  const jackpotRef = useRef<THREE.Mesh>(null!)
  const labelRef = useRef<THREE.Group>(null!)

  const timeRef = useRef(Math.random() * 100)

  // Spin state
  const spinState = useRef({
    spinning: false,
    spinTime: 0,
    reelOffsets: [0, 0, 0, 0, 0],
    reelSpeeds: [0, 0, 0, 0, 0]
  })

  // LED strip positions (around cabinet edges)
  const ledPositions = useMemo(() => {
    const leds: { pos: [number, number, number]; rot: [number, number, number]; len: number; color: string }[] = []

    // Left edge vertical
    for (let y = 0.2; y < 1.7; y += 0.15) {
      leds.push({ pos: [-0.48, y, 0.42], rot: [0, 0, Math.PI / 2], len: 0.1, color: COLORS.red })
    }
    // Right edge vertical
    for (let y = 0.2; y < 1.7; y += 0.15) {
      leds.push({ pos: [0.48, y, 0.42], rot: [0, 0, Math.PI / 2], len: 0.1, color: COLORS.red })
    }
    // Top edge horizontal
    for (let x = -0.4; x <= 0.4; x += 0.12) {
      leds.push({ pos: [x, 1.75, 0.42], rot: [0, 0, 0], len: 0.08, color: COLORS.gold })
    }
    // Bottom edge horizontal
    for (let x = -0.4; x <= 0.4; x += 0.12) {
      leds.push({ pos: [x, 0.08, 0.42], rot: [0, 0, 0], len: 0.08, color: COLORS.gold })
    }

    return leds
  }, [])

  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    // ===== LED CHASE ANIMATION =====
    ledStripRefs.current.forEach((led, i) => {
      if (!led) return
      const mat = led.material as THREE.MeshBasicMaterial
      const phase = i * 0.3
      const wave = Math.sin(t * 6 - phase)
      const intensity = isActive ? (wave * 0.5 + 0.5) * 2.5 + 0.5 : (wave * 0.3 + 0.5) * 1.2
      mat.color.setScalar(intensity)
    })

    // ===== MAIN SCREEN ANIMATION =====
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshBasicMaterial
      const pulse = isActive ? 0.9 + Math.sin(t * 2) * 0.1 : 0.6
      mat.color.setRGB(0.1 * pulse, 0.15 * pulse, 0.25 * pulse)
    }

    // ===== TOPPER ANIMATION =====
    if (topperRef.current) {
      const mat = topperRef.current.material as THREE.MeshBasicMaterial
      const flash = Math.sin(t * 8) > 0.7 ? 1.5 : 1.0
      const intensity = isActive ? 1.2 * flash : 0.6
      mat.color.setRGB(0.2 * intensity, 0.1 * intensity, 0.4 * intensity)
    }

    // ===== JACKPOT METER ANIMATION =====
    if (jackpotRef.current) {
      const mat = jackpotRef.current.material as THREE.MeshBasicMaterial
      const blink = Math.sin(t * 4) > 0 ? 1.3 : 1.0
      mat.color.setRGB(1 * blink, 0.85 * blink, 0)
    }

    // ===== REEL SPIN =====
    const spin = spinState.current
    if (isActive && !spin.spinning && Math.random() < 0.003) {
      spin.spinning = true
      spin.spinTime = 0
      spin.reelSpeeds = [18, 20, 22, 24, 26]
    }

    if (spin.spinning) {
      spin.spinTime += delta
      const durations = [1.8, 2.1, 2.4, 2.7, 3.0]

      for (let i = 0; i < 5; i++) {
        if (spin.spinTime < durations[i]) {
          const progress = spin.spinTime / durations[i]
          const easeOut = 1 - Math.pow(1 - progress, 4)
          const speed = spin.reelSpeeds[i] * (1 - easeOut * 0.97)
          spin.reelOffsets[i] += speed * delta
        }
      }

      if (spin.spinTime > durations[4] + 0.3) {
        spin.spinning = false
      }
    }

    // Apply reel rotation
    if (reelsRef.current) {
      reelsRef.current.children.forEach((reel, i) => {
        if (reel instanceof THREE.Group) {
          reel.rotation.x = spin.reelOffsets[i]
        }
      })
    }

    // ===== LABEL BILLBOARD =====
    if (labelRef.current) {
      labelRef.current.lookAt(state.camera.position)
      const bounce = isActive ? Math.sin(t * 5) * 0.05 : 0
      labelRef.current.position.y = 2.3 + bounce
      labelRef.current.scale.setScalar(isActive ? 1.15 : 1.0)
    }
  })

  const addLedRef = (mesh: THREE.Mesh | null, index: number) => {
    if (mesh) ledStripRefs.current[index] = mesh
  }

  return (
    <group ref={groupRef} position={position}>

      {/* ============================================ */}
      {/* ===== MAIN CABINET BODY ===== */}
      {/* ============================================ */}

      {/* Base cabinet - black metal */}
      <RoundedBox args={[1.0, 1.85, 0.85]} radius={0.03} position={[0, 0.925, 0]}>
        <meshStandardMaterial
          color={COLORS.cabinetBlack}
          metalness={0.9}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Front panel - slightly lighter */}
      <RoundedBox args={[0.96, 1.8, 0.1]} radius={0.02} position={[0, 0.925, 0.4]}>
        <meshStandardMaterial
          color={COLORS.cabinetGray}
          metalness={0.85}
          roughness={0.25}
        />
      </RoundedBox>

      {/* ============================================ */}
      {/* ===== CHROME TRIM ===== */}
      {/* ============================================ */}

      {/* Top chrome trim */}
      <mesh position={[0, 1.87, 0.43]}>
        <boxGeometry args={[1.02, 0.04, 0.12]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>

      {/* Bottom chrome trim */}
      <mesh position={[0, 0.02, 0.43]}>
        <boxGeometry args={[1.02, 0.04, 0.12]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>

      {/* Left chrome strip */}
      <mesh position={[-0.5, 0.925, 0.43]}>
        <boxGeometry args={[0.03, 1.82, 0.1]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>

      {/* Right chrome strip */}
      <mesh position={[0.5, 0.925, 0.43]}>
        <boxGeometry args={[0.03, 1.82, 0.1]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>

      {/* ============================================ */}
      {/* ===== TOPPER DISPLAY ===== */}
      {/* ============================================ */}

      {/* Topper housing */}
      <RoundedBox args={[0.9, 0.35, 0.12]} radius={0.02} position={[0, 2.05, 0.42]}>
        <meshStandardMaterial
          color={COLORS.cabinetBlack}
          metalness={0.85}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Topper screen */}
      <mesh ref={topperRef} position={[0, 2.05, 0.49]}>
        <planeGeometry args={[0.85, 0.3]} />
        <meshBasicMaterial color="#200840" toneMapped={false} />
      </mesh>

      {/* Topper chrome frame */}
      <mesh position={[0, 2.05, 0.48]}>
        <boxGeometry args={[0.88, 0.33, 0.02]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>

      {/* ============================================ */}
      {/* ===== JACKPOT METER ===== */}
      {/* ============================================ */}

      <mesh position={[0, 2.28, 0.43]}>
        <boxGeometry args={[0.6, 0.1, 0.08]} />
        <meshStandardMaterial color={COLORS.cabinetBlack} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={jackpotRef} position={[0, 2.28, 0.48]}>
        <planeGeometry args={[0.55, 0.08]} />
        <meshBasicMaterial color={COLORS.yellow} toneMapped={false} />
      </mesh>
      <Text
        position={[0, 2.28, 0.49]}
        fontSize={0.05}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        $125,847.32
      </Text>

      {/* ============================================ */}
      {/* ===== MAIN DISPLAY ===== */}
      {/* ============================================ */}

      {/* Display housing */}
      <RoundedBox args={[0.88, 0.55, 0.1]} radius={0.02} position={[0, 1.5, 0.42]}>
        <meshStandardMaterial
          color={COLORS.screenBlack}
          metalness={0.7}
          roughness={0.3}
        />
      </RoundedBox>

      {/* Main screen */}
      <mesh ref={screenRef} position={[0, 1.5, 0.48]}>
        <planeGeometry args={[0.84, 0.5]} />
        <meshBasicMaterial color={COLORS.screenGlow} toneMapped={false} />
      </mesh>

      {/* Display chrome bezel */}
      <RoundedBox args={[0.9, 0.57, 0.03]} radius={0.01} position={[0, 1.5, 0.46]}>
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </RoundedBox>

      {/* ============================================ */}
      {/* ===== REEL DISPLAY (5 REELS) ===== */}
      {/* ============================================ */}

      {/* Reel window housing */}
      <RoundedBox args={[0.88, 0.45, 0.12]} radius={0.02} position={[0, 0.95, 0.42]}>
        <meshStandardMaterial
          color={COLORS.screenBlack}
          metalness={0.75}
          roughness={0.25}
        />
      </RoundedBox>

      {/* Reel background */}
      <mesh position={[0, 0.95, 0.47]}>
        <planeGeometry args={[0.82, 0.4]} />
        <meshBasicMaterial color="#0a1018" toneMapped={false} />
      </mesh>

      {/* Gold reel frame */}
      <RoundedBox args={[0.86, 0.43, 0.02]} radius={0.01} position={[0, 0.95, 0.465]}>
        <meshStandardMaterial
          color={COLORS.gold}
          metalness={1}
          roughness={0.15}
          emissive={COLORS.gold}
          emissiveIntensity={0.1}
        />
      </RoundedBox>

      {/* Reel dividers (chrome) */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={`divider-${i}`} position={[-0.33 + i * 0.165, 0.95, 0.48]}>
          <boxGeometry args={[0.015, 0.38, 0.02]} />
          <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
        </mesh>
      ))}

      {/* 5 Reels */}
      <group ref={reelsRef} position={[0, 0.95, 0.5]}>
        {[0, 1, 2, 3, 4].map(reelIdx => (
          <group key={`reel-${reelIdx}`} position={[-0.33 + reelIdx * 0.165, 0, 0]}>
            {SYMBOLS.map((symbol, symIdx) => {
              const angle = (symIdx / SYMBOLS.length) * Math.PI * 2
              const y = Math.sin(angle) * 0.15
              const z = Math.cos(angle) * 0.08
              return (
                <Text
                  key={`sym-${reelIdx}-${symIdx}`}
                  position={[0, y, z]}
                  rotation={[-angle, 0, 0]}
                  fontSize={0.08}
                  color={COLORS.white}
                  anchorX="center"
                  anchorY="middle"
                >
                  {symbol}
                </Text>
              )
            })}
          </group>
        ))}
      </group>

      {/* ============================================ */}
      {/* ===== PAYTABLE DISPLAY ===== */}
      {/* ============================================ */}

      <mesh position={[0, 0.58, 0.46]}>
        <planeGeometry args={[0.75, 0.15]} />
        <meshBasicMaterial color="#081020" toneMapped={false} />
      </mesh>
      <Text
        position={[0, 0.58, 0.47]}
        fontSize={0.04}
        color={COLORS.green}
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? '► PRESS SPIN ◄' : 'INSERT CREDITS'}
      </Text>

      {/* ============================================ */}
      {/* ===== BUTTON PANEL ===== */}
      {/* ============================================ */}

      {/* Button panel base (angled) */}
      <mesh position={[0, 0.35, 0.5]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.85, 0.2, 0.15]} />
        <meshStandardMaterial
          color={COLORS.cabinetGray}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* BET buttons */}
      {[-0.28, -0.14, 0, 0.14].map((x, i) => (
        <group key={`btn-${i}`} position={[x, 0.38, 0.54]} rotation={[-0.3, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
            <meshStandardMaterial
              color={i === 0 ? COLORS.green : '#333340'}
              emissive={i === 0 ? COLORS.green : '#222230'}
              emissiveIntensity={0.3}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}

      {/* SPIN button (large, red, glowing) */}
      <group position={[0.32, 0.38, 0.54]} rotation={[-0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 24]} />
          <meshStandardMaterial
            color={isActive ? '#ff3030' : '#cc2020'}
            emissive={isActive ? '#ff3030' : '#aa1010'}
            emissiveIntensity={isActive ? 0.8 : 0.3}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
        <Text
          position={[0, 0.025, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          fontSize={0.025}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          SPIN
        </Text>
      </group>

      {/* ============================================ */}
      {/* ===== BILL ACCEPTOR ===== */}
      {/* ============================================ */}

      <mesh position={[0.35, 0.15, 0.43]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Bill slot */}
      <mesh position={[0.35, 0.15, 0.46]}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Green LED indicator */}
      <mesh position={[0.35, 0.2, 0.46]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color={COLORS.green} toneMapped={false} />
      </mesh>

      {/* ============================================ */}
      {/* ===== TICKET PRINTER ===== */}
      {/* ============================================ */}

      <mesh position={[-0.35, 0.12, 0.43]}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Ticket slot */}
      <mesh position={[-0.35, 0.14, 0.46]}>
        <boxGeometry args={[0.1, 0.015, 0.01]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* ============================================ */}
      {/* ===== DRINK HOLDER ===== */}
      {/* ============================================ */}

      <mesh position={[0.55, 0.6, 0.1]}>
        <cylinderGeometry args={[0.06, 0.07, 0.12, 16, 1, true]} />
        <meshStandardMaterial
          color={COLORS.chrome}
          metalness={1}
          roughness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ============================================ */}
      {/* ===== LED STRIPS ===== */}
      {/* ============================================ */}

      {ledPositions.map((led, i) => (
        <mesh
          key={`led-${i}`}
          ref={m => addLedRef(m, i)}
          position={led.pos}
          rotation={led.rot}
        >
          <capsuleGeometry args={[0.012, led.len, 4, 8]} />
          <meshBasicMaterial color={led.color} toneMapped={false} />
        </mesh>
      ))}

      {/* ============================================ */}
      {/* ===== ACCENT LIGHTING ===== */}
      {/* ============================================ */}

      {/* Main screen glow */}
      <pointLight
        position={[0, 1.5, 0.8]}
        color={isActive ? '#4080ff' : '#203060'}
        intensity={isActive ? 3 : 1}
        distance={3}
        decay={2}
      />

      {/* Reel area glow */}
      <pointLight
        position={[0, 0.95, 0.8]}
        color={isActive ? COLORS.gold : '#806020'}
        intensity={isActive ? 4 : 1.5}
        distance={2.5}
        decay={2}
      />

      {/* Topper glow */}
      <pointLight
        position={[0, 2.1, 0.7]}
        color="#8040ff"
        intensity={isActive ? 2 : 0.8}
        distance={2}
        decay={2}
      />

      {/* Side accent lights */}
      <pointLight
        position={[-0.6, 1.0, 0.5]}
        color={COLORS.red}
        intensity={isActive ? 1.5 : 0.5}
        distance={1.5}
        decay={2}
      />
      <pointLight
        position={[0.6, 1.0, 0.5]}
        color={COLORS.red}
        intensity={isActive ? 1.5 : 0.5}
        distance={1.5}
        decay={2}
      />

      {/* ============================================ */}
      {/* ===== FLOATING LABEL ===== */}
      {/* ============================================ */}

      <group ref={labelRef} position={[0, 2.3, 0]}>
        {/* Background plate */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[label.length * 0.12 + 0.5, 0.35]} />
          <meshBasicMaterial
            color={isActive ? '#0a0820' : '#050510'}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Gold border */}
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[label.length * 0.12 + 0.6, 0.42]} />
          <meshBasicMaterial
            color={isActive ? COLORS.gold : '#a08030'}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Label text */}
        <Text
          fontSize={0.18}
          color={isActive ? COLORS.gold : '#c0a040'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {label}
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </group>

    </group>
  )
}
