/**
 * Cyberpunk Avatar
 *
 * Futuristic design with:
 * - Sleek black jacket with neon trim
 * - Glowing visor/glasses
 * - Metallic cybernetic accents
 * - LED strips on clothing
 * - Animated neon effects
 */

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CollisionBox {
  x: number
  z: number
  width: number
  depth: number
}

interface AvatarProps {
  positionRef: React.MutableRefObject<THREE.Vector3>
  rotationRef?: React.MutableRefObject<number>
  isMovingRef?: React.MutableRefObject<boolean>
  machinePositions?: { x: number; z: number }[]
  collisionBoxes?: CollisionBox[]
  isSittingRef: React.MutableRefObject<boolean>
  sittingRotationRef: React.MutableRefObject<number>
  inputDisabled?: boolean // When true, avatar ignores all keyboard input
}

// Movement config - INSTANT start/stop, smooth rotation
const MOVE_SPEED = 7 // Direct movement speed
const ROTATION_SPEED = 15 // Smooth rotation

// Slot machine collision box
const MACHINE_WIDTH = 1.8
const MACHINE_DEPTH = 1.0

// Cyberpunk proportions - 25% larger
const SCALE = 1.25
const BODY = {
  height: 1.85 * SCALE,
  headRadius: 0.11 * SCALE,
  neckHeight: 0.07 * SCALE,
  shoulderWidth: 0.44 * SCALE,
  chestHeight: 0.34 * SCALE,
  waistWidth: 0.32 * SCALE,
  hipWidth: 0.34 * SCALE,
  torsoHeight: 0.54 * SCALE,
  upperArmLength: 0.28 * SCALE,
  lowerArmLength: 0.26 * SCALE,
  armThickness: 0.05 * SCALE,
  upperLegLength: 0.44 * SCALE,
  lowerLegLength: 0.42 * SCALE,
  legThickness: 0.075 * SCALE,
  footLength: 0.24 * SCALE,
  footHeight: 0.08 * SCALE
}

// Cyberpunk colors
const CYBER = {
  skin: '#c4a882',
  jacket: '#0a0a12',
  jacketHighlight: '#1a1a28',
  pants: '#080810',
  boots: '#0a0a0a',
  metal: '#4a4a5a',
  chrome: '#8888aa',
  neonCyan: '#00ffff',
  neonMagenta: '#ff00aa',
  neonPurple: '#8844ff',
  visor: '#00ddff',
  hair: '#1a1a24'
}

export function Avatar({ positionRef, rotationRef: externalRotationRef, isMovingRef, machinePositions = [], collisionBoxes = [], isSittingRef, sittingRotationRef, inputDisabled = false }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const rotationRef = useRef(0)
  const walkCycle = useRef(0)
  const idleTime = useRef(0)
  const glowTime = useRef(Math.random() * 100)

  // Velocity for smooth movement
  const velocityRef = useRef({ x: 0, z: 0 })

  // Key state - useRef to avoid stale closures and module-level globals
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  })

  // Limb refs for animation
  const leftUpperLegRef = useRef<THREE.Group>(null!)
  const rightUpperLegRef = useRef<THREE.Group>(null!)
  const leftLowerLegRef = useRef<THREE.Group>(null!)
  const rightLowerLegRef = useRef<THREE.Group>(null!)
  const leftUpperArmRef = useRef<THREE.Group>(null!)
  const rightUpperArmRef = useRef<THREE.Group>(null!)
  const leftLowerArmRef = useRef<THREE.Group>(null!)
  const rightLowerArmRef = useRef<THREE.Group>(null!)
  const spineRef = useRef<THREE.Group>(null!)
  const headRef = useRef<THREE.Group>(null!)
  const hipsRef = useRef<THREE.Group>(null!)

  // Neon glow refs
  const visorRef = useRef<THREE.Mesh>(null!)
  const chestLedRef = useRef<THREE.Mesh>(null!)
  const leftArmLedRef = useRef<THREE.Mesh>(null!)
  const rightArmLedRef = useRef<THREE.Mesh>(null!)
  const backLedRef = useRef<THREE.Mesh>(null!)
  const bootLedLeftRef = useRef<THREE.Mesh>(null!)
  const bootLedRightRef = useRef<THREE.Mesh>(null!)

  // Track inputDisabled in a ref for use in event handlers
  const inputDisabledRef = useRef(inputDisabled)
  useEffect(() => {
    inputDisabledRef.current = inputDisabled
    // Reset all keys when input becomes disabled
    if (inputDisabled) {
      keysRef.current.forward = false
      keysRef.current.backward = false
      keysRef.current.left = false
      keysRef.current.right = false
    }
  }, [inputDisabled])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore all input when disabled (slot is open)
      if (inputDisabledRef.current) return

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = false
          break
      }
    }

    const handleBlur = () => {
      keysRef.current.forward = false
      keysRef.current.backward = false
      keysRef.current.left = false
      keysRef.current.right = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const moving = !isSittingRef.current && (keysRef.current.forward || keysRef.current.backward || keysRef.current.left || keysRef.current.right)
    glowTime.current += delta

    // Update external refs for effects
    if (isMovingRef) isMovingRef.current = moving
    if (externalRotationRef) externalRotationRef.current = rotationRef.current

    // SITTING POSE
    if (isSittingRef.current) {
      groupRef.current.position.x = positionRef.current.x
      groupRef.current.position.z = positionRef.current.z
      groupRef.current.position.y = 0.1 // Slightly lower when sitting
      groupRef.current.rotation.y = sittingRotationRef.current

      const glow = glowTime.current
      const glowPulse = 0.7 + Math.sin(glow * 3) * 0.3
      const visorPulse = 0.8 + Math.sin(glow * 2) * 0.2

      // Animate LEDs while sitting
      if (visorRef.current) {
        const mat = visorRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = visorPulse
      }
      if (chestLedRef.current) {
        const mat = chestLedRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = glowPulse
      }

      // Sitting pose - legs bent 90 degrees, arms on knees
      if (hipsRef.current) {
        hipsRef.current.rotation.x = 0
        hipsRef.current.rotation.y = 0
      }
      if (spineRef.current) {
        spineRef.current.rotation.x = -0.1 // Slight lean back
        spineRef.current.rotation.y = 0
        spineRef.current.rotation.z = 0
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0.05 // Looking slightly down
        headRef.current.rotation.y = Math.sin(glow * 0.5) * 0.05 // Subtle head movement
      }

      // Legs bent at hips (sitting)
      if (leftUpperLegRef.current) {
        leftUpperLegRef.current.rotation.x = -1.57 // -90 degrees
        leftUpperLegRef.current.rotation.z = 0.1
      }
      if (rightUpperLegRef.current) {
        rightUpperLegRef.current.rotation.x = -1.57
        rightUpperLegRef.current.rotation.z = -0.1
      }
      // Lower legs hanging down (bent at knee)
      if (leftLowerLegRef.current) {
        leftLowerLegRef.current.rotation.x = 1.57 // Bent forward
      }
      if (rightLowerLegRef.current) {
        rightLowerLegRef.current.rotation.x = 1.57
      }

      // Arms resting on thighs
      if (leftUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = 0.4
        leftUpperArmRef.current.rotation.z = 0.3
      }
      if (rightUpperArmRef.current) {
        rightUpperArmRef.current.rotation.x = 0.4
        rightUpperArmRef.current.rotation.z = -0.3
      }
      if (leftLowerArmRef.current) {
        leftLowerArmRef.current.rotation.x = -0.8
      }
      if (rightLowerArmRef.current) {
        rightLowerArmRef.current.rotation.x = -0.8
      }

      return // Skip normal animation
    }

    // INSTANT movement - no acceleration/deceleration
    if (moving) {
      // Calculate input direction
      let inputX = 0
      let inputZ = 0
      if (keysRef.current.forward) inputZ -= 1
      if (keysRef.current.backward) inputZ += 1
      if (keysRef.current.left) inputX -= 1
      if (keysRef.current.right) inputX += 1

      // Normalize
      const inputLength = Math.sqrt(inputX * inputX + inputZ * inputZ)
      if (inputLength > 0) {
        inputX /= inputLength
        inputZ /= inputLength
      }

      // INSTANT velocity - directly set, no gradual acceleration
      velocityRef.current.x = inputX * MOVE_SPEED
      velocityRef.current.z = inputZ * MOVE_SPEED

      // Smooth rotation to face movement direction
      const targetRotation = Math.atan2(inputX, inputZ)
      let rotDiff = targetRotation - rotationRef.current
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
      rotationRef.current += rotDiff * ROTATION_SPEED * delta

      walkCycle.current += delta * 10
      idleTime.current = 0
    } else {
      // INSTANT stop - no deceleration
      velocityRef.current.x = 0
      velocityRef.current.z = 0
      idleTime.current += delta
    }

    // Apply velocity to position
    if (moving) {
      let newX = positionRef.current.x + velocityRef.current.x * delta
      let newZ = positionRef.current.z + velocityRef.current.z * delta

      // Collision check - slot machines
      for (const machine of machinePositions) {
        const dx = newX - machine.x
        const dz = newZ - machine.z
        if (Math.abs(dx) < MACHINE_WIDTH && Math.abs(dz) < MACHINE_DEPTH) {
          if (Math.abs(dx) > Math.abs(dz)) {
            newX = machine.x + Math.sign(dx) * MACHINE_WIDTH
          } else {
            newZ = machine.z + Math.sign(dz) * MACHINE_DEPTH
          }
        }
      }

      // Collision check - furniture (couches, tables, bar)
      for (const box of collisionBoxes) {
        const dx = newX - box.x
        const dz = newZ - box.z
        const halfW = box.width / 2 + 0.3
        const halfD = box.depth / 2 + 0.3
        if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
          const overlapX = halfW - Math.abs(dx)
          const overlapZ = halfD - Math.abs(dz)
          if (overlapX < overlapZ) {
            newX = box.x + Math.sign(dx) * halfW
          } else {
            newZ = box.z + Math.sign(dz) * halfD
          }
        }
      }

      positionRef.current.x = newX
      positionRef.current.z = newZ
    }

    // Bounds
    positionRef.current.x = Math.max(-28, Math.min(28, positionRef.current.x))
    positionRef.current.z = Math.max(-8, Math.min(20, positionRef.current.z))

    // Apply root position
    groupRef.current.position.x = positionRef.current.x
    groupRef.current.position.z = positionRef.current.z
    groupRef.current.rotation.y = rotationRef.current

    // ========== ANIMATION ==========
    const t = walkCycle.current
    const idle = idleTime.current
    const glow = glowTime.current

    // Neon glow pulsing
    const glowPulse = 0.7 + Math.sin(glow * 3) * 0.3
    const visorPulse = 0.8 + Math.sin(glow * 2) * 0.2

    if (visorRef.current) {
      const mat = visorRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = visorPulse
    }
    if (chestLedRef.current) {
      const mat = chestLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = glowPulse
    }
    if (leftArmLedRef.current) {
      const mat = leftArmLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = glowPulse
    }
    if (rightArmLedRef.current) {
      const mat = rightArmLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = glowPulse
    }
    if (backLedRef.current) {
      const mat = backLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.6 + Math.sin(glow * 4) * 0.4
    }
    if (bootLedLeftRef.current) {
      const mat = bootLedLeftRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = moving ? 1.0 : 0.5 + Math.sin(glow * 2.5) * 0.3
    }
    if (bootLedRightRef.current) {
      const mat = bootLedRightRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = moving ? 1.0 : 0.5 + Math.sin(glow * 2.5 + 1) * 0.3
    }

    if (moving) {
      // WALKING ANIMATION
      const legSwing = Math.sin(t) * 0.5
      const armSwing = Math.sin(t) * 0.4
      const kneeAngle = Math.max(0, Math.sin(t - 0.5)) * 0.8
      const elbowAngle = Math.max(0, Math.sin(t + 0.5)) * 0.5

      const bodyBob = Math.abs(Math.sin(t * 2)) * 0.03
      groupRef.current.position.y = bodyBob

      if (hipsRef.current) {
        hipsRef.current.rotation.y = Math.sin(t) * 0.08
        hipsRef.current.rotation.x = 0.02
      }

      if (spineRef.current) {
        spineRef.current.rotation.y = -Math.sin(t) * 0.1
        spineRef.current.rotation.z = Math.sin(t) * 0.03
      }

      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t) * 0.05
        headRef.current.rotation.x = -0.05
      }

      if (leftUpperLegRef.current) leftUpperLegRef.current.rotation.x = legSwing
      if (leftLowerLegRef.current) leftLowerLegRef.current.rotation.x = legSwing < 0 ? kneeAngle : 0
      if (rightUpperLegRef.current) rightUpperLegRef.current.rotation.x = -legSwing
      if (rightLowerLegRef.current) rightLowerLegRef.current.rotation.x = -legSwing < 0 ? kneeAngle : 0

      if (leftUpperArmRef.current) leftUpperArmRef.current.rotation.x = -armSwing
      if (leftLowerArmRef.current) leftLowerArmRef.current.rotation.x = -elbowAngle - 0.2
      if (rightUpperArmRef.current) rightUpperArmRef.current.rotation.x = armSwing
      if (rightLowerArmRef.current) rightLowerArmRef.current.rotation.x = -elbowAngle - 0.2

    } else {
      // IDLE ANIMATION
      const breathe = Math.sin(idle * 1.5) * 0.01
      const subtleWeight = Math.sin(idle * 0.5) * 0.01

      groupRef.current.position.y = 0

      if (spineRef.current) {
        spineRef.current.rotation.x = breathe
        spineRef.current.rotation.y = subtleWeight
        spineRef.current.rotation.z = 0
      }

      if (hipsRef.current) {
        hipsRef.current.rotation.x = 0
        hipsRef.current.rotation.y = 0
      }

      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(idle * 0.7) * 0.02
        headRef.current.rotation.y = Math.sin(idle * 0.3) * 0.03
      }

      if (leftUpperLegRef.current) leftUpperLegRef.current.rotation.x = 0
      if (rightUpperLegRef.current) rightUpperLegRef.current.rotation.x = 0
      if (leftLowerLegRef.current) leftLowerLegRef.current.rotation.x = 0
      if (rightLowerLegRef.current) rightLowerLegRef.current.rotation.x = 0

      if (leftUpperArmRef.current) {
        leftUpperArmRef.current.rotation.x = 0.1
        leftUpperArmRef.current.rotation.z = 0.15
      }
      if (rightUpperArmRef.current) {
        rightUpperArmRef.current.rotation.x = 0.1
        rightUpperArmRef.current.rotation.z = -0.15
      }
      if (leftLowerArmRef.current) leftLowerArmRef.current.rotation.x = -0.3
      if (rightLowerArmRef.current) rightLowerArmRef.current.rotation.x = -0.3
    }
  })

  const hipY = BODY.footHeight + BODY.lowerLegLength + BODY.upperLegLength

  return (
    <group ref={groupRef}>
      {/* ===== HIPS ===== */}
      <group ref={hipsRef} position={[0, hipY, 0]}>
        {/* Hip armor */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[BODY.hipWidth + 0.04, 0.14, 0.2]} />
          <meshStandardMaterial color={CYBER.jacket} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Tech belt */}
        <mesh position={[0, 0.0, 0]}>
          <boxGeometry args={[BODY.hipWidth + 0.06, 0.05, 0.21]} />
          <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Belt LED strip */}
        <mesh position={[0, 0.0, 0.11]}>
          <boxGeometry args={[BODY.hipWidth - 0.1, 0.02, 0.01]} />
          <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.8} toneMapped={false} />
        </mesh>

        {/* ===== LEFT LEG ===== */}
        <group ref={leftUpperLegRef} position={[-0.1, -0.08, 0]}>
          {/* Upper leg - tactical pants */}
          <mesh position={[0, -BODY.upperLegLength / 2, 0]}>
            <capsuleGeometry args={[BODY.legThickness, BODY.upperLegLength - 0.16, 8, 16]} />
            <meshStandardMaterial color={CYBER.pants} metalness={0.4} roughness={0.6} />
          </mesh>
          {/* Thigh armor plate */}
          <mesh position={[0, -BODY.upperLegLength / 2, 0.06]}>
            <boxGeometry args={[0.08, 0.18, 0.03]} />
            <meshStandardMaterial color={CYBER.metal} metalness={0.8} roughness={0.2} />
          </mesh>

          <group ref={leftLowerLegRef} position={[0, -BODY.upperLegLength, 0]}>
            {/* Lower leg */}
            <mesh position={[0, -BODY.lowerLegLength / 2, 0]}>
              <capsuleGeometry args={[BODY.legThickness * 0.85, BODY.lowerLegLength - 0.14, 8, 16]} />
              <meshStandardMaterial color={CYBER.pants} metalness={0.4} roughness={0.6} />
            </mesh>
            {/* Shin guard */}
            <mesh position={[0, -BODY.lowerLegLength / 2, 0.05]}>
              <boxGeometry args={[0.06, 0.22, 0.025]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>

            {/* Cyberpunk boot */}
            <mesh position={[0, -BODY.lowerLegLength - BODY.footHeight / 2 + 0.02, 0.03]}>
              <boxGeometry args={[0.1, BODY.footHeight + 0.02, BODY.footLength]} />
              <meshStandardMaterial color={CYBER.boots} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Boot LED */}
            <mesh ref={bootLedLeftRef} position={[0, -BODY.lowerLegLength - 0.02, 0.12]}>
              <boxGeometry args={[0.08, 0.015, 0.08]} />
              <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.8} toneMapped={false} />
            </mesh>
            {/* Boot chrome accent */}
            <mesh position={[0, -BODY.lowerLegLength + 0.02, 0.05]}>
              <boxGeometry args={[0.11, 0.04, 0.02]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>
          </group>
        </group>

        {/* ===== RIGHT LEG ===== */}
        <group ref={rightUpperLegRef} position={[0.1, -0.08, 0]}>
          <mesh position={[0, -BODY.upperLegLength / 2, 0]}>
            <capsuleGeometry args={[BODY.legThickness, BODY.upperLegLength - 0.16, 8, 16]} />
            <meshStandardMaterial color={CYBER.pants} metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[0, -BODY.upperLegLength / 2, 0.06]}>
            <boxGeometry args={[0.08, 0.18, 0.03]} />
            <meshStandardMaterial color={CYBER.metal} metalness={0.8} roughness={0.2} />
          </mesh>

          <group ref={rightLowerLegRef} position={[0, -BODY.upperLegLength, 0]}>
            <mesh position={[0, -BODY.lowerLegLength / 2, 0]}>
              <capsuleGeometry args={[BODY.legThickness * 0.85, BODY.lowerLegLength - 0.14, 8, 16]} />
              <meshStandardMaterial color={CYBER.pants} metalness={0.4} roughness={0.6} />
            </mesh>
            <mesh position={[0, -BODY.lowerLegLength / 2, 0.05]}>
              <boxGeometry args={[0.06, 0.22, 0.025]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>

            <mesh position={[0, -BODY.lowerLegLength - BODY.footHeight / 2 + 0.02, 0.03]}>
              <boxGeometry args={[0.1, BODY.footHeight + 0.02, BODY.footLength]} />
              <meshStandardMaterial color={CYBER.boots} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh ref={bootLedRightRef} position={[0, -BODY.lowerLegLength - 0.02, 0.12]}>
              <boxGeometry args={[0.08, 0.015, 0.08]} />
              <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.8} toneMapped={false} />
            </mesh>
            <mesh position={[0, -BODY.lowerLegLength + 0.02, 0.05]}>
              <boxGeometry args={[0.11, 0.04, 0.02]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ===== SPINE/TORSO ===== */}
      <group ref={spineRef} position={[0, hipY, 0]}>
        {/* Lower torso - jacket */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[BODY.waistWidth + 0.04, 0.22, 0.18]} />
          <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Chest - techwear jacket */}
        <mesh position={[0, 0.38, 0.01]}>
          <boxGeometry args={[BODY.shoulderWidth + 0.06, BODY.chestHeight, 0.2]} />
          <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Jacket collar/high neck */}
        <mesh position={[0, 0.54, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.08, 12]} />
          <meshStandardMaterial color={CYBER.jacketHighlight} metalness={0.4} roughness={0.5} />
        </mesh>

        {/* Chest LED panel */}
        <mesh ref={chestLedRef} position={[0, 0.36, 0.12]}>
          <boxGeometry args={[0.15, 0.08, 0.01]} />
          <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.8} toneMapped={false} />
        </mesh>

        {/* Shoulder pads */}
        <mesh position={[-BODY.shoulderWidth / 2 - 0.04, 0.44, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.14]} />
          <meshStandardMaterial color={CYBER.metal} metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[BODY.shoulderWidth / 2 + 0.04, 0.44, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.14]} />
          <meshStandardMaterial color={CYBER.metal} metalness={0.85} roughness={0.15} />
        </mesh>

        {/* Back LED strip */}
        <mesh ref={backLedRef} position={[0, 0.35, -0.1]}>
          <boxGeometry args={[0.02, 0.3, 0.01]} />
          <meshBasicMaterial color={CYBER.neonPurple} transparent opacity={0.7} toneMapped={false} />
        </mesh>

        {/* ===== LEFT ARM ===== */}
        <group ref={leftUpperArmRef} position={[-BODY.shoulderWidth / 2 - 0.04, 0.42, 0]}>
          <mesh position={[-0.02, 0, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Upper arm - jacket sleeve */}
          <mesh position={[0, -BODY.upperArmLength / 2, 0]}>
            <capsuleGeometry args={[BODY.armThickness + 0.01, BODY.upperArmLength - 0.1, 8, 16]} />
            <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Arm LED strip */}
          <mesh ref={leftArmLedRef} position={[-0.045, -BODY.upperArmLength / 2, 0]}>
            <boxGeometry args={[0.01, 0.15, 0.02]} />
            <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.8} toneMapped={false} />
          </mesh>

          <group ref={leftLowerArmRef} position={[0, -BODY.upperArmLength, 0]}>
            {/* Lower arm - cybernetic look */}
            <mesh position={[0, -BODY.lowerArmLength / 2, 0]}>
              <capsuleGeometry args={[BODY.armThickness * 0.85, BODY.lowerArmLength - 0.08, 8, 16]} />
              <meshStandardMaterial color={CYBER.jacketHighlight} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Wrist tech */}
            <mesh position={[0, -BODY.lowerArmLength + 0.05, 0]}>
              <cylinderGeometry args={[0.04, 0.045, 0.06, 12]} />
              <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Cybernetic hand */}
            <mesh position={[0, -BODY.lowerArmLength - 0.04, 0]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color={CYBER.metal} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* ===== RIGHT ARM ===== */}
        <group ref={rightUpperArmRef} position={[BODY.shoulderWidth / 2 + 0.04, 0.42, 0]}>
          <mesh position={[0.02, 0, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.1} />
          </mesh>

          <mesh position={[0, -BODY.upperArmLength / 2, 0]}>
            <capsuleGeometry args={[BODY.armThickness + 0.01, BODY.upperArmLength - 0.1, 8, 16]} />
            <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
          </mesh>

          <mesh ref={rightArmLedRef} position={[0.045, -BODY.upperArmLength / 2, 0]}>
            <boxGeometry args={[0.01, 0.15, 0.02]} />
            <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.8} toneMapped={false} />
          </mesh>

          <group ref={rightLowerArmRef} position={[0, -BODY.upperArmLength, 0]}>
            <mesh position={[0, -BODY.lowerArmLength / 2, 0]}>
              <capsuleGeometry args={[BODY.armThickness * 0.85, BODY.lowerArmLength - 0.08, 8, 16]} />
              <meshStandardMaterial color={CYBER.jacketHighlight} metalness={0.6} roughness={0.4} />
            </mesh>

            <mesh position={[0, -BODY.lowerArmLength + 0.05, 0]}>
              <cylinderGeometry args={[0.04, 0.045, 0.06, 12]} />
              <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.1} />
            </mesh>

            <mesh position={[0, -BODY.lowerArmLength - 0.04, 0]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color={CYBER.metal} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* ===== HEAD ===== */}
        <group ref={headRef} position={[0, 0.6, 0]}>
          {/* Neck - cybernetic */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.05, BODY.neckHeight, 12]} />
            <meshStandardMaterial color={CYBER.skin} roughness={0.85} />
          </mesh>
          {/* Neck tech ring */}
          <mesh position={[0, 0.02, 0]}>
            <torusGeometry args={[0.05, 0.008, 8, 24]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Head */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <sphereGeometry args={[BODY.headRadius, 16, 16]} />
            <meshStandardMaterial color={CYBER.skin} roughness={0.85} />
          </mesh>

          {/* Cyberpunk hair - slicked back with shaved sides */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.04, -0.02]}>
            <sphereGeometry args={[BODY.headRadius * 0.85, 16, 16]} />
            <meshStandardMaterial color={CYBER.hair} roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Top hair volume */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.08, -0.01]}>
            <boxGeometry args={[0.08, 0.04, 0.12]} />
            <meshStandardMaterial color={CYBER.hair} roughness={0.9} />
          </mesh>

          {/* VISOR / CYBER GLASSES */}
          <mesh ref={visorRef} position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.085]}>
            <boxGeometry args={[0.2, 0.04, 0.03]} />
            <meshBasicMaterial color={CYBER.visor} transparent opacity={0.9} toneMapped={false} />
          </mesh>
          {/* Visor frame */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.08]}>
            <boxGeometry args={[0.22, 0.05, 0.02]} />
            <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Visor side connectors */}
          <mesh position={[-0.11, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.04]}>
            <boxGeometry args={[0.02, 0.03, 0.08]} />
            <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.11, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.04]}>
            <boxGeometry args={[0.02, 0.03, 0.08]} />
            <meshStandardMaterial color={CYBER.metal} metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Ear tech implants */}
          <mesh position={[-BODY.headRadius - 0.02, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <boxGeometry args={[0.03, 0.05, 0.04]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[BODY.headRadius + 0.02, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <boxGeometry args={[0.03, 0.05, 0.04]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Ear LED dots */}
          <mesh position={[-BODY.headRadius - 0.035, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color={CYBER.neonMagenta} toneMapped={false} />
          </mesh>
          <mesh position={[BODY.headRadius + 0.035, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial color={CYBER.neonMagenta} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* Single character glow */}
      <pointLight position={[0, 1, 0.3]} color={CYBER.neonCyan} intensity={0.4} distance={2} />
    </group>
  )
}
