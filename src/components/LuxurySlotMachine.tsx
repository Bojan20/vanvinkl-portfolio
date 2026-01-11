/**
 * Luxury Slot Machine - James Bond Casino Style
 *
 * Ultra large, sophisticated design:
 * - 2.5m tall (vs normal 1.8m)
 * - Sleek black/chrome aesthetic
 * - Cyan/blue accent lighting
 * - Minimal, elegant details
 *
 * Visual Design from CLAUDE.md palette
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface LuxurySlotMachineProps {
  position: [number, number, number]
  label: string
  isActive?: boolean
  onInteract?: () => void
}

// CLAUDE.md Pro Audio Dark palette
const COLORS = {
  deepest: '#0a0a0c',
  deep: '#121216',
  mid: '#1a1a20',
  surface: '#242430',

  blue: '#4a9eff',
  cyan: '#40c8ff',
  orange: '#ff9040',
  green: '#40ff90',

  chrome: '#c8ccd0',
  gold: '#d4af37'
}

const SYMBOLS = ['7', '♦', '♠', '♥', '♣', '★', '▲', '●']

export function LuxurySlotMachine({
  position,
  label,
  isActive = false,
  onInteract
}: LuxurySlotMachineProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const screenRef = useRef<THREE.Mesh>(null!)
  const reelScreenRef = useRef<THREE.Mesh>(null!)
  const ledStripRef = useRef<THREE.Mesh>(null!)
  const reelsRef = useRef<THREE.Group>(null!)
  const labelRef = useRef<THREE.Group>(null!)

  const timeRef = useRef(Math.random() * 100)

  // Spin state
  const spinState = useRef({
    spinning: false,
    spinTime: 0,
    reelOffsets: [0, 0, 0, 0, 0],
    reelSpeeds: [0, 0, 0, 0, 0]
  })

  // LED positions along edges
  const ledCount = 40

  useFrame((state, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    // Screen glow
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshBasicMaterial
      const pulse = isActive ? 0.8 + Math.sin(t * 2) * 0.2 : 0.4
      mat.color.setRGB(0.05 * pulse, 0.1 * pulse, 0.2 * pulse)
    }

    // Reel screen
    if (reelScreenRef.current) {
      const mat = reelScreenRef.current.material as THREE.MeshBasicMaterial
      const glow = isActive ? 1.0 : 0.5
      mat.color.setRGB(0.08 * glow, 0.12 * glow, 0.18 * glow)
    }

    // LED strip pulse
    if (ledStripRef.current) {
      const mat = ledStripRef.current.material as THREE.MeshBasicMaterial
      const wave = Math.sin(t * 4) * 0.3 + 0.7
      const intensity = isActive ? wave * 1.5 : wave * 0.5
      mat.opacity = intensity
    }

    // Reel spin
    const spin = spinState.current
    if (isActive && !spin.spinning && Math.random() < 0.004) {
      spin.spinning = true
      spin.spinTime = 0
      spin.reelSpeeds = [15, 17, 19, 21, 23]
    }

    if (spin.spinning) {
      spin.spinTime += delta
      const durations = [2.0, 2.3, 2.6, 2.9, 3.2]

      for (let i = 0; i < 5; i++) {
        if (spin.spinTime < durations[i]) {
          const progress = spin.spinTime / durations[i]
          const easeOut = 1 - Math.pow(1 - progress, 4)
          const speed = spin.reelSpeeds[i] * (1 - easeOut * 0.97)
          spin.reelOffsets[i] += speed * delta
        }
      }

      if (spin.spinTime > durations[4] + 0.5) {
        spin.spinning = false
      }
    }

    if (reelsRef.current) {
      reelsRef.current.children.forEach((reel, i) => {
        if (reel instanceof THREE.Group) {
          reel.rotation.x = spin.reelOffsets[i]
        }
      })
    }

    // Label billboard
    if (labelRef.current) {
      labelRef.current.lookAt(state.camera.position)
      const bounce = isActive ? Math.sin(t * 4) * 0.05 : 0
      labelRef.current.position.y = 3.2 + bounce
      labelRef.current.scale.setScalar(isActive ? 1.2 : 1.0)
    }
  })

  return (
    <group ref={groupRef} position={position}>

      {/* ===== MAIN CABINET - LARGE ===== */}
      {/* Height: 2.5m, Width: 1.4m, Depth: 1.0m */}

      <RoundedBox args={[1.4, 2.6, 1.0]} radius={0.04} position={[0, 1.3, 0]}>
        <meshStandardMaterial
          color={COLORS.deepest}
          metalness={0.9}
          roughness={0.15}
        />
      </RoundedBox>

      {/* Front panel */}
      <RoundedBox args={[1.35, 2.5, 0.08]} radius={0.03} position={[0, 1.3, 0.48]}>
        <meshStandardMaterial
          color={COLORS.deep}
          metalness={0.85}
          roughness={0.2}
        />
      </RoundedBox>

      {/* ===== CHROME FRAME ===== */}
      {/* Top */}
      <mesh position={[0, 2.62, 0.5]}>
        <boxGeometry args={[1.45, 0.04, 0.1]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 0.02, 0.5]}>
        <boxGeometry args={[1.45, 0.04, 0.1]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>
      {/* Sides */}
      <mesh position={[-0.72, 1.3, 0.5]}>
        <boxGeometry args={[0.03, 2.56, 0.08]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0.72, 1.3, 0.5]}>
        <boxGeometry args={[0.03, 2.56, 0.08]} />
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </mesh>

      {/* ===== LED ACCENT STRIP ===== */}
      <mesh ref={ledStripRef} position={[0, 1.3, 0.55]}>
        <boxGeometry args={[1.3, 2.4, 0.01]} />
        <meshBasicMaterial
          color={COLORS.cyan}
          toneMapped={false}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* ===== MAIN DISPLAY ===== */}
      <RoundedBox args={[1.2, 0.7, 0.08]} radius={0.02} position={[0, 2.1, 0.52]}>
        <meshStandardMaterial color={COLORS.deepest} metalness={0.7} roughness={0.3} />
      </RoundedBox>
      <mesh ref={screenRef} position={[0, 2.1, 0.57]}>
        <planeGeometry args={[1.15, 0.65]} />
        <meshBasicMaterial color="#081020" toneMapped={false} />
      </mesh>

      {/* ===== REEL DISPLAY - LARGE ===== */}
      <RoundedBox args={[1.25, 0.8, 0.1]} radius={0.02} position={[0, 1.3, 0.5]}>
        <meshStandardMaterial color={COLORS.deepest} metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Reel window frame */}
      <RoundedBox args={[1.2, 0.75, 0.03]} radius={0.015} position={[0, 1.3, 0.54]}>
        <meshStandardMaterial
          color={COLORS.chrome}
          metalness={1}
          roughness={0.1}
        />
      </RoundedBox>

      {/* Reel background */}
      <mesh ref={reelScreenRef} position={[0, 1.3, 0.56]}>
        <planeGeometry args={[1.1, 0.65]} />
        <meshBasicMaterial color="#0a1520" toneMapped={false} />
      </mesh>

      {/* Reel dividers */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={`div-${i}`} position={[-0.44 + i * 0.22, 1.3, 0.57]}>
          <boxGeometry args={[0.015, 0.6, 0.02]} />
          <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
        </mesh>
      ))}

      {/* 5 Reels */}
      <group ref={reelsRef} position={[0, 1.3, 0.6]}>
        {[0, 1, 2, 3, 4].map(reelIdx => (
          <group key={`reel-${reelIdx}`} position={[-0.44 + reelIdx * 0.22, 0, 0]}>
            {SYMBOLS.map((symbol, symIdx) => {
              const angle = (symIdx / SYMBOLS.length) * Math.PI * 2
              const y = Math.sin(angle) * 0.25
              const z = Math.cos(angle) * 0.12
              return (
                <Text
                  key={`sym-${reelIdx}-${symIdx}`}
                  position={[0, y, z]}
                  rotation={[-angle, 0, 0]}
                  fontSize={0.12}
                  color="#ffffff"
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

      {/* ===== INFO DISPLAY ===== */}
      <mesh position={[0, 0.75, 0.55]}>
        <planeGeometry args={[1.0, 0.2]} />
        <meshBasicMaterial
          color={isActive ? COLORS.cyan : COLORS.blue}
          toneMapped={false}
          transparent
          opacity={isActive ? 0.9 : 0.5}
        />
      </mesh>
      <Text
        position={[0, 0.75, 0.56]}
        fontSize={0.08}
        color={COLORS.deepest}
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? 'READY TO PLAY' : 'INSERT CARD'}
      </Text>

      {/* ===== BUTTON PANEL ===== */}
      <RoundedBox args={[1.1, 0.3, 0.2]} radius={0.02} position={[0, 0.45, 0.55]}>
        <meshStandardMaterial color={COLORS.mid} metalness={0.6} roughness={0.4} />
      </RoundedBox>

      {/* Buttons */}
      {[-0.35, -0.15, 0.05, 0.25].map((x, i) => (
        <mesh key={`btn-${i}`} position={[x, 0.48, 0.68]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 16]} />
          <meshStandardMaterial
            color={i === 3 ? '#cc2020' : COLORS.surface}
            emissive={i === 3 ? '#cc2020' : COLORS.surface}
            emissiveIntensity={i === 3 && isActive ? 0.5 : 0.1}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Spin button glow */}
      <mesh position={[0.25, 0.48, 0.66]}>
        <cylinderGeometry args={[0.065, 0.065, 0.02, 16]} />
        <meshBasicMaterial
          color={isActive ? COLORS.orange : '#802020'}
          toneMapped={false}
          transparent
          opacity={isActive ? 0.8 : 0.3}
        />
      </mesh>

      {/* ===== CARD READER ===== */}
      <mesh position={[0.5, 0.2, 0.52]}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color={COLORS.deepest} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 0.2, 0.55]}>
        <boxGeometry args={[0.1, 0.02, 0.01]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Status LED */}
      <mesh position={[0.5, 0.26, 0.55]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color={isActive ? COLORS.green : COLORS.orange} toneMapped={false} />
      </mesh>

      {/* ===== LIGHTING ===== */}
      <pointLight
        position={[0, 2.1, 1]}
        color={isActive ? COLORS.cyan : COLORS.blue}
        intensity={isActive ? 4 : 1.5}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[0, 1.3, 1.2]}
        color={isActive ? COLORS.cyan : COLORS.blue}
        intensity={isActive ? 5 : 2}
        distance={3.5}
        decay={2}
      />
      <pointLight
        position={[0, 0.5, 0.8]}
        color={COLORS.cyan}
        intensity={isActive ? 2 : 0.8}
        distance={2}
        decay={2}
      />

      {/* ===== FLOATING LABEL ===== */}
      <group ref={labelRef} position={[0, 3.2, 0]}>
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[label.length * 0.14 + 0.6, 0.4]} />
          <meshBasicMaterial
            color={COLORS.deepest}
            transparent
            opacity={0.95}
          />
        </mesh>
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[label.length * 0.14 + 0.7, 0.48]} />
          <meshBasicMaterial
            color={isActive ? COLORS.cyan : COLORS.blue}
            transparent
            opacity={0.9}
          />
        </mesh>
        <Text
          fontSize={0.2}
          color={isActive ? COLORS.cyan : COLORS.blue}
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
