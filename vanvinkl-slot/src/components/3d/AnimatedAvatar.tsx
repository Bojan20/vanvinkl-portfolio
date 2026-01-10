'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Cylinder, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface AnimatedAvatarProps {
  isMovingRef: React.MutableRefObject<boolean>
  moveDirectionRef: React.MutableRefObject<THREE.Vector3>
  currentSpeedRef: React.MutableRefObject<number>
}

/**
 * AAA-level animated character with:
 * - Walk cycle (leg/arm swing, body bob)
 * - Idle breathing + weight shift
 * - Head tracking (looks toward movement)
 * - Procedural animation (no bones required)
 */
export function AnimatedAvatar({ isMovingRef, moveDirectionRef, currentSpeedRef }: AnimatedAvatarProps) {
  // Body parts refs
  const bodyRef = useRef<THREE.Group>(null!)
  const headRef = useRef<THREE.Mesh>(null!)
  const leftLegRef = useRef<THREE.Group>(null!)
  const rightLegRef = useRef<THREE.Group>(null!)
  const leftArmRef = useRef<THREE.Group>(null!)
  const rightArmRef = useRef<THREE.Group>(null!)

  // Animation state
  const walkCycle = useRef(0)
  const idleTime = useRef(0)
  const breathPhase = useRef(0)
  const headLookAngle = useRef(0)

  useFrame((state, delta) => {
    if (!bodyRef.current) return

    const isMoving = isMovingRef.current
    const moveDirection = moveDirectionRef.current
    const currentSpeed = currentSpeedRef.current

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
      {/* Body (torso) */}
      <Cylinder args={[0.25, 0.3, 0.6, 12]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.7} />
      </Cylinder>

      {/* Head */}
      <Sphere ref={headRef} args={[0.22, 16, 16]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#d4a574" metalness={0.1} roughness={0.9} />
      </Sphere>

      {/* Eyes */}
      <Sphere args={[0.05, 8, 8]} position={[-0.08, 0.55, 0.18]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.05, 8, 8]} position={[0.08, 0.55, 0.18]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.12, -0.35, 0]}>
        {/* Thigh */}
        <Cylinder args={[0.08, 0.08, 0.35, 8]} position={[0, -0.175, 0]}>
          <meshStandardMaterial color="#2563eb" metalness={0.2} roughness={0.8} />
        </Cylinder>
        {/* Shin */}
        <Cylinder args={[0.07, 0.07, 0.3, 8]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#1e40af" metalness={0.2} roughness={0.8} />
        </Cylinder>
        {/* Foot */}
        <RoundedBox args={[0.12, 0.08, 0.2]} radius={0.03} position={[0, -0.68, 0.05]}>
          <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
        </RoundedBox>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.12, -0.35, 0]}>
        {/* Thigh */}
        <Cylinder args={[0.08, 0.08, 0.35, 8]} position={[0, -0.175, 0]}>
          <meshStandardMaterial color="#2563eb" metalness={0.2} roughness={0.8} />
        </Cylinder>
        {/* Shin */}
        <Cylinder args={[0.07, 0.07, 0.3, 8]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#1e40af" metalness={0.2} roughness={0.8} />
        </Cylinder>
        {/* Foot */}
        <RoundedBox args={[0.12, 0.08, 0.2]} radius={0.03} position={[0, -0.68, 0.05]}>
          <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
        </RoundedBox>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.35, 0.15, 0]}>
        {/* Upper arm */}
        <Cylinder args={[0.06, 0.06, 0.3, 8]} position={[0, -0.15, 0]}>
          <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.7} />
        </Cylinder>
        {/* Forearm */}
        <Cylinder args={[0.055, 0.055, 0.25, 8]} position={[0, -0.425, 0]}>
          <meshStandardMaterial color="#d4a574" metalness={0.1} roughness={0.9} />
        </Cylinder>
        {/* Hand */}
        <Sphere args={[0.07, 8, 8]} position={[0, -0.58, 0]}>
          <meshStandardMaterial color="#d4a574" metalness={0.1} roughness={0.9} />
        </Sphere>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.35, 0.15, 0]}>
        {/* Upper arm */}
        <Cylinder args={[0.06, 0.06, 0.3, 8]} position={[0, -0.15, 0]}>
          <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.7} />
        </Cylinder>
        {/* Forearm */}
        <Cylinder args={[0.055, 0.055, 0.25, 8]} position={[0, -0.425, 0]}>
          <meshStandardMaterial color="#d4a574" metalness={0.1} roughness={0.9} />
        </Cylinder>
        {/* Hand */}
        <Sphere args={[0.07, 8, 8]} position={[0, -0.58, 0]}>
          <meshStandardMaterial color="#d4a574" metalness={0.1} roughness={0.9} />
        </Sphere>
      </group>

      {/* Shadow circle (ground contact) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
