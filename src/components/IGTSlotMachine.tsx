/**
 * IGT Slot Machine - OPTIMIZED
 *
 * Performance:
 * - NO per-frame instanceColor updates (major perf killer)
 * - Static LEDs with CSS-style glow
 * - Minimal useFrame work
 * - Reduced point lights
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface IGTSlotMachineProps {
  position: [number, number, number]
  label: string
  isActive?: boolean
}

const COLORS = {
  cabinet: '#080810',
  chrome: '#c8ccd0',
  gold: '#ffd700',
  magenta: '#ff00aa',
  cyan: '#00ffff',
  blue: '#2266ff',
  white: '#ffffff'
}

export function IGTSlotMachine({ position, label, isActive = false }: IGTSlotMachineProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const labelRef = useRef<THREE.Group>(null!)
  const reelsRef = useRef<THREE.Group>(null!)

  const timeRef = useRef(Math.random() * 100)
  const spinState = useRef({
    spinning: false,
    spinTime: 0,
    reelOffsets: [0, 0, 0, 0, 0],
    reelSpeeds: [0, 0, 0, 0, 0]
  })

  const symbols = ['7', '♦', '♠', '♥', '♣', 'BAR', '★', '●']

  useFrame((state, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    // Reel spin (only when active)
    const spin = spinState.current
    if (isActive && !spin.spinning && Math.random() < 0.003) {
      spin.spinning = true
      spin.spinTime = 0
      spin.reelSpeeds = [18, 20, 22, 24, 26]
    }

    if (spin.spinning) {
      spin.spinTime += delta
      const durations = [1.5, 1.8, 2.1, 2.4, 2.7]

      for (let i = 0; i < 5; i++) {
        if (spin.spinTime < durations[i]) {
          const progress = spin.spinTime / durations[i]
          const easeOut = 1 - Math.pow(1 - progress, 3)
          spin.reelOffsets[i] += spin.reelSpeeds[i] * (1 - easeOut * 0.95) * delta
        }
      }

      if (spin.spinTime > durations[4] + 0.3) {
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
      if (isActive) {
        labelRef.current.scale.setScalar(1.2)
        labelRef.current.position.y = 5.9
      } else {
        labelRef.current.scale.setScalar(1.0)
        labelRef.current.position.y = 5.8
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>

      {/* CABINET */}
      <RoundedBox args={[2.2, 5, 1]} radius={0.06} position={[0, 2.5, 0]}>
        <meshStandardMaterial color={COLORS.cabinet} metalness={0.9} roughness={0.2} />
      </RoundedBox>

      {/* CHROME TRIM */}
      <RoundedBox args={[2.3, 0.08, 1.02]} radius={0.02} position={[0, 5.05, 0]}>
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </RoundedBox>
      <RoundedBox args={[2.3, 0.08, 1.02]} radius={0.02} position={[0, 0.05, 0]}>
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </RoundedBox>

      {/* SIDE NEON STRIPS (static, no animation) */}
      <mesh position={[-1.12, 2.5, 0.45]}>
        <boxGeometry args={[0.04, 4, 0.04]} />
        <meshBasicMaterial color={isActive ? COLORS.magenta : '#660044'} />
      </mesh>
      <mesh position={[1.12, 2.5, 0.45]}>
        <boxGeometry args={[0.04, 4, 0.04]} />
        <meshBasicMaterial color={isActive ? COLORS.cyan : '#004466'} />
      </mesh>

      {/* TOPPER */}
      <RoundedBox args={[2.0, 0.7, 0.15]} radius={0.03} position={[0, 5.35, 0.45]}>
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 5.35, 0.54]}>
        <planeGeometry args={[1.9, 0.6]} />
        <meshBasicMaterial color={isActive ? COLORS.blue : '#112244'} />
      </mesh>

      {/* MAIN SCREEN */}
      <RoundedBox args={[1.9, 1.3, 0.1]} radius={0.03} position={[0, 4.1, 0.48]}>
        <meshStandardMaterial color="#0a0a0a" metalness={0.7} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 4.1, 0.55]}>
        <planeGeometry args={[1.8, 1.2]} />
        <meshBasicMaterial color="#0a1020" />
      </mesh>

      {/* REEL DISPLAY */}
      <RoundedBox args={[1.95, 1.5, 0.12]} radius={0.03} position={[0, 2.5, 0.47]}>
        <meshStandardMaterial color="#050508" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[2.0, 1.55, 0.08]} radius={0.02} position={[0, 2.5, 0.44]}>
        <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.1} />
      </RoundedBox>
      <mesh position={[0, 2.5, 0.55]}>
        <planeGeometry args={[1.85, 1.4]} />
        <meshBasicMaterial color="#1a2030" />
      </mesh>

      {/* REEL DIVIDERS */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[-0.74 + i * 0.37, 2.5, 0.56]}>
          <boxGeometry args={[0.02, 1.35, 0.02]} />
          <meshStandardMaterial color={COLORS.chrome} metalness={1} roughness={0.15} />
        </mesh>
      ))}

      {/* 5 REELS */}
      <group ref={reelsRef} position={[0, 2.5, 0.58]}>
        {[0, 1, 2, 3, 4].map(reelIdx => (
          <group key={reelIdx} position={[-0.74 + reelIdx * 0.37, 0, 0]}>
            {symbols.map((symbol, symIdx) => {
              const angle = (symIdx / symbols.length) * Math.PI * 2
              return (
                <Text
                  key={symIdx}
                  position={[0, Math.sin(angle) * 0.5, Math.cos(angle) * 0.2]}
                  rotation={[-angle, 0, 0]}
                  fontSize={0.18}
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

      {/* INFO DISPLAY */}
      <mesh position={[0, 1.15, 0.55]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshBasicMaterial color={isActive ? COLORS.cyan : '#224466'} transparent opacity={0.7} />
      </mesh>

      {/* BUTTON PANEL */}
      <RoundedBox args={[1.8, 0.4, 0.25]} radius={0.03} position={[0, 0.55, 0.55]}>
        <meshStandardMaterial color="#0a0a12" metalness={0.7} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.55, 0.7]}>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
        <meshStandardMaterial
          color={isActive ? "#ff3333" : "#aa2222"}
          emissive={isActive ? "#ff3333" : "#661111"}
          emissiveIntensity={isActive ? 0.6 : 0.2}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* ONLY 2 LIGHTS PER MACHINE */}
      <pointLight
        position={[0, 3, 1]}
        color={isActive ? COLORS.cyan : "#446688"}
        intensity={isActive ? 3 : 1}
        distance={4}
      />

      {/* FLOATING LABEL */}
      <group ref={labelRef} position={[0, 5.8, 0]}>
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[label.length * 0.22 + 0.8, 0.6]} />
          <meshBasicMaterial color="#050510" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[label.length * 0.22 + 0.95, 0.72]} />
          <meshBasicMaterial
            color={isActive ? COLORS.cyan : COLORS.gold}
            transparent
            opacity={0.7}
          />
        </mesh>
        <Text
          fontSize={0.32}
          color={isActive ? COLORS.cyan : COLORS.gold}
          anchorX="center"
          anchorY="middle"
        >
          {label}
          <meshBasicMaterial />
        </Text>
      </group>

    </group>
  )
}
