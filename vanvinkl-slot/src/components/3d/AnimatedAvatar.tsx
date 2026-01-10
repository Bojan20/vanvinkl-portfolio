'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Cylinder, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface AnimatedAvatarProps {
  isMovingRef: React.MutableRefObject<boolean>
  moveDirectionRef: React.MutableRefObject<THREE.Vector3>
  currentSpeedRef: React.MutableRefObject<number>
  isNearMachine?: boolean
  celebrationTrigger?: number
}

/**
 * ORIGINAL AVATAR — Professional casino visitor character
 *
 * Design: Stylized humanoid in smart casual attire
 * - Navy blazer with gold accents (matches casino theme)
 * - Clean, modern silhouette
 * - Glowing gold details (VIP feel)
 * - NO copyrighted elements
 *
 * Optimized for 60fps:
 * - Low-poly geometry (6-8 segments)
 * - Memoized materials
 * - Direct calculations (no unnecessary lerps)
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
  const blinkDuration = useRef(0.15)
  const nextBlinkTime = useRef(Math.random() * 3 + 2)
  const isBlinking = useRef(false)
  const eyeScaleY = useRef(1)
  const mouthCurve = useRef(0)

  // Celebration state
  const isCelebrating = useRef(false)
  const celebrationTime = useRef(0)
  const celebrationDuration = 1.5
  const lastCelebrationTrigger = useRef(0)

  // ═══ MEMOIZED MATERIALS — Casino VIP Theme ═══
  const materials = useMemo(() => ({
    // Clothing — Smart Casual Casino Look
    navyBlazer: <meshStandardMaterial color="#1a2744" metalness={0.15} roughness={0.7} />,
    whiteShirt: <meshStandardMaterial color="#f8f8f8" metalness={0.05} roughness={0.85} />,
    darkPants: <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.75} />,
    brownShoes: <meshStandardMaterial color="#4a3728" metalness={0.25} roughness={0.6} />,

    // Accents — Gold VIP Details
    goldAccent: <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} emissive="#d4af37" emissiveIntensity={0.3} />,
    goldButton: <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.15} emissive="#ffd700" emissiveIntensity={0.5} />,

    // Skin & Features
    skinTone: <meshStandardMaterial color="#e8c4a0" metalness={0.02} roughness={0.9} />,
    hairDark: <meshStandardMaterial color="#2a1a0a" metalness={0.1} roughness={0.8} />,
    eyeWhite: <meshStandardMaterial color="#ffffff" metalness={0} roughness={0.9} />,
    eyeIris: <meshStandardMaterial color="#4a7c59" emissive="#4a7c59" emissiveIntensity={0.2} />,
    eyebrow: <meshStandardMaterial color="#1a0a00" metalness={0.05} roughness={0.9} />,

    // Ground shadow
    shadow: <meshBasicMaterial color="#000000" transparent opacity={0.25} />
  }), [])

  useFrame((state, delta) => {
    if (!bodyRef.current) return

    const isMoving = isMovingRef.current
    const moveDirection = moveDirectionRef.current
    const currentSpeed = currentSpeedRef.current

    // ═══ CELEBRATION TRIGGER ═══
    if (celebrationTrigger > lastCelebrationTrigger.current) {
      isCelebrating.current = true
      celebrationTime.current = 0
      lastCelebrationTrigger.current = celebrationTrigger
    }

    // Celebration animation
    if (isCelebrating.current) {
      celebrationTime.current += delta

      if (celebrationTime.current < celebrationDuration) {
        const t = celebrationTime.current
        const progress = t / celebrationDuration

        // Jump arc
        const jumpHeight = Math.sin(progress * Math.PI) * 1.2
        bodyRef.current.position.y = 0.5 + jumpHeight

        // Arms raise in excitement
        if (leftArmRef.current && rightArmRef.current) {
          const armAngle = -Math.PI / 2.5 + Math.sin(t * 10) * 0.25
          leftArmRef.current.rotation.x = armAngle
          rightArmRef.current.rotation.x = armAngle
          leftArmRef.current.rotation.z = -Math.PI / 5
          rightArmRef.current.rotation.z = Math.PI / 5
        }

        // Head tilt (joy)
        if (headRef.current) {
          headRef.current.rotation.x = -0.25
        }

        // Legs tuck
        if (leftLegRef.current && rightLegRef.current) {
          const tuckAngle = Math.sin(progress * Math.PI) * 0.6
          leftLegRef.current.rotation.x = tuckAngle
          rightLegRef.current.rotation.x = tuckAngle
        }

        mouthCurve.current = 1.0
      } else {
        isCelebrating.current = false
      }
    }

    // ═══ FACIAL EXPRESSIONS ═══
    blinkTimer.current += delta

    if (!isBlinking.current && blinkTimer.current >= nextBlinkTime.current) {
      isBlinking.current = true
      blinkTimer.current = 0
    }

    if (isBlinking.current) {
      if (blinkTimer.current < blinkDuration.current / 2) {
        eyeScaleY.current = THREE.MathUtils.lerp(eyeScaleY.current, 0.1, delta * 25)
      } else if (blinkTimer.current < blinkDuration.current) {
        eyeScaleY.current = THREE.MathUtils.lerp(eyeScaleY.current, 1.0, delta * 25)
      } else {
        isBlinking.current = false
        blinkTimer.current = 0
        nextBlinkTime.current = Math.random() * 3 + 2
        eyeScaleY.current = 1.0
      }
    }

    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = eyeScaleY.current
      rightEyeRef.current.scale.y = eyeScaleY.current
    }

    // Smile when near machine
    const targetSmile = isNearMachine ? 1.0 : 0.0
    mouthCurve.current = THREE.MathUtils.lerp(mouthCurve.current, targetSmile, delta * 6)

    if (mouthRef.current) {
      mouthRef.current.position.y = 0.38 + mouthCurve.current * 0.015
      mouthRef.current.scale.x = 1 + mouthCurve.current * 0.25
    }

    // Skip walk/idle if celebrating
    if (isCelebrating.current) return

    if (isMoving && currentSpeed > 0.1) {
      // ═══ WALK CYCLE ═══
      const speedMultiplier = 8 + (currentSpeed / 5) * 8
      walkCycle.current += delta * speedMultiplier
      idleTime.current = 0

      const t = walkCycle.current

      // Body bob
      const bobAmount = 0.06 + (currentSpeed / 5) * 0.04
      bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(t * 2)) * bobAmount

      // Body lean
      const leanAmount = 0.04 + (currentSpeed / 5) * 0.06
      bodyRef.current.rotation.x = Math.sin(t) * leanAmount
      bodyRef.current.rotation.z = Math.sin(t * 2) * 0.015

      // Leg swing
      if (leftLegRef.current && rightLegRef.current) {
        const legSwing = 0.5 + (currentSpeed / 5) * 0.2
        const legLift = 0.08 + (currentSpeed / 5) * 0.06

        leftLegRef.current.rotation.x = Math.sin(t) * legSwing
        leftLegRef.current.position.y = -0.05 + Math.abs(Math.sin(t)) * legLift

        rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * legSwing
        rightLegRef.current.position.y = -0.05 + Math.abs(Math.sin(t + Math.PI)) * legLift
      }

      // Arm swing
      if (leftArmRef.current && rightArmRef.current) {
        const armSwing = 0.35 + (currentSpeed / 5) * 0.2

        leftArmRef.current.rotation.x = Math.sin(t + Math.PI) * armSwing
        leftArmRef.current.rotation.z = -0.15 + Math.sin(t) * 0.06

        rightArmRef.current.rotation.x = Math.sin(t) * armSwing
        rightArmRef.current.rotation.z = 0.15 + Math.sin(t + Math.PI) * 0.06
      }

      // Head tracking
      if (headRef.current && moveDirection.length() > 0) {
        const targetAngle = Math.atan2(moveDirection.x, moveDirection.z) * 0.2
        headLookAngle.current += (targetAngle - headLookAngle.current) * Math.min(delta * 12, 1)
        headRef.current.rotation.y = headLookAngle.current
      }

      breathPhase.current = 0
    } else {
      // ═══ IDLE ANIMATIONS ═══
      idleTime.current += delta

      // Breathing
      breathPhase.current += delta * 2
      const breathScale = 1 + Math.sin(breathPhase.current) * 0.025
      if (bodyRef.current) {
        bodyRef.current.scale.setScalar(breathScale)
      }

      // Weight shift
      if (bodyRef.current) {
        bodyRef.current.rotation.z = Math.sin(idleTime.current * 0.5) * 0.015
        bodyRef.current.position.y = 0.5 + Math.sin(idleTime.current * 0.7) * 0.008
      }

      // Idle legs
      if (leftLegRef.current && rightLegRef.current) {
        const alpha = Math.min(delta * 10, 1)
        leftLegRef.current.rotation.x += (0.03 - leftLegRef.current.rotation.x) * alpha
        leftLegRef.current.position.y = -0.05

        rightLegRef.current.rotation.x += (0.03 - rightLegRef.current.rotation.x) * alpha
        rightLegRef.current.position.y = -0.05
      }

      // Idle arms
      if (leftArmRef.current && rightArmRef.current) {
        const alpha = Math.min(delta * 10, 1)
        leftArmRef.current.rotation.x += (0.08 - leftArmRef.current.rotation.x) * alpha
        leftArmRef.current.rotation.z = -0.15

        rightArmRef.current.rotation.x += (0.08 - rightArmRef.current.rotation.x) * alpha
        rightArmRef.current.rotation.z = 0.15
      }

      // Head look around
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(idleTime.current * 0.3) * 0.12
        headRef.current.rotation.x = Math.sin(idleTime.current * 0.35) * 0.06
      }

      walkCycle.current = 0
    }
  })

  return (
    <group ref={bodyRef} position={[0, 0.5, 0]}>
      {/* ═══ TORSO — Navy Blazer ═══ */}
      <Cylinder args={[0.22, 0.28, 0.55, 8]} position={[0, 0.02, 0]}>
        {materials.navyBlazer}
      </Cylinder>

      {/* Blazer lapels (V-shape) */}
      <mesh position={[0, 0.18, 0.23]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.18, 0.2, 0.02]} />
        {materials.navyBlazer}
      </mesh>

      {/* White shirt visible at collar */}
      <Cylinder args={[0.18, 0.18, 0.08, 8]} position={[0, 0.28, 0]}>
        {materials.whiteShirt}
      </Cylinder>

      {/* Gold blazer buttons (2) */}
      <Sphere args={[0.025, 6, 6]} position={[0, 0.08, 0.27]}>
        {materials.goldButton}
      </Sphere>
      <Sphere args={[0.025, 6, 6]} position={[0, -0.05, 0.27]}>
        {materials.goldButton}
      </Sphere>

      {/* Gold pocket square accent */}
      <mesh position={[-0.12, 0.15, 0.24]}>
        <boxGeometry args={[0.06, 0.04, 0.01]} />
        {materials.goldAccent}
      </mesh>

      {/* ═══ HEAD ═══ */}
      <Sphere ref={headRef} args={[0.2, 12, 12]} position={[0, 0.48, 0]}>
        {materials.skinTone}
      </Sphere>

      {/* Hair — Short, styled */}
      <mesh position={[0, 0.62, -0.02]} rotation={[-0.15, 0, 0]}>
        <sphereGeometry args={[0.17, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {materials.hairDark}
      </mesh>
      {/* Side hair */}
      <mesh position={[-0.12, 0.52, 0.08]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        {materials.hairDark}
      </mesh>
      <mesh position={[0.12, 0.52, 0.08]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        {materials.hairDark}
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.065, 0.54, 0.17]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.06, 0.015, 0.01]} />
        {materials.eyebrow}
      </mesh>
      <mesh position={[0.065, 0.54, 0.17]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.06, 0.015, 0.01]} />
        {materials.eyebrow}
      </mesh>

      {/* Eyes — Green iris with white */}
      <group position={[-0.065, 0.5, 0.16]}>
        <Sphere args={[0.035, 6, 6]}>
          {materials.eyeWhite}
        </Sphere>
        <Sphere ref={leftEyeRef} args={[0.022, 6, 6]} position={[0, 0, 0.015]}>
          {materials.eyeIris}
        </Sphere>
      </group>
      <group position={[0.065, 0.5, 0.16]}>
        <Sphere args={[0.035, 6, 6]}>
          {materials.eyeWhite}
        </Sphere>
        <Sphere ref={rightEyeRef} args={[0.022, 6, 6]} position={[0, 0, 0.015]}>
          {materials.eyeIris}
        </Sphere>
      </group>

      {/* Nose */}
      <mesh position={[0, 0.45, 0.19]}>
        <boxGeometry args={[0.025, 0.05, 0.02]} />
        {materials.skinTone}
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, 0.38, 0.17]}>
        <boxGeometry args={[0.06, 0.015, 0.01]} />
        <meshStandardMaterial color="#c08080" metalness={0} roughness={0.8} />
      </mesh>

      {/* ═══ LEGS — Dark Pants ═══ */}
      <group ref={leftLegRef} position={[-0.1, -0.32, 0]}>
        {/* Thigh */}
        <Cylinder args={[0.075, 0.07, 0.32, 6]} position={[0, -0.16, 0]}>
          {materials.darkPants}
        </Cylinder>
        {/* Shin */}
        <Cylinder args={[0.065, 0.06, 0.28, 6]} position={[0, -0.46, 0]}>
          {materials.darkPants}
        </Cylinder>
        {/* Shoe */}
        <RoundedBox args={[0.1, 0.06, 0.18]} radius={0.02} position={[0, -0.64, 0.03]}>
          {materials.brownShoes}
        </RoundedBox>
      </group>

      <group ref={rightLegRef} position={[0.1, -0.32, 0]}>
        <Cylinder args={[0.075, 0.07, 0.32, 6]} position={[0, -0.16, 0]}>
          {materials.darkPants}
        </Cylinder>
        <Cylinder args={[0.065, 0.06, 0.28, 6]} position={[0, -0.46, 0]}>
          {materials.darkPants}
        </Cylinder>
        <RoundedBox args={[0.1, 0.06, 0.18]} radius={0.02} position={[0, -0.64, 0.03]}>
          {materials.brownShoes}
        </RoundedBox>
      </group>

      {/* ═══ ARMS — Navy Blazer Sleeves ═══ */}
      <group ref={leftArmRef} position={[-0.3, 0.12, 0]}>
        {/* Upper arm (blazer) */}
        <Cylinder args={[0.055, 0.055, 0.28, 6]} position={[0, -0.14, 0]}>
          {materials.navyBlazer}
        </Cylinder>
        {/* Forearm (shirt cuff visible) */}
        <Cylinder args={[0.045, 0.045, 0.22, 6]} position={[0, -0.39, 0]}>
          {materials.whiteShirt}
        </Cylinder>
        {/* Hand */}
        <Sphere args={[0.055, 6, 6]} position={[0, -0.52, 0]}>
          {materials.skinTone}
        </Sphere>
        {/* Gold cufflink */}
        <Sphere args={[0.015, 4, 4]} position={[0.045, -0.3, 0]}>
          {materials.goldButton}
        </Sphere>
      </group>

      <group ref={rightArmRef} position={[0.3, 0.12, 0]}>
        <Cylinder args={[0.055, 0.055, 0.28, 6]} position={[0, -0.14, 0]}>
          {materials.navyBlazer}
        </Cylinder>
        <Cylinder args={[0.045, 0.045, 0.22, 6]} position={[0, -0.39, 0]}>
          {materials.whiteShirt}
        </Cylinder>
        <Sphere args={[0.055, 6, 6]} position={[0, -0.52, 0]}>
          {materials.skinTone}
        </Sphere>
        <Sphere args={[0.015, 4, 4]} position={[-0.045, -0.3, 0]}>
          {materials.goldButton}
        </Sphere>
      </group>

      {/* ═══ GROUND SHADOW ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.68, 0]}>
        <circleGeometry args={[0.3, 12]} />
        {materials.shadow}
      </mesh>

      {/* ═══ VIP GLOW RING (subtle gold aura) ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.67, 0]}>
        <ringGeometry args={[0.32, 0.38, 24]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}
