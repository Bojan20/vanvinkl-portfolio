/**
 * ULTIMATE VIBRANT Cyberpunk Avatar
 *
 * Features:
 * - Intense neon glow effects
 * - Holographic energy aura
 * - Animated LED strips everywhere
 * - Chrome/metallic cybernetic parts
 * - Particle energy field
 * - Glowing visor with scan lines
 * - Pulsing power core
 */

import { useRef, useMemo } from 'react'
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
  inputDisabled?: boolean
  mobileMovementRef?: React.MutableRefObject<{ x: number; y: number }>
}

// Movement config
const MOVE_SPEED = 7
const ROTATION_SPEED = 15

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

// ULTIMATE VIBRANT Cyberpunk colors
const CYBER = {
  // Base colors
  skin: '#d4b896',
  jacket: '#0a0812',
  jacketHighlight: '#1a1828',
  pants: '#080810',
  boots: '#0a0a0a',

  // Metallic
  metal: '#6a6a8a',
  chrome: '#aaaacc',
  gold: '#ffd700',

  // VIBRANT Neons - MUCH brighter
  neonCyan: '#00ffff',
  neonMagenta: '#ff00ff',
  neonPink: '#ff0080',
  neonPurple: '#aa44ff',
  neonBlue: '#0088ff',
  neonGreen: '#00ff88',
  neonOrange: '#ff8800',
  neonRed: '#ff0044',

  // Special effects
  visor: '#00ffff',
  powerCore: '#ff00ff',
  hologram: '#44ffff',
  energy: '#8844ff',
  hair: '#1a1a2a'
}

export function Avatar({ positionRef, rotationRef: externalRotationRef, isMovingRef, machinePositions = [], collisionBoxes = [], isSittingRef, sittingRotationRef, inputDisabled = false, mobileMovementRef }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const rotationRef = useRef(0)
  const walkCycle = useRef(0)
  const idleTime = useRef(0)
  const glowTime = useRef(Math.random() * 100)

  const velocityRef = useRef({ x: 0, z: 0 })

  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  })

  // Limb refs
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

  // MANY glow refs for ultimate effects
  const visorRef = useRef<THREE.Mesh>(null!)
  const powerCoreRef = useRef<THREE.Mesh>(null!)
  const auraRef = useRef<THREE.Mesh>(null!)
  const innerAuraRef = useRef<THREE.Mesh>(null!)

  // LED strip refs
  const chestLedRef = useRef<THREE.Mesh>(null!)
  const leftArmLedRef = useRef<THREE.Mesh>(null!)
  const rightArmLedRef = useRef<THREE.Mesh>(null!)
  const backLedRef = useRef<THREE.Mesh>(null!)
  const bootLedLeftRef = useRef<THREE.Mesh>(null!)
  const bootLedRightRef = useRef<THREE.Mesh>(null!)
  const beltLedRef = useRef<THREE.Mesh>(null!)
  const neckLedRef = useRef<THREE.Mesh>(null!)
  const shoulderLedLeftRef = useRef<THREE.Mesh>(null!)
  const shoulderLedRightRef = useRef<THREE.Mesh>(null!)
  const spineLedRef = useRef<THREE.Mesh>(null!)
  const wristLedLeftRef = useRef<THREE.Mesh>(null!)
  const wristLedRightRef = useRef<THREE.Mesh>(null!)
  const thighLedLeftRef = useRef<THREE.Mesh>(null!)
  const thighLedRightRef = useRef<THREE.Mesh>(null!)
  const earLedLeftRef = useRef<THREE.Mesh>(null!)
  const earLedRightRef = useRef<THREE.Mesh>(null!)

  // Track inputDisabled
  const inputDisabledRef = useRef(inputDisabled)

  // Update inputDisabled ref and reset keys + velocity when disabled
  useFrame(() => {
    if (inputDisabled !== inputDisabledRef.current) {
      inputDisabledRef.current = inputDisabled
      if (inputDisabled) {
        keysRef.current.forward = false
        keysRef.current.backward = false
        keysRef.current.left = false
        keysRef.current.right = false
        velocityRef.current.x = 0
        velocityRef.current.z = 0
      }
    }
  })

  // Keyboard handlers - inline in useFrame to avoid stale closures
  useMemo(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inputDisabledRef.current) return

      switch (e.code) {
        case 'ArrowUp':
          keysRef.current.forward = true
          break
        case 'ArrowDown':
          keysRef.current.backward = true
          break
        case 'ArrowLeft':
          keysRef.current.left = true
          break
        case 'ArrowRight':
          keysRef.current.right = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
          keysRef.current.forward = false
          break
        case 'ArrowDown':
          keysRef.current.backward = false
          break
        case 'ArrowLeft':
          keysRef.current.left = false
          break
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

    const mobileMoving = !inputDisabledRef.current && mobileMovementRef && (mobileMovementRef.current.x !== 0 || mobileMovementRef.current.y !== 0)
    const moving = !isSittingRef.current && !inputDisabledRef.current && (keysRef.current.forward || keysRef.current.backward || keysRef.current.left || keysRef.current.right || mobileMoving)
    glowTime.current += delta

    if (isMovingRef) isMovingRef.current = !!moving
    if (externalRotationRef) externalRotationRef.current = rotationRef.current

    const glow = glowTime.current

    // ====== ULTIMATE GLOW ANIMATIONS ======
    // Different frequencies for each element creates organic feel
    const pulse1 = 0.6 + Math.sin(glow * 3) * 0.4
    const pulse2 = 0.7 + Math.sin(glow * 4 + 1) * 0.3
    const pulse3 = 0.5 + Math.sin(glow * 5 + 2) * 0.5
    const pulse4 = 0.8 + Math.sin(glow * 2) * 0.2
    const fastPulse = 0.6 + Math.sin(glow * 8) * 0.4
    const slowPulse = 0.7 + Math.sin(glow * 1.5) * 0.3

    // Visor - scanning effect
    if (visorRef.current) {
      const mat = visorRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.85 + Math.sin(glow * 6) * 0.15
    }

    // Power core - heartbeat
    if (powerCoreRef.current) {
      const mat = powerCoreRef.current.material as THREE.MeshBasicMaterial
      const heartbeat = Math.pow(Math.sin(glow * 4), 2)
      mat.opacity = 0.7 + heartbeat * 0.3
      powerCoreRef.current.scale.setScalar(1 + heartbeat * 0.15)
    }

    // Outer aura - slow rotation and pulse
    if (auraRef.current) {
      auraRef.current.rotation.y = glow * 0.5
      const mat = auraRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = moving ? 0.25 + Math.sin(glow * 3) * 0.1 : 0.15 + Math.sin(glow * 2) * 0.05
    }

    // Inner aura - faster counter-rotation
    if (innerAuraRef.current) {
      innerAuraRef.current.rotation.y = -glow * 0.8
      const mat = innerAuraRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = moving ? 0.2 + Math.sin(glow * 4) * 0.1 : 0.1 + Math.sin(glow * 3) * 0.05
    }

    // Chest LED
    if (chestLedRef.current) {
      const mat = chestLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse1
    }

    // Back LED - slower
    if (backLedRef.current) {
      const mat = backLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse2
    }

    // Belt LED - medium
    if (beltLedRef.current) {
      const mat = beltLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse3
    }

    // Neck LED - fast
    if (neckLedRef.current) {
      const mat = neckLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = fastPulse
    }

    // Arm LEDs - opposite phase
    if (leftArmLedRef.current) {
      const mat = leftArmLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse1
    }
    if (rightArmLedRef.current) {
      const mat = rightArmLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse2
    }

    // Shoulder LEDs
    if (shoulderLedLeftRef.current) {
      const mat = shoulderLedLeftRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse4
    }
    if (shoulderLedRightRef.current) {
      const mat = shoulderLedRightRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse4
    }

    // Spine LED - slow wave
    if (spineLedRef.current) {
      const mat = spineLedRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = slowPulse
    }

    // Wrist LEDs
    if (wristLedLeftRef.current) {
      const mat = wristLedLeftRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = fastPulse
    }
    if (wristLedRightRef.current) {
      const mat = wristLedRightRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = fastPulse
    }

    // Thigh LEDs
    if (thighLedLeftRef.current) {
      const mat = thighLedLeftRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse3
    }
    if (thighLedRightRef.current) {
      const mat = thighLedRightRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse3
    }

    // Boot LEDs - bright when moving
    if (bootLedLeftRef.current) {
      const mat = bootLedLeftRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = moving ? 1.0 : 0.5 + Math.sin(glow * 2.5) * 0.3
    }
    if (bootLedRightRef.current) {
      const mat = bootLedRightRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = moving ? 1.0 : 0.5 + Math.sin(glow * 2.5 + 1) * 0.3
    }

    // Ear LEDs
    if (earLedLeftRef.current) {
      const mat = earLedLeftRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse1
    }
    if (earLedRightRef.current) {
      const mat = earLedRightRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = pulse2
    }

    // SITTING POSE
    if (isSittingRef.current) {
      groupRef.current.position.x = positionRef.current.x
      groupRef.current.position.z = positionRef.current.z
      groupRef.current.position.y = 0.1
      groupRef.current.rotation.y = sittingRotationRef.current

      // Sitting pose animations
      if (hipsRef.current) {
        hipsRef.current.rotation.x = 0
        hipsRef.current.rotation.y = 0
      }
      if (spineRef.current) {
        spineRef.current.rotation.x = -0.1
        spineRef.current.rotation.y = 0
        spineRef.current.rotation.z = 0
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0.05
        headRef.current.rotation.y = Math.sin(glow * 0.5) * 0.05
      }

      if (leftUpperLegRef.current) {
        leftUpperLegRef.current.rotation.x = -1.57
        leftUpperLegRef.current.rotation.z = 0.1
      }
      if (rightUpperLegRef.current) {
        rightUpperLegRef.current.rotation.x = -1.57
        rightUpperLegRef.current.rotation.z = -0.1
      }
      if (leftLowerLegRef.current) {
        leftLowerLegRef.current.rotation.x = 1.57
      }
      if (rightLowerLegRef.current) {
        rightLowerLegRef.current.rotation.x = 1.57
      }

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

      return
    }

    // MOVEMENT
    if (moving) {
      let inputX = 0
      let inputZ = 0

      // Keyboard input
      if (keysRef.current.forward) inputZ -= 1
      if (keysRef.current.backward) inputZ += 1
      if (keysRef.current.left) inputX -= 1
      if (keysRef.current.right) inputX += 1

      // Mobile joystick input (override keyboard if present)
      if (mobileMovementRef && (mobileMovementRef.current.x !== 0 || mobileMovementRef.current.y !== 0)) {
        inputX = mobileMovementRef.current.x  // Invert X (joystick right = left in world)
        inputZ = mobileMovementRef.current.y   // Y maps to Z (joystick up = forward = positive Z)
      }

      const inputLength = Math.sqrt(inputX * inputX + inputZ * inputZ)
      if (inputLength > 0) {
        inputX /= inputLength
        inputZ /= inputLength
      }

      velocityRef.current.x = inputX * MOVE_SPEED
      velocityRef.current.z = inputZ * MOVE_SPEED

      const targetRotation = Math.atan2(inputX, inputZ)
      let rotDiff = targetRotation - rotationRef.current
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
      rotationRef.current += rotDiff * ROTATION_SPEED * delta

      walkCycle.current += delta * 10
      idleTime.current = 0
    } else {
      velocityRef.current.x = 0
      velocityRef.current.z = 0
      idleTime.current += delta
    }

    // Apply velocity
    if (moving) {
      let newX = positionRef.current.x + velocityRef.current.x * delta
      let newZ = positionRef.current.z + velocityRef.current.z * delta

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

    positionRef.current.x = Math.max(-28, Math.min(28, positionRef.current.x))
    positionRef.current.z = Math.max(-8, Math.min(20, positionRef.current.z))

    groupRef.current.position.x = positionRef.current.x
    groupRef.current.position.z = positionRef.current.z
    groupRef.current.rotation.y = rotationRef.current

    // ========== ANIMATION ==========
    const t = walkCycle.current
    const idle = idleTime.current

    if (moving) {
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
      {/* ===== ENERGY AURA - OUTER ===== */}
      <mesh ref={auraRef} position={[0, 1.0, 0]}>
        <torusGeometry args={[0.8, 0.02, 8, 32]} />
        <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.2} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== ENERGY AURA - INNER ===== */}
      <mesh ref={innerAuraRef} position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.015, 8, 32]} />
        <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.15} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== GROUND GLOW RING ===== */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.6, 32]} />
        <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.3} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== HIPS ===== */}
      <group ref={hipsRef} position={[0, hipY, 0]}>
        {/* Hip armor */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[BODY.hipWidth + 0.04, 0.14, 0.2]} />
          <meshStandardMaterial color={CYBER.jacket} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Tech belt - CHROME */}
        <mesh position={[0, 0.0, 0]}>
          <boxGeometry args={[BODY.hipWidth + 0.06, 0.05, 0.21]} />
          <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Belt LED strip - VIBRANT */}
        <mesh ref={beltLedRef} position={[0, 0.0, 0.11]}>
          <boxGeometry args={[BODY.hipWidth - 0.1, 0.025, 0.01]} />
          <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.9} toneMapped={false} />
        </mesh>

        {/* Belt buckle glow */}
        <mesh position={[0, 0.0, 0.115]}>
          <boxGeometry args={[0.06, 0.04, 0.01]} />
          <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.8} toneMapped={false} />
        </mesh>

        {/* ===== LEFT LEG ===== */}
        <group ref={leftUpperLegRef} position={[-0.1, -0.08, 0]}>
          <mesh position={[0, -BODY.upperLegLength / 2, 0]}>
            <capsuleGeometry args={[BODY.legThickness, BODY.upperLegLength - 0.16, 8, 16]} />
            <meshStandardMaterial color={CYBER.pants} metalness={0.4} roughness={0.6} />
          </mesh>

          {/* Thigh armor - CHROME */}
          <mesh position={[0, -BODY.upperLegLength / 2, 0.06]}>
            <boxGeometry args={[0.09, 0.2, 0.035]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Thigh LED */}
          <mesh ref={thighLedLeftRef} position={[-0.07, -BODY.upperLegLength / 2, 0.02]}>
            <boxGeometry args={[0.01, 0.15, 0.02]} />
            <meshBasicMaterial color={CYBER.neonPurple} transparent opacity={0.8} toneMapped={false} />
          </mesh>

          <group ref={leftLowerLegRef} position={[0, -BODY.upperLegLength, 0]}>
            <mesh position={[0, -BODY.lowerLegLength / 2, 0]}>
              <capsuleGeometry args={[BODY.legThickness * 0.85, BODY.lowerLegLength - 0.14, 8, 16]} />
              <meshStandardMaterial color={CYBER.pants} metalness={0.4} roughness={0.6} />
            </mesh>

            {/* Shin guard - GOLD accent */}
            <mesh position={[0, -BODY.lowerLegLength / 2, 0.05]}>
              <boxGeometry args={[0.07, 0.24, 0.03]} />
              <meshStandardMaterial color={CYBER.gold} metalness={0.9} roughness={0.15} />
            </mesh>

            {/* Shin LED strip */}
            <mesh position={[0, -BODY.lowerLegLength / 2, 0.07]}>
              <boxGeometry args={[0.04, 0.18, 0.01]} />
              <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.7} toneMapped={false} />
            </mesh>

            {/* Cyberpunk boot */}
            <mesh position={[0, -BODY.lowerLegLength - BODY.footHeight / 2 + 0.02, 0.03]}>
              <boxGeometry args={[0.1, BODY.footHeight + 0.02, BODY.footLength]} />
              <meshStandardMaterial color={CYBER.boots} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Boot LED - VIBRANT */}
            <mesh ref={bootLedLeftRef} position={[0, -BODY.lowerLegLength - 0.02, 0.12]}>
              <boxGeometry args={[0.09, 0.02, 0.1]} />
              <meshBasicMaterial color={CYBER.neonPink} transparent opacity={0.9} toneMapped={false} />
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
            <boxGeometry args={[0.09, 0.2, 0.035]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>

          <mesh ref={thighLedRightRef} position={[0.07, -BODY.upperLegLength / 2, 0.02]}>
            <boxGeometry args={[0.01, 0.15, 0.02]} />
            <meshBasicMaterial color={CYBER.neonPurple} transparent opacity={0.8} toneMapped={false} />
          </mesh>

          <group ref={rightLowerLegRef} position={[0, -BODY.upperLegLength, 0]}>
            <mesh position={[0, -BODY.lowerLegLength / 2, 0]}>
              <capsuleGeometry args={[BODY.legThickness * 0.85, BODY.lowerLegLength - 0.14, 8, 16]} />
              <meshStandardMaterial color={CYBER.pants} metalness={0.4} roughness={0.6} />
            </mesh>

            <mesh position={[0, -BODY.lowerLegLength / 2, 0.05]}>
              <boxGeometry args={[0.07, 0.24, 0.03]} />
              <meshStandardMaterial color={CYBER.gold} metalness={0.9} roughness={0.15} />
            </mesh>

            <mesh position={[0, -BODY.lowerLegLength / 2, 0.07]}>
              <boxGeometry args={[0.04, 0.18, 0.01]} />
              <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.7} toneMapped={false} />
            </mesh>

            <mesh position={[0, -BODY.lowerLegLength - BODY.footHeight / 2 + 0.02, 0.03]}>
              <boxGeometry args={[0.1, BODY.footHeight + 0.02, BODY.footLength]} />
              <meshStandardMaterial color={CYBER.boots} metalness={0.6} roughness={0.4} />
            </mesh>

            <mesh ref={bootLedRightRef} position={[0, -BODY.lowerLegLength - 0.02, 0.12]}>
              <boxGeometry args={[0.09, 0.02, 0.1]} />
              <meshBasicMaterial color={CYBER.neonPink} transparent opacity={0.9} toneMapped={false} />
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
        {/* Lower torso */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[BODY.waistWidth + 0.04, 0.22, 0.18]} />
          <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Chest */}
        <mesh position={[0, 0.38, 0.01]}>
          <boxGeometry args={[BODY.shoulderWidth + 0.06, BODY.chestHeight, 0.2]} />
          <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
        </mesh>

        {/* High collar */}
        <mesh position={[0, 0.54, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.08, 12]} />
          <meshStandardMaterial color={CYBER.jacketHighlight} metalness={0.4} roughness={0.5} />
        </mesh>

        {/* Collar LED ring */}
        <mesh ref={neckLedRef} position={[0, 0.54, 0]}>
          <torusGeometry args={[0.09, 0.008, 8, 24]} />
          <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.8} toneMapped={false} />
        </mesh>

        {/* ===== POWER CORE - CENTER CHEST ===== */}
        <mesh ref={powerCoreRef} position={[0, 0.36, 0.115]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color={CYBER.powerCore} transparent opacity={0.9} toneMapped={false} />
        </mesh>

        {/* Power core outer ring */}
        <mesh position={[0, 0.36, 0.11]}>
          <torusGeometry args={[0.05, 0.008, 8, 24]} />
          <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.7} toneMapped={false} />
        </mesh>

        {/* Chest LED panel */}
        <mesh ref={chestLedRef} position={[0, 0.44, 0.115]}>
          <boxGeometry args={[0.12, 0.04, 0.01]} />
          <meshBasicMaterial color={CYBER.neonBlue} transparent opacity={0.8} toneMapped={false} />
        </mesh>

        {/* Chest side LEDs */}
        <mesh position={[-0.18, 0.38, 0.1]}>
          <boxGeometry args={[0.02, 0.08, 0.01]} />
          <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.7} toneMapped={false} />
        </mesh>
        <mesh position={[0.18, 0.38, 0.1]}>
          <boxGeometry args={[0.02, 0.08, 0.01]} />
          <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.7} toneMapped={false} />
        </mesh>

        {/* Shoulder pads - GOLD */}
        <mesh position={[-BODY.shoulderWidth / 2 - 0.04, 0.44, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.16]} />
          <meshStandardMaterial color={CYBER.gold} metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[BODY.shoulderWidth / 2 + 0.04, 0.44, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.16]} />
          <meshStandardMaterial color={CYBER.gold} metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Shoulder LEDs */}
        <mesh ref={shoulderLedLeftRef} position={[-BODY.shoulderWidth / 2 - 0.04, 0.44, 0.09]}>
          <boxGeometry args={[0.08, 0.04, 0.01]} />
          <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.9} toneMapped={false} />
        </mesh>
        <mesh ref={shoulderLedRightRef} position={[BODY.shoulderWidth / 2 + 0.04, 0.44, 0.09]}>
          <boxGeometry args={[0.08, 0.04, 0.01]} />
          <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.9} toneMapped={false} />
        </mesh>

        {/* Back spine LED - LONG */}
        <mesh ref={spineLedRef} position={[0, 0.3, -0.1]}>
          <boxGeometry args={[0.025, 0.35, 0.01]} />
          <meshBasicMaterial color={CYBER.neonPurple} transparent opacity={0.8} toneMapped={false} />
        </mesh>

        {/* Back LED strips - sides */}
        <mesh ref={backLedRef} position={[-0.08, 0.35, -0.1]}>
          <boxGeometry args={[0.015, 0.25, 0.01]} />
          <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.7} toneMapped={false} />
        </mesh>
        <mesh position={[0.08, 0.35, -0.1]}>
          <boxGeometry args={[0.015, 0.25, 0.01]} />
          <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.7} toneMapped={false} />
        </mesh>

        {/* ===== LEFT ARM ===== */}
        <group ref={leftUpperArmRef} position={[-BODY.shoulderWidth / 2 - 0.04, 0.42, 0]}>
          {/* Shoulder joint - CHROME */}
          <mesh position={[-0.02, 0, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Upper arm */}
          <mesh position={[0, -BODY.upperArmLength / 2, 0]}>
            <capsuleGeometry args={[BODY.armThickness + 0.01, BODY.upperArmLength - 0.1, 8, 16]} />
            <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Arm LED strip */}
          <mesh ref={leftArmLedRef} position={[-0.05, -BODY.upperArmLength / 2, 0]}>
            <boxGeometry args={[0.012, 0.18, 0.025]} />
            <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.9} toneMapped={false} />
          </mesh>

          {/* Arm armor plate */}
          <mesh position={[0, -BODY.upperArmLength / 2, 0.04]}>
            <boxGeometry args={[0.06, 0.12, 0.02]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.9} roughness={0.1} />
          </mesh>

          <group ref={leftLowerArmRef} position={[0, -BODY.upperArmLength, 0]}>
            {/* Elbow joint */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>

            {/* Lower arm - cybernetic */}
            <mesh position={[0, -BODY.lowerArmLength / 2, 0]}>
              <capsuleGeometry args={[BODY.armThickness * 0.85, BODY.lowerArmLength - 0.08, 8, 16]} />
              <meshStandardMaterial color={CYBER.jacketHighlight} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Wrist tech band */}
            <mesh position={[0, -BODY.lowerArmLength + 0.05, 0]}>
              <cylinderGeometry args={[0.045, 0.05, 0.07, 12]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>

            {/* Wrist LED */}
            <mesh ref={wristLedLeftRef} position={[0, -BODY.lowerArmLength + 0.05, 0.045]}>
              <boxGeometry args={[0.04, 0.05, 0.01]} />
              <meshBasicMaterial color={CYBER.neonGreen} transparent opacity={0.9} toneMapped={false} />
            </mesh>

            {/* Cybernetic hand */}
            <mesh position={[0, -BODY.lowerArmLength - 0.04, 0]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        </group>

        {/* ===== RIGHT ARM ===== */}
        <group ref={rightUpperArmRef} position={[BODY.shoulderWidth / 2 + 0.04, 0.42, 0]}>
          <mesh position={[0.02, 0, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>

          <mesh position={[0, -BODY.upperArmLength / 2, 0]}>
            <capsuleGeometry args={[BODY.armThickness + 0.01, BODY.upperArmLength - 0.1, 8, 16]} />
            <meshStandardMaterial color={CYBER.jacket} metalness={0.5} roughness={0.4} />
          </mesh>

          <mesh ref={rightArmLedRef} position={[0.05, -BODY.upperArmLength / 2, 0]}>
            <boxGeometry args={[0.012, 0.18, 0.025]} />
            <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.9} toneMapped={false} />
          </mesh>

          <mesh position={[0, -BODY.upperArmLength / 2, 0.04]}>
            <boxGeometry args={[0.06, 0.12, 0.02]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.9} roughness={0.1} />
          </mesh>

          <group ref={rightLowerArmRef} position={[0, -BODY.upperArmLength, 0]}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>

            <mesh position={[0, -BODY.lowerArmLength / 2, 0]}>
              <capsuleGeometry args={[BODY.armThickness * 0.85, BODY.lowerArmLength - 0.08, 8, 16]} />
              <meshStandardMaterial color={CYBER.jacketHighlight} metalness={0.6} roughness={0.4} />
            </mesh>

            <mesh position={[0, -BODY.lowerArmLength + 0.05, 0]}>
              <cylinderGeometry args={[0.045, 0.05, 0.07, 12]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
            </mesh>

            <mesh ref={wristLedRightRef} position={[0, -BODY.lowerArmLength + 0.05, 0.045]}>
              <boxGeometry args={[0.04, 0.05, 0.01]} />
              <meshBasicMaterial color={CYBER.neonGreen} transparent opacity={0.9} toneMapped={false} />
            </mesh>

            <mesh position={[0, -BODY.lowerArmLength - 0.04, 0]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color={CYBER.chrome} metalness={0.9} roughness={0.15} />
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

          {/* Neck tech rings - multiple */}
          <mesh position={[0, 0.02, 0]}>
            <torusGeometry args={[0.052, 0.008, 8, 24]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.01, 0]}>
            <torusGeometry args={[0.048, 0.006, 8, 24]} />
            <meshBasicMaterial color={CYBER.neonCyan} transparent opacity={0.6} toneMapped={false} />
          </mesh>

          {/* Head */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <sphereGeometry args={[BODY.headRadius, 16, 16]} />
            <meshStandardMaterial color={CYBER.skin} roughness={0.85} />
          </mesh>

          {/* Cyberpunk hair */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.04, -0.02]}>
            <sphereGeometry args={[BODY.headRadius * 0.85, 16, 16]} />
            <meshStandardMaterial color={CYBER.hair} roughness={0.9} metalness={0.1} />
          </mesh>

          {/* Top hair volume */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.08, -0.01]}>
            <boxGeometry args={[0.08, 0.04, 0.12]} />
            <meshStandardMaterial color={CYBER.hair} roughness={0.9} />
          </mesh>

          {/* Hair highlight LED */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.1, -0.06]}>
            <boxGeometry args={[0.04, 0.01, 0.06]} />
            <meshBasicMaterial color={CYBER.neonPurple} transparent opacity={0.5} toneMapped={false} />
          </mesh>

          {/* ===== VISOR / CYBER GLASSES - ULTIMATE ===== */}
          <mesh ref={visorRef} position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.088]}>
            <boxGeometry args={[0.22, 0.045, 0.035]} />
            <meshBasicMaterial color={CYBER.visor} transparent opacity={0.95} toneMapped={false} />
          </mesh>

          {/* Visor scanline effect */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.02, 0.091]}>
            <boxGeometry args={[0.2, 0.002, 0.01]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} toneMapped={false} />
          </mesh>
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.005, 0.091]}>
            <boxGeometry args={[0.2, 0.002, 0.01]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} toneMapped={false} />
          </mesh>

          {/* Visor frame - GOLD */}
          <mesh position={[0, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.08]}>
            <boxGeometry args={[0.24, 0.055, 0.02]} />
            <meshStandardMaterial color={CYBER.gold} metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Visor side connectors - CHROME */}
          <mesh position={[-0.12, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.04]}>
            <boxGeometry args={[0.025, 0.035, 0.1]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0.12, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.04]}>
            <boxGeometry args={[0.025, 0.035, 0.1]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Visor corner LEDs */}
          <mesh position={[-0.11, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.095]}>
            <boxGeometry args={[0.015, 0.04, 0.01]} />
            <meshBasicMaterial color={CYBER.neonRed} transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <mesh position={[0.11, BODY.neckHeight / 2 + BODY.headRadius + 0.01, 0.095]}>
            <boxGeometry args={[0.015, 0.04, 0.01]} />
            <meshBasicMaterial color={CYBER.neonRed} transparent opacity={0.9} toneMapped={false} />
          </mesh>

          {/* Ear tech implants - LARGER */}
          <mesh position={[-BODY.headRadius - 0.025, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.05]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[BODY.headRadius + 0.025, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.05]} />
            <meshStandardMaterial color={CYBER.chrome} metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Ear LEDs - BRIGHT */}
          <mesh ref={earLedLeftRef} position={[-BODY.headRadius - 0.045, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.95} toneMapped={false} />
          </mesh>
          <mesh ref={earLedRightRef} position={[BODY.headRadius + 0.045, BODY.neckHeight / 2 + BODY.headRadius, 0]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color={CYBER.neonMagenta} transparent opacity={0.95} toneMapped={false} />
          </mesh>

          {/* Secondary ear LEDs */}
          <mesh position={[-BODY.headRadius - 0.035, BODY.neckHeight / 2 + BODY.headRadius + 0.025, 0]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshBasicMaterial color={CYBER.neonCyan} toneMapped={false} />
          </mesh>
          <mesh position={[BODY.headRadius + 0.035, BODY.neckHeight / 2 + BODY.headRadius + 0.025, 0]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshBasicMaterial color={CYBER.neonCyan} toneMapped={false} />
          </mesh>

          {/* Temple circuit lines */}
          <mesh position={[-BODY.headRadius - 0.01, BODY.neckHeight / 2 + BODY.headRadius + 0.03, 0.04]}>
            <boxGeometry args={[0.008, 0.025, 0.04]} />
            <meshBasicMaterial color={CYBER.neonPurple} transparent opacity={0.6} toneMapped={false} />
          </mesh>
          <mesh position={[BODY.headRadius + 0.01, BODY.neckHeight / 2 + BODY.headRadius + 0.03, 0.04]}>
            <boxGeometry args={[0.008, 0.025, 0.04]} />
            <meshBasicMaterial color={CYBER.neonPurple} transparent opacity={0.6} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* ===== LIGHTING ===== */}
      {/* Main character glow - BRIGHTER */}
      <pointLight position={[0, 1.2, 0.5]} color={CYBER.neonCyan} intensity={1.5} distance={3} />

      {/* Power core glow */}
      <pointLight position={[0, 1.4, 0.2]} color={CYBER.powerCore} intensity={0.8} distance={2} />

      {/* Secondary accent lights */}
      <pointLight position={[-0.5, 0.8, 0]} color={CYBER.neonMagenta} intensity={0.4} distance={1.5} />
      <pointLight position={[0.5, 0.8, 0]} color={CYBER.neonMagenta} intensity={0.4} distance={1.5} />

      {/* Ground glow */}
      <pointLight position={[0, 0.1, 0]} color={CYBER.neonCyan} intensity={0.6} distance={1.5} />
    </group>
  )
}
