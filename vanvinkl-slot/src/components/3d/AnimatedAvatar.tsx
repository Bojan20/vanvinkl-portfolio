'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Cylinder, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface AnimatedAvatarProps {
  isMovingRef: React.MutableRefObject<boolean>
  moveDirectionRef: React.MutableRefObject<THREE.Vector3>
  currentSpeedRef: React.MutableRefObject<number>
  isNearMachine?: boolean // For facial expressions (smile when near machine)
  celebrationTrigger?: number // Increment to trigger celebration (jump for joy)
}

/**
 * AAA-level Link/Zelda-style anime fighter with:
 * - Walk cycle (leg/arm swing, body bob)
 * - Idle breathing + weight shift
 * - Head tracking (looks toward movement)
 * - Procedural animation (no bones required)
 * - Link's green tunic, blonde hair, Master Sword, Hylian Shield
 * - Triforce emblem on chest and shield
 * - Anime-style blue eyes with blinking
 */
export function AnimatedAvatar({
  isMovingRef,
  moveDirectionRef,
  currentSpeedRef,
  isNearMachine = false,
  celebrationTrigger = 0
}: AnimatedAvatarProps) {
  // Body parts refs
  const bodyRef = useRef<THREE.Group>(null!)
  const headRef = useRef<THREE.Mesh>(null!)
  const leftLegRef = useRef<THREE.Group>(null!)
  const rightLegRef = useRef<THREE.Group>(null!)
  const leftArmRef = useRef<THREE.Group>(null!)
  const rightArmRef = useRef<THREE.Group>(null!)

  // Facial expression refs
  const leftEyeRef = useRef<THREE.Mesh>(null!)
  const rightEyeRef = useRef<THREE.Mesh>(null!)
  const mouthRef = useRef<THREE.Mesh>(null!)

  // Animation state
  const walkCycle = useRef(0)
  const idleTime = useRef(0)
  const breathPhase = useRef(0)
  const headLookAngle = useRef(0)

  // Facial expression state
  const blinkTimer = useRef(0)
  const blinkDuration = useRef(0.15) // Blink lasts 0.15s
  const nextBlinkTime = useRef(Math.random() * 3 + 2) // Random 2-5s
  const isBlinking = useRef(false)
  const eyeScaleY = useRef(1)
  const mouthCurve = useRef(0) // 0 = neutral, 1 = smile

  // Celebration animation state
  const isCelebrating = useRef(false)
  const celebrationTime = useRef(0)
  const celebrationDuration = 1.5 // 1.5 second celebration
  const lastCelebrationTrigger = useRef(0)

  // Memoized materials for 60fps performance (ZELDA STYLE)
  const materials = useMemo(() => ({
    greenTunic: <meshStandardMaterial color="#2d8659" metalness={0.1} roughness={0.8} />, // Link's green tunic
    darkGreen: <meshStandardMaterial color="#1a5c3e" metalness={0.2} roughness={0.7} />, // Dark green accents
    skinTone: <meshStandardMaterial color="#ffcba4" metalness={0.05} roughness={0.9} />, // Anime skin
    hairBlonde: <meshStandardMaterial color="#f4d03f" metalness={0.2} roughness={0.6} />, // Blonde hair
    eyesBlue: <meshStandardMaterial color="#4a90e2" emissive="#4a90e2" emissiveIntensity={0.3} />, // Anime blue eyes
    brownBoots: <meshStandardMaterial color="#6b4423" metalness={0.3} roughness={0.6} />, // Brown leather boots
    goldBelt: <meshStandardMaterial color="#f4d03f" metalness={0.7} roughness={0.3} />, // Gold belt buckle
    silverSword: <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />, // Master Sword metal
    blueGem: <meshStandardMaterial color="#00bfff" emissive="#00bfff" emissiveIntensity={1.0} metalness={0.8} roughness={0.2} />, // Sword gem
    shieldMetal: <meshStandardMaterial color="#e8e8e8" metalness={0.8} roughness={0.3} />, // Hylian Shield
    triforce: <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} metalness={0.7} roughness={0.2} />, // Triforce symbol
    shadow: <meshBasicMaterial color="#000000" transparent opacity={0.3} />
  }), [])

  useFrame((state, delta) => {
    if (!bodyRef.current) return

    const isMoving = isMovingRef.current
    const moveDirection = moveDirectionRef.current
    const currentSpeed = currentSpeedRef.current

    // CELEBRATION TRIGGER (jump for joy when triggered)
    if (celebrationTrigger > lastCelebrationTrigger.current) {
      isCelebrating.current = true
      celebrationTime.current = 0
      lastCelebrationTrigger.current = celebrationTrigger
    }

    // Celebration animation (jump with arms up)
    if (isCelebrating.current) {
      celebrationTime.current += delta

      if (celebrationTime.current < celebrationDuration) {
        const t = celebrationTime.current
        const progress = t / celebrationDuration

        // Jump arc (parabola)
        const jumpHeight = Math.sin(progress * Math.PI) * 1.5
        bodyRef.current.position.y = 0.5 + jumpHeight

        // Arms raise up in excitement
        if (leftArmRef.current && rightArmRef.current) {
          const armAngle = -Math.PI / 2 + Math.sin(t * 8) * 0.3 // Wave arms
          leftArmRef.current.rotation.x = armAngle
          rightArmRef.current.rotation.x = armAngle
          leftArmRef.current.rotation.z = -Math.PI / 4
          rightArmRef.current.rotation.z = Math.PI / 4
        }

        // Head tilt back (joy)
        if (headRef.current) {
          headRef.current.rotation.x = -0.3
        }

        // Legs tuck during jump
        if (leftLegRef.current && rightLegRef.current) {
          const tuckAngle = Math.sin(progress * Math.PI) * 0.8
          leftLegRef.current.rotation.x = tuckAngle
          rightLegRef.current.rotation.x = tuckAngle
        }

        // Big smile during celebration
        mouthCurve.current = 1.0
      } else {
        // Celebration complete
        isCelebrating.current = false
      }
    }

    // FACIAL EXPRESSIONS
    // Blinking animation (random intervals)
    blinkTimer.current += delta

    if (!isBlinking.current && blinkTimer.current >= nextBlinkTime.current) {
      // Start blink
      isBlinking.current = true
      blinkTimer.current = 0
    }

    if (isBlinking.current) {
      if (blinkTimer.current < blinkDuration.current / 2) {
        // Close eyes (first half of blink)
        eyeScaleY.current = THREE.MathUtils.lerp(eyeScaleY.current, 0.1, delta * 20)
      } else if (blinkTimer.current < blinkDuration.current) {
        // Open eyes (second half)
        eyeScaleY.current = THREE.MathUtils.lerp(eyeScaleY.current, 1.0, delta * 20)
      } else {
        // Blink complete
        isBlinking.current = false
        blinkTimer.current = 0
        nextBlinkTime.current = Math.random() * 3 + 2 // Next blink in 2-5s
        eyeScaleY.current = 1.0
      }
    }

    // Apply eye scale (blink effect)
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = eyeScaleY.current
      rightEyeRef.current.scale.y = eyeScaleY.current
    }

    // Smile when near machine (excitement)
    const targetSmile = isNearMachine ? 1.0 : 0.0
    mouthCurve.current = THREE.MathUtils.lerp(mouthCurve.current, targetSmile, delta * 5)

    // Apply mouth shape (smile = arc upward)
    if (mouthRef.current) {
      mouthRef.current.position.y = 0.42 + mouthCurve.current * 0.02
      mouthRef.current.scale.x = 1 + mouthCurve.current * 0.3
    }

    // Skip walk/idle if celebrating
    if (isCelebrating.current) {
      return // Celebration overrides all other animations
    }

    if (isMoving && currentSpeed > 0.1) {
      // WALK CYCLE
      walkCycle.current += delta * 8 // Walk speed multiplier
      idleTime.current = 0

      const t = walkCycle.current

      // Body bob (up/down motion)
      bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(t * 2)) * 0.08

      // Body lean forward slightly when walking
      bodyRef.current.rotation.x = Math.sin(t) * 0.05

      // Body sway side-to-side
      bodyRef.current.rotation.z = Math.sin(t * 2) * 0.03

      // LEG SWING (opposite phases)
      if (leftLegRef.current && rightLegRef.current) {
        // Left leg
        leftLegRef.current.rotation.x = Math.sin(t) * 0.6 // Forward/back swing
        leftLegRef.current.position.y = -0.05 + Math.abs(Math.sin(t)) * 0.1 // Lift on swing

        // Right leg (opposite phase)
        rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.6
        rightLegRef.current.position.y = -0.05 + Math.abs(Math.sin(t + Math.PI)) * 0.1
      }

      // ARM SWING (opposite to legs for natural gait)
      if (leftArmRef.current && rightArmRef.current) {
        // Left arm swings with right leg
        leftArmRef.current.rotation.x = Math.sin(t + Math.PI) * 0.4
        leftArmRef.current.rotation.z = -0.2 + Math.sin(t) * 0.1

        // Right arm swings with left leg
        rightArmRef.current.rotation.x = Math.sin(t) * 0.4
        rightArmRef.current.rotation.z = 0.2 + Math.sin(t + Math.PI) * 0.1
      }

      // HEAD TRACKING (looks in movement direction)
      if (headRef.current && moveDirection.length() > 0) {
        const targetAngle = Math.atan2(moveDirection.x, moveDirection.z)
        headLookAngle.current = THREE.MathUtils.lerp(
          headLookAngle.current,
          targetAngle * 0.3, // 30% head turn
          delta * 5
        )
        headRef.current.rotation.y = headLookAngle.current
      }

      breathPhase.current = 0 // Reset breath when moving
    } else {
      // IDLE ANIMATIONS
      idleTime.current += delta

      // Breathing (chest expand/contract)
      breathPhase.current += delta * 2
      const breathScale = 1 + Math.sin(breathPhase.current) * 0.03
      if (bodyRef.current) {
        bodyRef.current.scale.setScalar(breathScale)
      }

      // Weight shift (subtle sway)
      if (bodyRef.current) {
        bodyRef.current.rotation.z = Math.sin(idleTime.current * 0.5) * 0.02
        bodyRef.current.position.y = 0.5 + Math.sin(idleTime.current * 0.7) * 0.01
      }

      // Idle leg stance (slight rest pose)
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
          leftLegRef.current.rotation.x,
          0.05, // Slight forward bend
          delta * 3
        )
        leftLegRef.current.position.y = -0.05

        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
          rightLegRef.current.rotation.x,
          0.05,
          delta * 3
        )
        rightLegRef.current.position.y = -0.05
      }

      // Idle arms (relaxed at sides)
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x,
          0.1,
          delta * 3
        )
        leftArmRef.current.rotation.z = -0.2

        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0.1,
          delta * 3
        )
        rightArmRef.current.rotation.z = 0.2
      }

      // Head look around (curiosity)
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(idleTime.current * 0.3) * 0.2
        headRef.current.rotation.x = Math.sin(idleTime.current * 0.4) * 0.1
      }

      walkCycle.current = 0 // Reset walk cycle
    }
  })

  return (
    <group ref={bodyRef} position={[0, 0.5, 0]}>
      {/* Body (torso) - LINK'S GREEN TUNIC - OPTIMIZED 8 segments */}
      <Cylinder args={[0.25, 0.3, 0.6, 8]} position={[0, 0, 0]}>
        {materials.greenTunic}
      </Cylinder>

      {/* Tunic collar/neckline (dark green) */}
      <Cylinder args={[0.26, 0.26, 0.08, 8]} position={[0, 0.28, 0]}>
        {materials.darkGreen}
      </Cylinder>

      {/* Triforce symbol (gold emblem on chest) */}
      <mesh position={[0, 0.15, 0.31]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.1, 0.1, 3]} />
        {materials.triforce}
      </mesh>
      <mesh position={[-0.05, 0.08, 0.31]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.05, 0.05, 3]} />
        {materials.triforce}
      </mesh>
      <mesh position={[0.05, 0.08, 0.31]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.05, 0.05, 3]} />
        {materials.triforce}
      </mesh>

      {/* Gold belt (Link's signature belt) */}
      <Cylinder args={[0.305, 0.305, 0.08, 8]} position={[0, -0.2, 0]}>
        {materials.goldBelt}
      </Cylinder>

      {/* Belt buckle (gold square) */}
      <mesh position={[0, -0.2, 0.31]}>
        <boxGeometry args={[0.12, 0.08, 0.02]} />
        {materials.goldBelt}
      </mesh>

      {/* Head (anime-style) - OPTIMIZED 12 segments */}
      <Sphere ref={headRef} args={[0.22, 12, 12]} position={[0, 0.5, 0]}>
        {materials.skinTone}
      </Sphere>

      {/* Blonde hair (Link's signature hair) */}
      {/* Top hair tuft */}
      <mesh position={[0, 0.68, 0.05]} rotation={[-0.2, 0, 0]}>
        <coneGeometry args={[0.15, 0.25, 6]} />
        {materials.hairBlonde}
      </mesh>
      {/* Back hair (ponytail style) */}
      <mesh position={[0, 0.45, -0.2]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.05, 0.3, 6]} />
        {materials.hairBlonde}
      </mesh>
      {/* Side bangs */}
      <mesh position={[-0.15, 0.55, 0.1]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.08, 0.2, 0.05]} />
        {materials.hairBlonde}
      </mesh>
      <mesh position={[0.15, 0.55, 0.1]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.2, 0.05]} />
        {materials.hairBlonde}
      </mesh>

      {/* Anime blue eyes with blink - OPTIMIZED 6 segments */}
      <Sphere ref={leftEyeRef} args={[0.05, 6, 6]} position={[-0.08, 0.52, 0.18]}>
        {materials.eyesBlue}
      </Sphere>
      <Sphere ref={rightEyeRef} args={[0.05, 6, 6]} position={[0.08, 0.52, 0.18]}>
        {materials.eyesBlue}
      </Sphere>

      {/* Nose (subtle) */}
      <mesh position={[0, 0.48, 0.22]}>
        <boxGeometry args={[0.03, 0.06, 0.02]} />
        {materials.skinTone}
      </mesh>

      {/* Mouth (smile curve when near machine) */}
      <mesh ref={mouthRef} position={[0, 0.42, 0.2]}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
        {materials.skinTone}
      </mesh>

      {/* Hylian Shield (on back) */}
      <group position={[0, 0.1, -0.35]} rotation={[0.3, 0, 0]}>
        {/* Shield body */}
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.05, 8]} />
          {materials.shieldMetal}
        </mesh>
        {/* Triforce emblem on shield */}
        <mesh position={[0, 0, 0.03]}>
          <coneGeometry args={[0.1, 0.1, 3]} />
          {materials.triforce}
        </mesh>
        {/* Blue accent (Hylian crest) */}
        <mesh position={[0, -0.1, 0.03]}>
          <circleGeometry args={[0.08, 6]} />
          {materials.blueGem}
        </mesh>
      </group>

      {/* Left Leg - GREEN TIGHTS + BROWN BOOTS - OPTIMIZED */}
      <group ref={leftLegRef} position={[-0.12, -0.35, 0]}>
        {/* Thigh (green tights) */}
        <Cylinder args={[0.08, 0.08, 0.35, 6]} position={[0, -0.175, 0]}>
          {materials.darkGreen}
        </Cylinder>
        {/* Shin (brown boot shaft) */}
        <Cylinder args={[0.07, 0.07, 0.3, 6]} position={[0, -0.5, 0]}>
          {materials.brownBoots}
        </Cylinder>
        {/* Boot foot */}
        <RoundedBox args={[0.12, 0.08, 0.2]} radius={0.03} position={[0, -0.68, 0.05]}>
          {materials.brownBoots}
        </RoundedBox>
      </group>

      {/* Right Leg - GREEN TIGHTS + BROWN BOOTS - OPTIMIZED */}
      <group ref={rightLegRef} position={[0.12, -0.35, 0]}>
        {/* Thigh (green tights) */}
        <Cylinder args={[0.08, 0.08, 0.35, 6]} position={[0, -0.175, 0]}>
          {materials.darkGreen}
        </Cylinder>
        {/* Shin (brown boot shaft) */}
        <Cylinder args={[0.07, 0.07, 0.3, 6]} position={[0, -0.5, 0]}>
          {materials.brownBoots}
        </Cylinder>
        {/* Boot foot */}
        <RoundedBox args={[0.12, 0.08, 0.2]} radius={0.03} position={[0, -0.68, 0.05]}>
          {materials.brownBoots}
        </RoundedBox>
      </group>

      {/* Left Arm - GREEN TUNIC SLEEVE - OPTIMIZED */}
      <group ref={leftArmRef} position={[-0.35, 0.15, 0]}>
        {/* Upper arm (green sleeve) */}
        <Cylinder args={[0.06, 0.06, 0.3, 6]} position={[0, -0.15, 0]}>
          {materials.greenTunic}
        </Cylinder>
        {/* Forearm (skin tone) */}
        <Cylinder args={[0.055, 0.055, 0.25, 6]} position={[0, -0.425, 0]}>
          {materials.skinTone}
        </Cylinder>
        {/* Hand (fist) */}
        <Sphere args={[0.07, 6, 6]} position={[0, -0.58, 0]}>
          {materials.skinTone}
        </Sphere>
      </group>

      {/* Right Arm - GREEN TUNIC SLEEVE + MASTER SWORD - OPTIMIZED */}
      <group ref={rightArmRef} position={[0.35, 0.15, 0]}>
        {/* Upper arm (green sleeve) */}
        <Cylinder args={[0.06, 0.06, 0.3, 6]} position={[0, -0.15, 0]}>
          {materials.greenTunic}
        </Cylinder>
        {/* Forearm (skin tone) */}
        <Cylinder args={[0.055, 0.055, 0.25, 6]} position={[0, -0.425, 0]}>
          {materials.skinTone}
        </Cylinder>
        {/* Hand (fist holding sword) */}
        <Sphere args={[0.07, 6, 6]} position={[0, -0.58, 0]}>
          {materials.skinTone}
        </Sphere>

        {/* MASTER SWORD */}
        {/* Blade (silver) */}
        <mesh position={[0, -0.65, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.04, 0.5, 0.01]} />
          {materials.silverSword}
        </mesh>
        {/* Crossguard (gold) */}
        <mesh position={[0, -0.58, 0.2]}>
          <boxGeometry args={[0.25, 0.03, 0.03]} />
          {materials.goldBelt}
        </mesh>
        {/* Hilt (dark green grip) */}
        <Cylinder args={[0.025, 0.025, 0.15, 6]} position={[0, -0.5, 0.2]}>
          {materials.darkGreen}
        </Cylinder>
        {/* Pommel gem (blue glowing) */}
        <Sphere args={[0.04, 6, 6]} position={[0, -0.42, 0.2]}>
          {materials.blueGem}
        </Sphere>
      </group>

      {/* Shadow circle (ground contact) - OPTIMIZED 12 segments */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <circleGeometry args={[0.35, 12]} />
        {materials.shadow}
      </mesh>
    </group>
  )
}
