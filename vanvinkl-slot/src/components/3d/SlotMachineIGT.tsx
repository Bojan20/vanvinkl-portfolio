'use client'

import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { RoundedBox, Text, Sphere } from '@react-three/drei'
import { HolographicScreenMaterial } from '@/shaders/HolographicScreen'
import * as THREE from 'three'

// Extend R3F with custom material
extend({ HolographicScreenMaterial })

interface SlotMachineIGTProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  machineId: string
  label: string
  isActive?: boolean
  onInteract?: () => void
}

type MachineState = 'idle' | 'anticipation' | 'spinning' | 'settling' | 'win' | 'jackpot'

/**
 * IGT-Style AAA Slot Machine
 *
 * Premium features:
 * - Larger cabinet (2.2m tall, 1m wide)
 * - Curved glass top box
 * - LCD screen (32" style)
 * - Premium materials (chrome, gold trim)
 * - Dynamic attract mode lighting
 * - Spinning reel preview
 * - Professional button panel
 */
export function SlotMachineIGT({
  position,
  rotation = [0, 0, 0],
  machineId,
  label,
  isActive = false,
  onInteract
}: SlotMachineIGTProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const screenGlowRef = useRef<THREE.Mesh>(null!)
  const lightRingRef = useRef<THREE.Group>(null!)
  const labelGroupRef = useRef<THREE.Group>(null!)

  // Reel refs
  const reel1Ref = useRef<THREE.Group>(null!)
  const reel2Ref = useRef<THREE.Group>(null!)
  const reel3Ref = useRef<THREE.Group>(null!)

  const attractTime = useRef(0)
  const idleFloat = useRef(0)
  const labelFloat = useRef(0)

  // Reel symbols (portfolio themed)
  const symbols = ['💼', '🎨', '💻', '🚀', '⭐', '💎', '🔥', '🏆']

  // Spin choreography state
  const machineState = useRef<MachineState>('idle')
  const stateTimer = useRef(0)
  const spinSpeed = useRef([0, 0, 0]) // Speed for each reel
  const targetRotations = useRef([0, 0, 0]) // Target stop positions
  const shakeIntensity = useRef(0)
  const pulseIntensity = useRef(0)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Idle float animation
    idleFloat.current += delta
    const baseY = position[1] + Math.sin(idleFloat.current * 0.8) * 0.03
    groupRef.current.position.y = baseY

    // Update state timer
    stateTimer.current += delta

    // State machine for spin choreography
    const currentState = machineState.current

    if (currentState === 'idle' || currentState === 'anticipation') {
      if (isActive && currentState === 'idle') {
        // Trigger anticipation on activation
        machineState.current = 'anticipation'
        stateTimer.current = 0
        shakeIntensity.current = 0
      }

      if (currentState === 'anticipation') {
        // ANTICIPATION: Build-up before spin (0.5s)
        const t = Math.min(stateTimer.current / 0.5, 1)

        // Cabinet pullback (anticipation)
        groupRef.current.position.z = position[2] + Math.sin(t * Math.PI) * 0.15

        // Shake build-up
        shakeIntensity.current = t * 0.02
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * shakeIntensity.current

        // Light intensity ramp
        pulseIntensity.current = 0.8 + t * 0.4

        if (stateTimer.current > 0.5) {
          // Transition to spinning
          machineState.current = 'spinning'
          stateTimer.current = 0
          spinSpeed.current = [25, 25, 25] // Start fast

          // Random target positions
          targetRotations.current = [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ]
        }
      }
    }

    if (currentState === 'spinning') {
      // SPINNING: Fast spin with gradual slowdown (2s)
      const spinDuration = 2.0
      const t = Math.min(stateTimer.current / spinDuration, 1)

      // Deceleration curve (ease out)
      const easeOut = 1 - Math.pow(1 - t, 3)

      // Update reel speeds (fast → slow)
      spinSpeed.current[0] = 25 * (1 - easeOut * 0.95)
      spinSpeed.current[1] = 25 * (1 - easeOut * 0.97)
      spinSpeed.current[2] = 25 * (1 - easeOut * 0.99)

      // Spin reels
      if (reel1Ref.current) reel1Ref.current.rotation.x += spinSpeed.current[0] * delta
      if (reel2Ref.current) reel2Ref.current.rotation.x += spinSpeed.current[1] * delta
      if (reel3Ref.current) reel3Ref.current.rotation.x += spinSpeed.current[2] * delta

      // Cabinet shake (vibration)
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 30) * 0.01 * (1 - easeOut)

      if (stateTimer.current > spinDuration) {
        machineState.current = 'settling'
        stateTimer.current = 0
      }
    }

    if (currentState === 'settling') {
      // SETTLING: Elastic bounce to final position (0.8s)
      const settleDuration = 0.8
      const t = Math.min(stateTimer.current / settleDuration, 1)

      // Elastic ease out
      const elastic = 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3))

      // Lerp to target with overshoot
      if (reel1Ref.current) {
        const target = targetRotations.current[0]
        reel1Ref.current.rotation.x = target + (1 - elastic) * Math.PI * 0.2
      }
      if (reel2Ref.current) {
        const target = targetRotations.current[1]
        reel2Ref.current.rotation.x = target + (1 - elastic) * Math.PI * 0.15
      }
      if (reel3Ref.current) {
        const target = targetRotations.current[2]
        reel3Ref.current.rotation.x = target + (1 - elastic) * Math.PI * 0.1
      }

      // Cabinet bounce back
      groupRef.current.position.z = position[2] + (1 - elastic) * 0.1

      if (stateTimer.current > settleDuration) {
        // Check for win (random)
        const isWin = Math.random() > 0.5
        machineState.current = isWin ? 'win' : 'idle'
        stateTimer.current = 0
      }
    }

    if (currentState === 'win') {
      // WIN CELEBRATION: Light explosion, shake (2s)
      const winDuration = 2.0
      const t = Math.min(stateTimer.current / winDuration, 1)

      // Explosive shake
      const shakeFreq = 40 - t * 30
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * shakeFreq) * 0.03 * (1 - t)
      groupRef.current.position.y = baseY + Math.sin(stateTimer.current * 10) * 0.05 * (1 - t)

      // Light ring spin-up
      if (lightRingRef.current) {
        lightRingRef.current.rotation.y += delta * (5 + t * 10)
      }

      // Screen flash
      pulseIntensity.current = 1.5 + Math.sin(stateTimer.current * 20) * 0.5

      if (stateTimer.current > winDuration) {
        machineState.current = 'idle'
        stateTimer.current = 0
      }
    }

    // Update holographic screen shader
    if (screenGlowRef.current) {
      const material = screenGlowRef.current.material as any
      if (material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime
        material.uniforms.isActive.value = isActive ? 1.0 : 0.0
      }
    }

    // Light ring rotation
    if (lightRingRef.current && currentState === 'idle') {
      lightRingRef.current.rotation.y += delta * (isActive ? 2 : 0.3)
    }

    // Attract mode drift when idle
    if (currentState === 'idle' && !isActive) {
      attractTime.current += delta * 0.5
      if (reel1Ref.current) reel1Ref.current.rotation.x += delta * 0.1
      if (reel2Ref.current) reel2Ref.current.rotation.x += delta * 0.12
      if (reel3Ref.current) reel3Ref.current.rotation.x += delta * 0.08
    }

    // LABEL ANIMATION - Floating + proximity
    if (labelGroupRef.current) {
      labelFloat.current += delta

      if (isActive) {
        // PROXIMITY: Scale up + bounce
        const bounce = Math.sin(labelFloat.current * 8) * 0.15
        labelGroupRef.current.scale.setScalar(1.5 + bounce)
        labelGroupRef.current.position.y = 2.4 + bounce * 0.2
      } else {
        // IDLE: Gentle float
        const float = Math.sin(labelFloat.current * 2) * 0.08
        labelGroupRef.current.scale.setScalar(1.0)
        labelGroupRef.current.position.y = 2.25 + float
      }

      // Billboard effect - always face camera
      labelGroupRef.current.lookAt(state.camera.position)
    }
  })

  // Memoized materials for performance
  const cabinetMaterial = useMemo(() => (
    <meshStandardMaterial
      color={isActive ? "#1a0a0a" : "#0f0505"}
      metalness={0.95}
      roughness={0.15}
      envMapIntensity={1.5}
    />
  ), [isActive])

  const chromeMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#ffffff"
      metalness={0.98}
      roughness={0.12} // Slightly rougher for realism (not mirror-perfect)
      envMapIntensity={2.5}
    />
  ), [])

  const goldTrimMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#FFD700"
      metalness={0.92}
      roughness={0.2}
      emissive="#FFD700"
      emissiveIntensity={0.3}
    />
  ), [])

  const glassMaterial = useMemo(() => (
    <meshPhysicalMaterial
      color="#0a1a2a"
      metalness={0}
      roughness={0.1}
      transmission={0.9}
      thickness={0.5}
      transparent
      opacity={0.3}
    />
  ), [])

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={3.0}>
      {/* MAIN CABINET BASE (taller, wider, deeper) */}
      <RoundedBox args={[1.4, 1.8, 0.8]} radius={0.05} position={[0, 0.9, 0]}>
        {cabinetMaterial}
      </RoundedBox>

      {/* CHROME SIDE PANELS */}
      <RoundedBox args={[0.06, 1.8, 0.8]} radius={0.03} position={[-0.73, 0.9, 0]}>
        {chromeMaterial}
      </RoundedBox>
      <RoundedBox args={[0.06, 1.8, 0.8]} radius={0.03} position={[0.73, 0.9, 0]}>
        {chromeMaterial}
      </RoundedBox>

      {/* GOLD TRIM ACCENTS */}
      <RoundedBox args={[1.5, 0.06, 0.82]} radius={0.03} position={[0, 1.82, 0]}>
        {goldTrimMaterial}
      </RoundedBox>
      <RoundedBox args={[1.5, 0.06, 0.82]} radius={0.03} position={[0, -0.02, 0]}>
        {goldTrimMaterial}
      </RoundedBox>

      {/* LCD SCREEN (32" CURVED) */}
      <RoundedBox args={[1.1, 0.8, 0.08]} radius={0.04} position={[0, 1.15, 0.42]}>
        <meshStandardMaterial
          color="#000000"
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Screen Glass Overlay */}
      <RoundedBox args={[1.08, 0.78, 0.05]} radius={0.035} position={[0, 1.15, 0.45]}>
        {glassMaterial}
      </RoundedBox>

      {/* AAA Holographic Screen — Emissive glow */}
      <mesh ref={screenGlowRef} position={[0, 1.15, 0.47]}>
        <planeGeometry args={[1.04, 0.74]} />
        <meshStandardMaterial
          color={isActive ? "#4a9eff" : "#1a4d7f"}
          emissive={isActive ? "#4a9eff" : "#1a4d7f"}
          emissiveIntensity={isActive ? 1.5 : 1.0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Screen Content: 3 REELS */}
      <group position={[0, 1.15, 0.48]}>
        {/* Reel 1 (Left) */}
        <group ref={reel1Ref} position={[-0.32, 0, 0]}>
          {symbols.map((symbol, i) => (
            <Text
              key={i}
              position={[0, Math.sin((i / symbols.length) * Math.PI * 2) * 0.22, Math.cos((i / symbols.length) * Math.PI * 2) * 0.22]}
              rotation={[-(i / symbols.length) * Math.PI * 2, 0, 0]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {symbol}
            </Text>
          ))}
        </group>

        {/* Reel 2 (Center) */}
        <group ref={reel2Ref} position={[0, 0, 0]}>
          {symbols.map((symbol, i) => (
            <Text
              key={i}
              position={[0, Math.sin((i / symbols.length) * Math.PI * 2) * 0.22, Math.cos((i / symbols.length) * Math.PI * 2) * 0.22]}
              rotation={[-(i / symbols.length) * Math.PI * 2, 0, 0]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {symbol}
            </Text>
          ))}
        </group>

        {/* Reel 3 (Right) */}
        <group ref={reel3Ref} position={[0.32, 0, 0]}>
          {symbols.map((symbol, i) => (
            <Text
              key={i}
              position={[0, Math.sin((i / symbols.length) * Math.PI * 2) * 0.22, Math.cos((i / symbols.length) * Math.PI * 2) * 0.22]}
              rotation={[-(i / symbols.length) * Math.PI * 2, 0, 0]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {symbol}
            </Text>
          ))}
        </group>
      </group>

      {/* BUTTON PANEL (Professional) */}
      <RoundedBox args={[1.15, 0.28, 0.22]} radius={0.04} position={[0, 0.35, 0.48]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </RoundedBox>

      {/* SPIN BUTTON (Large, Red, Premium) */}
      <mesh position={[0, 0.35, 0.62]}>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 32]} />
        <meshStandardMaterial
          color={isActive ? "#ff4444" : "#cc2222"}
          metalness={0.7}
          roughness={0.3}
          emissive={isActive ? "#ff4444" : "#cc2222"}
          emissiveIntensity={isActive ? 0.5 : 0.2}
        />
      </mesh>

      {/* Button Label */}
      <Text
        position={[0, 0.35, 0.66]}
        fontSize={0.035}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        SPIN
      </Text>

      {/* ANIMATED FLOATING LABEL (Large, Billboard, AAA quality) */}
      <group ref={labelGroupRef} position={[0, 2.25, 0]}>
        {/* Background card (dark, subtle) */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[label.length * 0.12 + 0.8, 0.5]} />
          <meshStandardMaterial
            color={isActive ? '#1a0f28' : '#0a0a12'}
            metalness={0.4}
            roughness={0.7}
            emissive={isActive ? '#4a9eff' : '#FFD700'}
            emissiveIntensity={isActive ? 0.6 : 0.3}
          />
        </mesh>

        {/* Border glow */}
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[label.length * 0.12 + 0.9, 0.58]} />
          <meshBasicMaterial
            color={isActive ? '#4a9eff' : '#FFD700'}
            transparent
            opacity={isActive ? 0.9 : 0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Large readable text with outline - CRISP RENDERING */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.24}
          color={isActive ? '#00ffff' : '#FFD700'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
          font="/fonts/Inter-Bold.ttf"
          fillOpacity={1.0}
          outlineOpacity={1.0}
          renderOrder={1000}
        >
          {label.toUpperCase()}
          <meshBasicMaterial
            color={isActive ? '#00ffff' : '#FFD700'}
            transparent={false}
            toneMapped={false}
          />
        </Text>

        {/* Point light when active */}
        {isActive && (
          <pointLight
            position={[0, 0, 0.3]}
            color="#00ffff"
            intensity={3.0}
            distance={5}
            decay={2}
          />
        )}
      </group>


      {/* LED LIGHT RING (Rotating Chase) - brighter */}
      <group ref={lightRingRef} position={[0, 1.85, 0]}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const x = Math.cos(angle) * 0.7
          const z = Math.sin(angle) * 0.7
          const hue = (i / 12) * 360

          return (
            <Sphere key={i} args={[0.045, 8, 8]} position={[x, 0, z]}>
              <meshStandardMaterial
                color={`hsl(${hue}, 100%, 70%)`}
                emissive={`hsl(${hue}, 100%, 60%)`}
                emissiveIntensity={isActive ? 2.0 : 0.8}
              />
            </Sphere>
          )
        })}
      </group>

      {/* BASE PEDESTAL */}
      <RoundedBox args={[1.58, 0.22, 0.92]} radius={0.07} position={[0, 0.11, 0]}>
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.3} />
      </RoundedBox>

      {/* POINT LIGHTS (Dynamic) - brighter */}
      <pointLight
        position={[0, 1.15, 0.55]}
        intensity={isActive ? 4.5 : 2.0}
        color={isActive ? "#4a9eff" : "#1a4d7f"}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[0, 0.35, 0.7]}
        intensity={isActive ? 3.0 : 1.2}
        color={isActive ? "#ff4444" : "#cc2222"}
        distance={4.5}
        decay={2}
      />
      <pointLight
        position={[0, 2.65, 0]}
        intensity={isActive ? 2.5 : 1.0}
        color="#FFD700"
        distance={5}
        decay={2}
      />
      {/* LED ring glow */}
      <pointLight
        position={[0, 1.85, 0]}
        intensity={isActive ? 2.0 : 0.8}
        color="#ff00ff"
        distance={4}
        decay={2}
      />

    </group>
  )
}
